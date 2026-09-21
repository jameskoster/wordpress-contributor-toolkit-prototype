export type Screen = 'boot' | 'site'

export type AdminTheme = 'light' | 'dark' | 'system' | 'custom'

export type EditorApp = 'vscode' | 'cursor' | 'phpstorm' | 'sublime' | 'zed'

export type TerminalApp = 'terminal' | 'iterm' | 'warp' | 'ghostty'

export type QuitBehavior = 'stop' | 'leave' | 'restart'

export type PhpVersion = '8.2' | '8.3' | '8.4'

export type CheckoutType = 'core' | 'gutenberg'

export type TrayId = 'terminal' | 'logs' | 'email'

export type AppSettings = {
  theme: AdminTheme
  customBackground: string
  customAccent: string
  defaultLocation: string
  editor: EditorApp
  terminal: TerminalApp
  autoStartServer: boolean
  autoStartWatch: boolean
  quitBehavior: QuitBehavior
  wordpressOrgUsername: string
  githubUsername: string
  phpVersion: PhpVersion
  wpDebug: boolean
  scriptDebug: boolean
  adminUsername: string
  adminPassword: string
}

export type Site = {
  id: string
  name: string
  path: string
  created: string
  trunkAsOf: string
  ticket: string | null
  patch: string | null
  serverOnline: boolean
  watchOnline: boolean
  phpVersion: PhpVersion
  wpDebug: boolean
  scriptDebug: boolean
  checkoutType: CheckoutType
  adminUsername: string
  adminPassword: string
}

export type Toast = {
  id: number
  message: string
  intent?: 'info' | 'success' | 'warning' | 'error'
}
