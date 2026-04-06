/** Feature badge copy for Seed docs (ported from Docusaurus-style constants). */

/**
 * Tailwind v3 default palette names (400/500/600 hex in seed-docs.scss).
 * Order is hue-spaced so consecutive registry feature indices (sorted by id) stay visually distinct.
 * Keep in sync with `$seed-link-tailwind-accents` in quartz/styles/seed-docs.scss.
 */
export const SEED_TAILWIND_ACCENTS = [
  "red",
  "cyan",
  "lime",
  "fuchsia",
  "amber",
  "indigo",
  "rose",
  "teal",
  "orange",
  "violet",
  "sky",
  "emerald",
  "pink",
  "yellow",
  "blue",
] as const

export type SeedBadgeAccent = (typeof SEED_TAILWIND_ACCENTS)[number]

export type SeedFeature = {
  title: string
  description: string
  /** Short label shown in the badge (emoji or single character) */
  icon?: string
}

export const seedFeatures: Record<string, SeedFeature> = {
  permanentStorage: {
    icon: "∞",
    title: "Permanent storage",
    description:
      "Content anchored on durable networks so it does not depend on a single host or institution.",
  },
  institutionIndependent: {
    icon: "◎",
    title: "Institution independent",
    description:
      "Your work remains accessible even if a university, journal, or vendor changes systems.",
  },
  censorshipResistant: {
    icon: "⛓",
    title: "Censorship resistant",
    description:
      "Publishing and attestations live on infrastructure that is hard to unilaterally take down.",
  },
  publicAccess: {
    icon: "◉",
    title: "Public access",
    description:
      "Discoverable, queryable records without a single gatekeeper controlling visibility.",
  },
  schemaDiscovery: {
    icon: "◇",
    title: "Schema-based discovery",
    description:
      "Structured data helps others find related work through shared models, not only keywords.",
  },
  liveCitations: {
    icon: "↗",
    title: "Live citations",
    description:
      "References can stay connected to evolving underlying work instead of freezing as static footnotes.",
  },
  ownYourWork: {
    icon: "✦",
    title: "Own your work",
    description:
      "Your portfolio and process are tied to open protocols, not a platform’s terms of service.",
  },
  auditableTrail: {
    icon: "✓",
    title: "Auditable trail",
    description: "Versioning and timestamps support transparent research and publication history.",
  },
  permanentLinks: {
    icon: "🔗",
    title: "Permanent links",
    description: "URLs and references stay meaningful without subscription or account continuity.",
  },
  portableAudience: {
    icon: "→",
    title: "Portable audience",
    description: "Relationships and reach are not locked to one app’s follower graph or algorithm.",
  },
}

/** Sorted registry ids — each maps to `SEED_TAILWIND_ACCENTS[index]` for stable badge colors. */
export const SEED_FEATURE_IDS_SORTED: readonly string[] = Object.freeze(
  Object.keys(seedFeatures).sort(),
)

if (SEED_FEATURE_IDS_SORTED.length > SEED_TAILWIND_ACCENTS.length) {
  console.warn(
    `[seedFeatures] ${SEED_FEATURE_IDS_SORTED.length} feature ids but only ${SEED_TAILWIND_ACCENTS.length} accent slots — extend SEED_TAILWIND_ACCENTS and seed-docs.scss`,
  )
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

export function isSeedBadgeAccent(s: string): s is SeedBadgeAccent {
  return (SEED_TAILWIND_ACCENTS as readonly string[]).includes(s.trim().toLowerCase())
}

/** Accent for a known `data-features` registry id (unique slot while palette length ≥ feature count). */
export function seedBadgeAccentForRegistryKey(key: string): SeedBadgeAccent {
  const i = SEED_FEATURE_IDS_SORTED.indexOf(key)
  if (i !== -1) {
    const accent = SEED_TAILWIND_ACCENTS[i]
    if (accent !== undefined) return accent
  }
  const accents = SEED_TAILWIND_ACCENTS
  return accents[Math.abs(hashString(key)) % accents.length]!
}

/** Accent for manual `feature-badge` nodes: optional `data-accent` / `data-color`, else hash of title. */
export function seedBadgeAccentForAdHoc(accentOrTitleHint: string, explicitAccent?: string): SeedBadgeAccent {
  const raw = explicitAccent?.trim()
  if (raw && isSeedBadgeAccent(raw)) {
    return raw.toLowerCase() as SeedBadgeAccent
  }
  const accents = SEED_TAILWIND_ACCENTS
  return accents[Math.abs(hashString(accentOrTitleHint)) % accents.length]!
}
