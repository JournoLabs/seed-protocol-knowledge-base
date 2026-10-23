import { h } from "preact"
import { classNames, joinSegments, pathToRoot } from "@quartz-community/utils"

/**
 * Site title with the Seed Protocol logo. Replaces the @quartz-community/page-title component.
 * Logo files live in quartz/static/branches.{svg,png}.
 * @type {import("@quartz-community/types").QuartzComponent}
 */
const PageTitle = ({ fileData, cfg, displayClass }) => {
  const title = cfg?.pageTitle ?? "Untitled"
  const baseDir = pathToRoot(fileData.slug)
  const svgSrc = joinSegments(baseDir, "static/branches.svg")
  const pngSrc = joinSegments(baseDir, "static/branches.png")
  return h(
    "h2",
    { class: classNames(displayClass, "page-title") },
    h(
      "a",
      { href: baseDir, class: "page-title-link" },
      h(
        "picture",
        { class: "page-title-brand" },
        h("source", { type: "image/svg+xml", srcSet: svgSrc }),
        h("img", {
          class: "page-title-logo",
          src: pngSrc,
          alt: "",
          width: "36",
          height: "36",
          decoding: "async",
        }),
      ),
      h("span", { class: "page-title-text" }, title),
    ),
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
}

.page-title-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
}

.page-title-link:hover {
  color: var(--secondary);
}

.page-title-brand {
  display: contents;
}

.page-title-logo {
  height: 1.75rem;
  width: auto;
  flex-shrink: 0;
  object-fit: contain;
}
`

/** @type {import("@quartz-community/types").QuartzComponentConstructor} */
export const SeedPageTitle = () => PageTitle
