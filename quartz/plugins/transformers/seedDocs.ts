import { QuartzTransformerPlugin } from "../types"
import { BuildCtx } from "../../util/ctx"
import {
  seedFeatures,
  SEED_TAILWIND_ACCENTS,
  type SeedBadgeAccent,
  seedBadgeAccentForRegistryKey,
  seedBadgeAccentForAdHoc,
} from "../../constants/seedFeatures"
import { visit } from "unist-util-visit"
import { Element, ElementContent, Parent, Root } from "hast"
import type { VFile } from "vfile"
import fs from "fs"
import path from "path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"

type LinkGridItem = {
  href?: string
  to?: string
  title: string
  description?: string
}

const requireFromQuartz = createRequire(import.meta.url)

/** Read `data-{kebab}` from hast (e.g. `seed` → `dataSeed`, `items` → `dataItems`). */
function dataProp(node: Element, kebabAfterData: string): string | undefined {
  const p = node.properties ?? {}
  const camelKey =
    "data" +
    kebabAfterData
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("")
  const v =
    (p as Record<string, unknown>)[camelKey] ??
    (p as Record<string, unknown>)[`data-${kebabAfterData}`]
  if (v === undefined || v === null) return undefined
  return Array.isArray(v) ? String(v[0]) : String(v)
}

function normalizeVaultHref(raw: string): string {
  let s = raw.trim()
  if (s.startsWith("/")) s = s.slice(1)
  return s
}

function parseLinkItemsArray(data: unknown): LinkGridItem[] | null {
  if (!Array.isArray(data)) return null
  const items: LinkGridItem[] = []
  for (const el of data) {
    if (!el || typeof el !== "object") continue
    const o = el as Record<string, unknown>
    const title = typeof o.title === "string" ? o.title : ""
    const href = typeof o.href === "string" ? o.href : undefined
    const to = typeof o.to === "string" ? o.to : undefined
    const description = typeof o.description === "string" ? o.description : undefined
    if (!title) continue
    items.push({ title, href, to, description })
  }
  return items.length ? items : null
}

function parseLinkItems(json: string | undefined): LinkGridItem[] | null {
  if (!json?.trim()) return null
  try {
    return parseLinkItemsArray(JSON.parse(json) as unknown)
  } catch {
    return null
  }
}

/** `/foo.json` → under Quartz content root; otherwise relative to the markdown file. */
function resolveItemsSourcePath(src: string, ctx: BuildCtx, markdownFilePath: string): string {
  const normalized = src.replace(/\\/g, "/")
  if (normalized.startsWith("/")) {
    return path.join(ctx.argv.directory, normalized.slice(1))
  }
  return path.join(path.dirname(markdownFilePath), normalized)
}

async function loadItemsFromFile(absPath: string): Promise<LinkGridItem[] | null> {
  if (!fs.existsSync(absPath)) return null
  const ext = path.extname(absPath).toLowerCase()
  try {
    if (ext === ".json") {
      const text = await fs.promises.readFile(absPath, "utf8")
      return parseLinkItems(text)
    }
    if (ext === ".cjs") {
      const mod = requireFromQuartz(absPath) as unknown
      const data =
        mod && typeof mod === "object" && "default" in (mod as object)
          ? (mod as { default: unknown }).default
          : mod
      return parseLinkItemsArray(data)
    }
    if (ext === ".js" || ext === ".mjs") {
      const mod = await import(pathToFileURL(absPath).href)
      const data = mod.default ?? mod
      return parseLinkItemsArray(data)
    }
  } catch (err) {
    console.warn(`[SeedDocs] Failed to load link-grid file ${absPath}:`, err)
  }
  return null
}

