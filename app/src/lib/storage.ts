export type SavedGroup = { groupToken: string; name: string }
export type PendingJoin = { groupToken: string; groupName: string }

const KEYS = {
  token: 'mandatoto:v1:token',
  draft: 'mandatoto:v1:local-draft',
  lockedPcts: 'mandatoto:v1:locked-pcts',
  groups: 'mandatoto:v1:groups',
  pendingJoin: 'mandatoto:v1:pending-join',
  legacyDraft: 'mandatoto:v1:draft',
  dismissedBanners: 'mandatoto:v1:dismissed-banners',
} as const

export const STORAGE_KEYS = KEYS

function getJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function setJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded or private browsing */ }
}

function getString(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch { /* quota exceeded or private browsing */ }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch { /* ignore */ }
}

export const storage = {
  getToken: () => getString(KEYS.token),
  setToken: (token: string) => setString(KEYS.token, token),
  removeToken: () => remove(KEYS.token),

  getDraft: <T>() => getJSON<T>(KEYS.draft),
  setDraft: <T>(draft: T) => setJSON(KEYS.draft, draft),
  removeDraft: () => remove(KEYS.draft),

  getLockedPcts: () => getJSON<Record<string, boolean>>(KEYS.lockedPcts),
  setLockedPcts: (locked: Record<string, boolean>) => setJSON(KEYS.lockedPcts, locked),
  removeLockedPcts: () => remove(KEYS.lockedPcts),

  getGroups: (): SavedGroup[] => getJSON<SavedGroup[]>(KEYS.groups) ?? [],
  setGroups: (groups: SavedGroup[]) => setJSON(KEYS.groups, groups),
  removeGroups: () => remove(KEYS.groups),

  getPendingJoin: () => getJSON<PendingJoin>(KEYS.pendingJoin),
  setPendingJoin: (pending: PendingJoin) => setJSON(KEYS.pendingJoin, pending),
  removePendingJoin: () => remove(KEYS.pendingJoin),

  getLegacyDraft: <T>() => getJSON<T>(KEYS.legacyDraft),
  removeLegacyDraft: () => remove(KEYS.legacyDraft),

  getDismissedBanners: (): string[] => getJSON<string[]>(KEYS.dismissedBanners) ?? [],
  addDismissedBanner: (id: string) => {
    const current: string[] = getJSON<string[]>(KEYS.dismissedBanners) ?? []
    if (!current.includes(id)) setJSON(KEYS.dismissedBanners, [...current, id])
  },

  clearAll: () => {
    Object.values(KEYS).forEach(remove)
  },
} as const
