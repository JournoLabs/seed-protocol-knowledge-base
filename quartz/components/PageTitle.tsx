import { joinSegments, pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  const svgSrc = joinSegments(baseDir, "static/branches.svg")
  const pngSrc = joinSegments(baseDir, "static/branches.png")
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir} class="page-title-link">
        <picture class="page-title-brand">
          <source type="image/svg+xml" srcSet={svgSrc} />
          <img
            class="page-title-logo"
            src={pngSrc}
            alt=""
            width="36"
            height="36"
            decoding="async"
          />
        </picture>
        <span class="page-title-text">{title}</span>
      </a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
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

export default (() => PageTitle) satisfies QuartzComponentConstructor
