import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { visit } from "unist-util-visit"
import {
  seedFeatures,
  SEED_TAILWIND_ACCENTS,
  seedBadgeAccentForRegistryKey,
  seedBadgeAccentForAdHoc,
} from "./features.js"

/** @typedef {import("hast").Element} Element */
/** @typedef {import("hast").ElementContent} ElementContent */
/** @typedef {{ href?: string, to?: string, title: string, description?: string }} LinkGridItem */

const readScript = (name) => fs.readFileSync(new URL(`./scripts/${name}`, import.meta.url), "utf8")
const featureBadgesScript = readScript("featureBadges.inline.js")
const darkDefaultScript = readScript("darkDefault.inline.js")

/**
 * Read `data-{kebab}` from hast (e.g. `seed` → `dataSeed`, `items` → `dataItems`).
 * @param {Element} node
 * @param {string} kebabAfterData
 * @returns {string | undefined}
 */
function dataProp(node, kebabAfterData) {
  const p = node.properties ?? {}
  const camelKey =
    "data" +
    kebabAfterData
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("")
  const v = p[camelKey] ?? p[`data-${kebabAfterData}`]
  if (v === undefined || v === null) return undefined
  return Array.isArray(v) ? String(v[0]) : String(v)
}

/** @param {string} raw */
function normalizeVaultHref(raw) {
  let s = raw.trim()
  if (s.startsWith("/")) s = s.slice(1)
  return s
}

/**
 * @param {unknown} data
 * @returns {LinkGridItem[] | null}
 */
function parseLinkItemsArray(data) {
  if (!Array.isArray(data)) return null
  const items = []
  for (const el of data) {
    if (!el || typeof el !== "object") continue
    const title = typeof el.title === "string" ? el.title : ""
    const href = typeof el.href === "string" ? el.href : undefined
    const to = typeof el.to === "string" ? el.to : undefined
    const description = typeof el.description === "string" ? el.description : undefined
    if (!title) continue
    items.push({ title, href, to, description })
  }
  return items.length ? items : null
}

/** @param {string | undefined} json */
function parseLinkItems(json) {
  if (!json?.trim()) return null
  try {
    return parseLinkItemsArray(JSON.parse(json))
  } catch {
    return null
  }
}

/** `/foo.json` → under Quartz content root; otherwise relative to the markdown file. */
function resolveItemsSourcePath(src, ctx, markdownFilePath) {
  const normalized = src.replace(/\\/g, "/")
  if (normalized.startsWith("/")) {
    return path.join(ctx.argv.directory, normalized.slice(1))
  }
  return path.join(path.dirname(markdownFilePath), normalized)
}

/** Load link-grid items from a `.json`, `.js`, `.mjs` or `.cjs` file. */
async function loadItemsFromFile(absPath) {
  if (!fs.existsSync(absPath)) return null
  const ext = path.extname(absPath).toLowerCase()
  try {
    if (ext === ".json") {
      return parseLinkItems(await fs.promises.readFile(absPath, "utf8"))
    }
    if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
      const mod = await import(pathToFileURL(absPath).href)
      return parseLinkItemsArray(mod.default ?? mod)
    }
  } catch (err) {
    console.warn(`[SeedDocs] Failed to load link-grid file ${absPath}:`, err)
  }
  return null
}

async function loadLinkGridItems(node, ctx, markdownFilePath) {
  const src = dataProp(node, "items-src")
  if (src?.trim()) {
    const abs = resolveItemsSourcePath(src.trim(), ctx, markdownFilePath)
    const fromFile = await loadItemsFromFile(abs)
    if (fromFile?.length) return fromFile
    console.warn(
      `[SeedDocs] link-grid: could not load items from ${abs} (data-items-src="${src.trim()}")`,
    )
  }
  return parseLinkItems(dataProp(node, "items"))
}

/**
 * @param {string} tag
 * @param {Element["properties"]} props
 * @param {ElementContent[]} children
 * @returns {Element}
 */
function h(tag, props, children) {
  return { type: "element", tagName: tag, properties: props, children }
}

/** @returns {ElementContent} */
function t(value) {
  return { type: "text", value }
}

