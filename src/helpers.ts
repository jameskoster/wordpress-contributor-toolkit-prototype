import { useEffect, useState } from 'react'
import type { AdminTheme } from './types'

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

export function prefersDarkScheme() {
  return window.matchMedia(DARK_SCHEME_QUERY).matches
}

export function usePrefersDarkScheme() {
  const [prefersDark, setPrefersDark] = useState(prefersDarkScheme)

  useEffect(() => {
    const media = window.matchMedia(DARK_SCHEME_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return prefersDark
}

export function isDarkAdminTheme(theme: AdminTheme, prefersDark: boolean) {
  return theme === 'dark' || (theme === 'system' && prefersDark)
}

export const THEME_PRIMARY = '#3858e9'
export const THEME_BACKGROUND_LIGHT = '#fcfcfc'
const THEME_BACKGROUND_DARK = '#1e1e1e'
const THEME_BACKGROUND_TINT_LIGHT = 0.03

function hexToRgb(hex: string) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3 ? value.replace(/./g, (digit) => `${digit}${digit}`) : value
  const n = Number.parseInt(normalized, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`
}

function tintHex(base: string, tint: string, amount: number) {
  const [baseR, baseG, baseB] = hexToRgb(base)
  const [tintR, tintG, tintB] = hexToRgb(tint)
  return rgbToHex(
    baseR + (tintR - baseR) * amount,
    baseG + (tintG - baseG) * amount,
    baseB + (tintB - baseB) * amount
  )
}

export function getThemeColorSeeds(
  theme: AdminTheme,
  prefersDark: boolean,
  customColors: { background: string; accent: string }
) {
  if (theme === 'custom') {
    return {
      primary: customColors.accent,
      background: customColors.background,
    }
  }

  const darkMode = isDarkAdminTheme(theme, prefersDark)
  return {
    primary: THEME_PRIMARY,
    background: darkMode
      ? THEME_BACKGROUND_DARK
      : tintHex(THEME_BACKGROUND_LIGHT, THEME_PRIMARY, THEME_BACKGROUND_TINT_LIGHT),
  }
}

export const PLACEHOLDER_HOME = '/Users/rileyhart'

export function folderPathFromFiles(files: FileList | null) {
  const file = files?.[0]
  if (!file) {
    return ''
  }

  const folder = file.webkitRelativePath.split('/')[0]
  return `${PLACEHOLDER_HOME}/${folder || 'sites'}`
}

export function slugifySiteName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9-_]/g, '')
    .replace(/-+/g, '-')
}

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function yesterdayLabel() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return formatDate(date)
}

export function formatTimeAgo(at: number, now: number) {
  const seconds = Math.max(0, Math.floor((now - at) / 1000))

  if (seconds < 2) {
    return 'Just now'
  }

  if (seconds < 60) {
    return `${seconds}s ago`
  }

  const minutes = Math.floor(seconds / 60)
  return minutes === 1 ? '1m ago' : `${minutes}m ago`
}
