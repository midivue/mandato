declare const __BUILD_COMMIT_HASH__: string
declare const __BUILD_TAG__: string
declare const __BUILD_DATE__: string

export const BUILD_COMMIT_HASH: string = __BUILD_COMMIT_HASH__

/** Semver tag (e.g. "v0.9.1") on release builds, "dev" otherwise. */
export const BUILD_TAG: string = __BUILD_TAG__

/** ISO date + time of the build (YYYY-MM-DD HH:MM). */
export const BUILD_DATE: string = __BUILD_DATE__

/** True on a tagged release build (main), false on dev/local. */
export const IS_RELEASE_BUILD: boolean = BUILD_TAG !== 'dev'

/**
 * GitHub repository slug. Change this once when migrating to the final repo.
 * Dev builds link here; release builds will eventually link to midivue/mandato.
 */
export const GITHUB_REPO = 'midivue/mandato'

const GITHUB_BASE = `https://github.com/${GITHUB_REPO}`

/** Link to the exact commit — always points to the current repo. */
export const COMMIT_HREF = `${GITHUB_BASE}/commit/${BUILD_COMMIT_HASH}`

/** Link to the GitHub Release page — only meaningful on release builds. */
export const RELEASE_HREF = IS_RELEASE_BUILD
  ? `${GITHUB_BASE}/releases/tag/${BUILD_TAG}`
  : null

export const FOOTER_CREDIT_MIDI_HREF = 'https://github.com/midivue'
export const FOOTER_CREDIT_OAK_HREF = 'https://oaktree.digital'
