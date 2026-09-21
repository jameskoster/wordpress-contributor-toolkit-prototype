import { DEFAULT_SETTINGS, normalizeSettings, placeholderPath } from './settings'
import type { AppSettings, CheckoutType, PhpVersion, Site } from './types'

const STORAGE_KEY = 'wct.sites'
const TRAY_HEIGHT_KEY = 'wct.trayHeight'
const SETTINGS_KEY = 'wct.settings'
const RESTART_SITES_KEY = 'wct.restartSiteIds'
const SIDEBAR_OPEN_KEY = 'wct.sidebarOpen'
const SIDEBAR_SECTIONS_KEY = 'wct.sidebarSections'

export type StoredSites = {
  sites: Site[]
  currentId: string | null
}

function isSite(value: unknown): value is Site {
  if (!value || typeof value !== 'object') {
    return false
  }

  const site = value as Site
  return (
    typeof site.id === 'string' &&
    typeof site.name === 'string' &&
    typeof site.path === 'string' &&
    typeof site.created === 'string' &&
    typeof site.trunkAsOf === 'string'
  )
}

function asPhpVersion(value: unknown): PhpVersion {
  return value === '8.2' || value === '8.3' || value === '8.4'
    ? value
    : DEFAULT_SETTINGS.phpVersion
}

function asCheckoutType(value: unknown): CheckoutType {
  if (value === 'gutenberg' || value === 'core-gutenberg') {
    return 'gutenberg'
  }

  return 'core'
}

function normalizeSite(site: Site): Site {
  return {
    ...site,
    path: placeholderPath(site.path),
    ticket: site.ticket ?? null,
    patch: site.patch ?? null,
    serverOnline: Boolean(site.serverOnline),
    watchOnline: Boolean(site.watchOnline),
    phpVersion: asPhpVersion(site.phpVersion),
    wpDebug: typeof site.wpDebug === 'boolean' ? site.wpDebug : DEFAULT_SETTINGS.wpDebug,
    scriptDebug:
      typeof site.scriptDebug === 'boolean'
        ? site.scriptDebug
        : DEFAULT_SETTINGS.scriptDebug,
    checkoutType: asCheckoutType(site.checkoutType),
    adminUsername:
      typeof site.adminUsername === 'string' && site.adminUsername.trim()
        ? site.adminUsername
        : DEFAULT_SETTINGS.adminUsername,
    adminPassword:
      typeof site.adminPassword === 'string' && site.adminPassword.trim()
        ? site.adminPassword
        : DEFAULT_SETTINGS.adminPassword,
  }
}

export function loadStoredSites(): StoredSites {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { sites: [], currentId: null }
    }

    const parsed = JSON.parse(raw) as Partial<StoredSites>
    const sites = Array.isArray(parsed.sites)
      ? parsed.sites.filter(isSite).map(normalizeSite)
      : []
    const currentId =
      typeof parsed.currentId === 'string' &&
      sites.some((site) => site.id === parsed.currentId)
        ? parsed.currentId
        : (sites.at(-1)?.id ?? null)

    return { sites, currentId }
  } catch {
    return { sites: [], currentId: null }
  }
}

export function saveStoredSites(state: StoredSites) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function currentSiteFromStore(state: StoredSites) {
  return (
    state.sites.find((site) => site.id === state.currentId) ??
    state.sites.at(-1) ??
    null
  )
}

export function loadTrayHeight(): number | null {
  try {
    const raw = window.localStorage.getItem(TRAY_HEIGHT_KEY)
    if (!raw) {
      return null
    }

    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  } catch {
    return null
  }
}

export function saveTrayHeight(height: number) {
  window.localStorage.setItem(TRAY_HEIGHT_KEY, String(height))
}

export function loadSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    return normalizeSettings(raw ? JSON.parse(raw) : null)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadRestartSiteIds(): string[] {
  try {
    const raw = window.localStorage.getItem(RESTART_SITES_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

export function saveRestartSiteIds(ids: string[]) {
  if (ids.length) {
    window.localStorage.setItem(RESTART_SITES_KEY, JSON.stringify(ids))
    return
  }

  window.localStorage.removeItem(RESTART_SITES_KEY)
}

export function loadSidebarOpen(): boolean {
  try {
    window.localStorage.removeItem(SIDEBAR_SECTIONS_KEY)
    const raw = window.localStorage.getItem(SIDEBAR_OPEN_KEY)
    if (raw === null) {
      return true
    }

    return raw === 'true'
  } catch {
    return true
  }
}

export function saveSidebarOpen(open: boolean) {
  window.localStorage.setItem(SIDEBAR_OPEN_KEY, String(open))
}
