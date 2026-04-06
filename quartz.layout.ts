import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import type { FileNode } from "./quartz/components/ExplorerNode"

/** Explorer order for direct children of the content root only. */
function explorerSortFn(a: FileNode, b: FileNode): number {
  const rank = (n: FileNode): [number, number, string] => {
    if (n.depth === 1) {
      if (n.name === "why") return [0, 0, ""]
      if (n.name === "use_cases") return [0, 1, ""]
    }
    const folderFirst = n.file ? 1 : 0
    return [1, folderFirst, n.displayName]
  }
  const ra = rank(a)
  const rb = rank(b)
  if (ra[0] !== rb[0]) return ra[0] - rb[0]
  if (ra[1] !== rb[1]) return ra[1] - rb[1]
  return ra[2].localeCompare(rb[2], undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

const explorerProps = { sortFn: explorerSortFn }

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      PermaPress: "https://permapress.xyz",
      JournoDAO: "https://journodao.xyz",
      GitHub: "https://github.com/JournoDAO/seed-protocol-knowledge-base",
      // "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer(explorerProps)),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer(explorerProps)),
  ],
  right: [],
}