/** @param {LinkGridItem[]} items */
function buildLinkGrid(items) {
  const grid = h("div", { className: ["seed-link-grid"] }, [])
  let accentIndex = 0

  for (const item of items) {
    const p = item.href ?? item.to
    if (!p || !item.title) continue
    const accent = SEED_TAILWIND_ACCENTS[accentIndex % SEED_TAILWIND_ACCENTS.length]
    accentIndex += 1
    grid.children.push(
      h(
        "a",
        { href: normalizeVaultHref(p), className: ["seed-link-card", `seed-link-card--${accent}`] },
        [h("h3", { className: ["seed-link-card__title"] }, [t(item.title)])],
      ),
    )
  }

  return grid.children.length > 0 ? grid : null
}

/**
 * @param {string} title
 * @param {string} description
 * @param {string | undefined} icon
 * @param {string} accent
 */
function makeBadgeElement(title, description, icon, accent) {
  const hasPopover = description.trim().length > 0

  const badgeInner = []
  if (icon) {
    badgeInner.push(h("span", { className: ["seed-feature-badge__icon"] }, [t(icon)]))
  }
  badgeInner.push(h("strong", { className: ["seed-feature-badge__title"] }, [t(title)]))

  const badgeProps = { className: ["seed-feature-badge"] }
  if (hasPopover) {
    badgeProps.tabIndex = 0
    badgeProps.ariaLabel = `${title}: ${description.trim()}`
  }

  const badge = h("div", badgeProps, badgeInner)

  const popover = hasPopover
    ? h("div", { className: ["seed-feature-badge__popover"], role: "tooltip", ariaHidden: true }, [
        h("p", { className: ["seed-feature-badge__popover-text"] }, [t(description.trim())]),
      ])
    : null

  return h(
    "div",
    { className: ["seed-feature-badge-shell", `seed-feature-badge-shell--${accent}`] },
    popover ? [badge, popover] : [badge],
  )
}

/** @param {Element} node */
function buildFeatureGrid(node) {
  const badges = []

  const childBadges = node.children.filter(
    (c) => c.type === "element" && dataProp(c, "seed") === "feature-badge",
  )

  if (childBadges.length > 0) {
    for (const ch of childBadges) {
      const title = dataProp(ch, "title")
      if (!title) continue
      const accentHint = dataProp(ch, "accent") ?? dataProp(ch, "color")
      badges.push(
        makeBadgeElement(
          title,
          dataProp(ch, "description") ?? "",
          dataProp(ch, "icon"),
          seedBadgeAccentForAdHoc(title, accentHint),
        ),
      )
    }
  } else {
    const keys = dataProp(node, "features")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    for (const key of keys ?? []) {
      const f = seedFeatures[key]
      if (!f) continue
      badges.push(
        makeBadgeElement(f.title, f.description, f.icon, seedBadgeAccentForRegistryKey(key)),
      )
    }
  }

  return badges.length > 0 ? h("div", { className: ["seed-feature-grid"] }, badges) : null
}

/**
 * Replaces `<div data-seed="link-grid">` and `<div data-seed="feature-grid">` blocks in content
 * with rendered card and badge grids. Styles live in quartz/styles/seed-docs.scss.
 * @type {import("@quartz-community/types").QuartzTransformerPlugin}
 */
export const SeedDocs = () => ({
  name: "SeedDocs",
  htmlPlugins(ctx) {
    return [
      () => async (tree, file) => {
        const markdownFilePath = file.path
        if (!markdownFilePath) return

        const linkGridJobs = []

        visit(tree, "element", (node, index, parent) => {
          if (!parent || typeof index !== "number") return

          const kind = dataProp(node, "seed")
          if (kind === "link-grid") {
            linkGridJobs.push({ parent, index, node })
          } else if (kind === "feature-grid") {
            const grid = buildFeatureGrid(node)
            if (grid) parent.children[index] = grid
          }
        })

        for (const job of linkGridJobs) {
          const items = await loadLinkGridItems(job.node, ctx, markdownFilePath)
          if (!items?.length) continue
          const grid = buildLinkGrid(items)
          if (grid) job.parent.children[job.index] = grid
        }
      },
    ]
  },
  externalResources() {
    return {
      js: [
        { script: darkDefaultScript, loadTime: "beforeDOMReady", contentType: "inline" },
        { script: featureBadgesScript, loadTime: "afterDOMReady", contentType: "inline" },
      ],
    }
  },
})

export default SeedDocs
