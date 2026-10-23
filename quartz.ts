import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"

// Explorer sort order. Set on the registry directly because `ExternalPlugin.Explorer({...})`
// from the docs is a no-op for npm-installed plugins as of Quartz 5.0: the generated
// .quartz/plugins index doesn't follow the plugin's re-exported types, and layout lookups key
// overrides by the plugin's source string.
componentRegistry.setOptionOverrides("@quartz-community/explorer", {
  // Pin "why" then "use_cases" to the top of the content root, then folders before files, by name.
  // The explorer serializes this function to the browser, so it must not reference outer scope.
  sortFn: (a: any, b: any) => {
    const pinned = ["why", "use_cases"]
    const ra = a.slugSegments.length === 1 ? pinned.indexOf(a.slugSegment) : -1
    const rb = b.slugSegments.length === 1 ? pinned.indexOf(b.slugSegment) : -1
    if (ra !== -1 || rb !== -1) {
      if (ra === -1) return 1
      if (rb === -1) return -1
      return ra - rb
    }
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
    return a.displayName.localeCompare(b.displayName, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  },
})

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