async function loadLinkGridItems(
  node: Element,
  ctx: BuildCtx,
  markdownFilePath: string,
): Promise<LinkGridItem[] | null> {
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

function h(tag: string, props: Element["properties"], children: ElementContent[]): Element {
  return {
    type: "element",
    tagName: tag,
    properties: props,
    children,
  }
}

function t(value: string): ElementContent {
  return { type: "text", value }
}

function buildLinkGrid(items: LinkGridItem[]): Element | null {
  const grid = h("div", { className: ["seed-link-grid"] }, [] as ElementContent[])
  const accents = SEED_TAILWIND_ACCENTS
  let accentIndex = 0

  for (const item of items) {
    const p = item.href ?? item.to
    if (!p || !item.title) continue
    const href = normalizeVaultHref(p)
    const tw = accents[accentIndex % accents.length]!
    accentIndex += 1
    const card = h("a", { href, className: ["seed-link-card", `seed-link-card--${tw}`] }, [
      h("h3", { className: ["seed-link-card__title"] }, [t(item.title)]),
    ])
    ;(grid.children as ElementContent[]).push(card)
  }

  return grid.children.length > 0 ? grid : null
}

export const SeedDocs: QuartzTransformerPlugin = () => ({
  name: "SeedDocs",
  htmlPlugins(ctx: BuildCtx) {
    return [
      () => {
        return async (tree: Root, file: VFile) => {
          const markdownFilePath = file.path
          if (!markdownFilePath) return

          const linkGridJobs: { parent: Parent; index: number; node: Element }[] = []

          visit(tree, "element", (node, index, parent) => {
            if (!parent || typeof index !== "number") return

            const kind = dataProp(node, "seed")
            if (kind === "link-grid") {
              linkGridJobs.push({ parent, index, node })
              return
            }

            if (kind === "feature-grid") {
              const badges: Element[] = []

              const childBadges = (node.children as ElementContent[]).filter(
                (c): c is Element =>
                  c.type === "element" && dataProp(c, "seed") === "feature-badge",
              )

              if (childBadges.length > 0) {
                for (const ch of childBadges) {
                  const title = dataProp(ch, "title")
                  const description = dataProp(ch, "description") ?? ""
                  const icon = dataProp(ch, "icon")
                  const accentHint = dataProp(ch, "accent") ?? dataProp(ch, "color")
                  if (!title) continue
                  badges.push(
                    makeBadgeElement(
                      title,
                      description,
                      icon,
                      seedBadgeAccentForAdHoc(title, accentHint),
                    ),
                  )
                }
              } else {
                const keys = dataProp(node, "features")
                  ?.split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                if (keys) {
                  for (const key of keys) {
                    const f = seedFeatures[key]
                    if (!f) continue
                    badges.push(
                      makeBadgeElement(
                        f.title,
                        f.description,
                        f.icon,
                        seedBadgeAccentForRegistryKey(key),
                      ),
                    )
                  }
                }
              }

              if (badges.length === 0) return
              parent.children[index] = h("div", { className: ["seed-feature-grid"] }, badges)
            }
          })

          for (const job of linkGridJobs) {
            const items = await loadLinkGridItems(job.node, ctx, markdownFilePath)
            if (!items?.length) continue
            const grid = buildLinkGrid(items)
            if (grid) job.parent.children[job.index] = grid
          }
        }
      },
    ]
  },
})

function makeBadgeElement(
  title: string,
  description: string,
  icon: string | undefined,
  accent: SeedBadgeAccent,
): Element {
  const hasPopover = description.trim().length > 0
  const ariaLabel = hasPopover ? `${title}: ${description.trim()}` : undefined

  const badgeInner: ElementContent[] = []
  if (icon) {
    badgeInner.push(h("span", { className: ["seed-feature-badge__icon"] }, [t(icon)]))
  }
  badgeInner.push(h("strong", { className: ["seed-feature-badge__title"] }, [t(title)]))

  const badgeProps: Element["properties"] = {
    className: ["seed-feature-badge"],
  }
  if (hasPopover) {
    badgeProps.tabIndex = 0
    badgeProps.ariaLabel = ariaLabel
  }

  const badge = h("div", badgeProps, badgeInner)

  const popover = hasPopover
      ? h(
          "div",
          {
            className: ["seed-feature-badge__popover"],
            role: "tooltip",
            ariaHidden: true,
          },
          [h("p", { className: ["seed-feature-badge__popover-text"] }, [t(description.trim())])],
        )
    : null

  return h(
    "div",
    { className: ["seed-feature-badge-shell", `seed-feature-badge-shell--${accent}`] },
    popover ? [badge, popover] : [badge],
  )
}
