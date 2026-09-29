import {
  PLACEHOLDER_HOME,
  THEME_BACKGROUND_LIGHT,
  THEME_PRIMARY,
} from './helpers'
import type {
  AdminTheme,
  AppSettings,
  CheckoutType,
  EditorApp,
  PhpVersion,
  QuitBehavior,
  TerminalApp,
} from './types'

export const DEFAULT_LOCATION = `${PLACEHOLDER_HOME}/sites`

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  customBackground: THEME_BACKGROUND_LIGHT,
  customAccent: THEME_PRIMARY,
  defaultLocation: DEFAULT_LOCATION,
  editor: 'vscode',
  terminal: 'terminal',
  autoStartServer: false,
  autoStartWatch: false,
  quitBehavior: 'leave',
  wordpressOrgUsername: '',
  githubUsername: '',
  phpVersion: '8.3',
  wpDebug: true,
  scriptDebug: true,
  adminUsername: 'Admin',
  adminPassword: 'Password',
}

export const THEME_ITEMS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
  { value: 'custom', label: 'Custom' },
] as const satisfies ReadonlyArray<{ value: AdminTheme; label: string }>

export const EDITOR_ITEMS = [
  { value: 'vscode', label: 'VS Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'phpstorm', label: 'PhpStorm' },
  { value: 'sublime', label: 'Sublime Text' },
  { value: 'zed', label: 'Zed' },
] as const satisfies ReadonlyArray<{ value: EditorApp; label: string }>

export const TERMINAL_ITEMS = [
  { value: 'terminal', label: 'Terminal' },
  { value: 'iterm', label: 'iTerm' },
  { value: 'warp', label: 'Warp' },
  { value: 'ghostty', label: 'Ghostty' },
] as const satisfies ReadonlyArray<{ value: TerminalApp; label: string }>

export const QUIT_ITEMS = [
  {
    value: 'stop',
    label: 'Stop running sites',
  },
  {
    value: 'leave',
    label: 'Keep sites running',
  },
  {
    value: 'restart',
    label: 'Stop now, start again next time',
  },
] as const satisfies ReadonlyArray<{ value: QuitBehavior; label: string }>

export const PHP_ITEMS = [
  { value: '8.2', label: '8.2' },
  { value: '8.3', label: '8.3' },
  { value: '8.4', label: '8.4' },
] as const satisfies ReadonlyArray<{ value: PhpVersion; label: string }>

export const CHECKOUT_ITEMS = [
  { value: 'core', label: 'WordPress Core' },
  { value: 'gutenberg', label: 'Gutenberg' },
] as const satisfies ReadonlyArray<{ value: CheckoutType; label: string }>

function isOneOf<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

export function editorLabel(editor: EditorApp) {
  return EDITOR_ITEMS.find((item) => item.value === editor)?.label ?? 'VS Code'
}

export function terminalLabel(terminal: TerminalApp) {
  return (
    TERMINAL_ITEMS.find((item) => item.value === terminal)?.label ?? 'Terminal'
  )
}

export function checkoutLabel(checkout: CheckoutType) {
  return (
    CHECKOUT_ITEMS.find((item) => item.value === checkout)?.label ??
    'WordPress Core'
  )
}

export function isGutenbergSite(checkout: CheckoutType) {
  return checkout === 'gutenberg'
}

export function selectItem<T extends string>(
  items: ReadonlyArray<{ value: T; label: string }>,
  value: T
) {
  return items.find((item) => item.value === value) ?? items[0]
}

export function normalizeSettings(value: unknown): AppSettings {
  const raw =
    value && typeof value === 'object'
      ? (value as Partial<AppSettings>)
      : {}

  return {
    theme: isOneOf(raw.theme, ['light', 'dark', 'system', 'custom'])
      ? raw.theme
      : DEFAULT_SETTINGS.theme,
    customBackground: isHexColor(raw.customBackground)
      ? raw.customBackground
      : DEFAULT_SETTINGS.customBackground,
    customAccent: isHexColor(raw.customAccent)
      ? raw.customAccent
      : DEFAULT_SETTINGS.customAccent,
    defaultLocation:
      typeof raw.defaultLocation === 'string' && raw.defaultLocation.trim()
        ? raw.defaultLocation
        : DEFAULT_SETTINGS.defaultLocation,
    editor: isOneOf(raw.editor, EDITOR_ITEMS.map((item) => item.value))
      ? raw.editor
      : DEFAULT_SETTINGS.editor,
    terminal: isOneOf(raw.terminal, TERMINAL_ITEMS.map((item) => item.value))
      ? raw.terminal
      : DEFAULT_SETTINGS.terminal,
    autoStartServer: Boolean(raw.autoStartServer),
    autoStartWatch: Boolean(raw.autoStartWatch),
    quitBehavior: isOneOf(raw.quitBehavior, ['stop', 'leave', 'restart'])
      ? raw.quitBehavior
      : DEFAULT_SETTINGS.quitBehavior,
    wordpressOrgUsername:
      typeof raw.wordpressOrgUsername === 'string'
        ? raw.wordpressOrgUsername
        : '',
    githubUsername:
      typeof raw.githubUsername === 'string' ? raw.githubUsername : '',
    phpVersion: isOneOf(raw.phpVersion, ['8.2', '8.3', '8.4'])
      ? raw.phpVersion
      : DEFAULT_SETTINGS.phpVersion,
    wpDebug: typeof raw.wpDebug === 'boolean' ? raw.wpDebug : true,
    scriptDebug: typeof raw.scriptDebug === 'boolean' ? raw.scriptDebug : true,
    adminUsername:
      typeof raw.adminUsername === 'string' && raw.adminUsername.trim()
        ? raw.adminUsername
        : DEFAULT_SETTINGS.adminUsername,
    adminPassword:
      typeof raw.adminPassword === 'string' && raw.adminPassword.trim()
        ? raw.adminPassword
        : DEFAULT_SETTINGS.adminPassword,
  }
}
