import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  __experimentalToggleGroupControl as ToggleGroupControl,
  __experimentalToggleGroupControlOption as ToggleGroupControlOption,
  ToggleControl,
} from '@wordpress/components'
import { seen, unseen } from '@wordpress/icons'
import {
  Dialog,
  IconButton,
  InputControl,
  InputLayout,
  SelectControl,
  Stack,
  Tabs,
  Text,
} from '@wordpress/ui'
import {
  CHECKOUT_ITEMS,
  EDITOR_ITEMS,
  PHP_ITEMS,
  QUIT_ITEMS,
  selectItem,
  TERMINAL_ITEMS,
} from '../settings'
import type {
  AdminTheme,
  AppSettings,
  CheckoutType,
  PhpVersion,
} from '../types'
import { FolderField } from './FolderField'

type SettingsDialogProps = {
  open: boolean
  settings: AppSettings
  onOpenChange: (open: boolean) => void
  onChange: (next: Partial<AppSettings>) => void
}

type SettingsTab = 'general' | 'sites' | 'account'

function isSettingsTab(value: unknown): value is SettingsTab {
  return value === 'general' || value === 'sites' || value === 'account'
}

function selectedValue(
  value: { value?: string | null } | string | null | undefined
) {
  return typeof value === 'string' ? value : value?.value ?? undefined
}

function asSetting<T extends string>(
  value: { value?: string | null } | string | null | undefined,
  allowed: readonly T[]
): T | undefined {
  const next = selectedValue(value)
  return next && allowed.includes(next as T) ? (next as T) : undefined
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`

  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    return withHash.toLowerCase()
  }

  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    return `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`.toLowerCase()
  }

  return null
}

function ThemeColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function commit(next: string) {
    const hex = normalizeHexColor(next)
    if (!hex) {
      setDraft(value)
      return
    }

    setDraft(hex)
    if (hex !== value) {
      onChange(hex)
    }
  }

  return (
    <InputControl
      className="theme-color-field"
      label={label}
      value={draft}
      spellCheck={false}
      autoComplete="off"
      prefix={
        <InputLayout.Slot padding="minimal">
          <label className="theme-color-swatch">
            <span
              className="theme-color-swatch-chip"
              style={{ background: value }}
            />
            <input
              type="color"
              className="theme-color-swatch-input"
              value={value}
              aria-label={`${label} color`}
              onChange={(event) => onChange(event.currentTarget.value)}
            />
          </label>
        </InputLayout.Slot>
      }
      onChange={(event) => setDraft(event.currentTarget.value)}
      onBlur={() => commit(draft)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit(draft)
        }
      }}
    />
  )
}

export function SettingsDialog({
  open,
  settings,
  onOpenChange,
  onChange,
}: SettingsDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [panelsEl, setPanelsEl] = useState<HTMLDivElement | null>(null)
  const [tab, setTab] = useState<SettingsTab>('general')
  const [showPassword, setShowPassword] = useState(false)
  const [panelMinHeight, setPanelMinHeight] = useState<number>()

  useLayoutEffect(() => {
    if (!open || !panelsEl) {
      return
    }

    const panelsRoot = panelsEl

    function measurePanelHeight(panel: HTMLElement) {
      const isInactive =
        panel.hidden || panel.classList.contains('settings-panel-inactive')

      if (!isInactive) {
        return panel.offsetHeight
      }

      const clone = panel.cloneNode(true) as HTMLElement
      clone.hidden = false
      clone.classList.remove('settings-panel-inactive')
      clone.setAttribute('aria-hidden', 'true')
      clone.tabIndex = -1
      clone.style.cssText = [
        'position: absolute',
        'visibility: hidden',
        'pointer-events: none',
        `width: ${panelsRoot.clientWidth}px`,
        'display: block',
        'height: auto',
      ].join(';')
      panelsRoot.appendChild(clone)
      const height = clone.offsetHeight
      clone.remove()
      return height
    }

    function measure() {
      const panels = [
        ...panelsRoot.querySelectorAll<HTMLElement>(':scope > .settings-panel'),
      ]
      const next = Math.ceil(
        Math.max(0, ...panels.map((panel) => measurePanelHeight(panel)))
      )

      if (next === 0) {
        return
      }

      setPanelMinHeight((current) => (current === next ? current : next))
    }

    measure()
    const frame = window.requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
    }
  }, [open, settings, panelsEl])

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setTab('general')
          setShowPassword(false)
        }
      }}
    >
      <Dialog.Popup size="medium" initialFocus={closeRef}>
        <Dialog.Header>
          <Dialog.Title>Settings</Dialog.Title>
          <Dialog.CloseIcon ref={closeRef} />
        </Dialog.Header>
        <Dialog.Content>
          <Tabs.Root
            value={tab}
            onValueChange={(value) => {
              if (isSettingsTab(value)) {
                setTab(value)
              }
            }}
            render={<Stack direction="column" gap="xl" />}
          >
            <div className="settings-tabs-bar">
              <Tabs.List variant="minimal" className="settings-tabs">
                <Tabs.Tab value="general">General</Tabs.Tab>
                <Tabs.Tab value="sites">New sites</Tabs.Tab>
                <Tabs.Tab value="account">Account</Tabs.Tab>
              </Tabs.List>
              <hr className="card-divider" />
            </div>

            <div
              ref={setPanelsEl}
              className="settings-panels"
              style={
                panelMinHeight != null ? { minHeight: panelMinHeight } : undefined
              }
            >
            <Tabs.Panel
              value="general"
              tabIndex={-1}
              keepMounted
              className={
                tab === 'general'
                  ? 'settings-panel'
                  : 'settings-panel settings-panel-inactive'
              }
            >
              <Stack direction="column" gap="2xl">
                <Stack direction="column" gap="xl">
                  <Text variant="heading-lg">Appearance</Text>
                  <ToggleGroupControl
                    __nextHasNoMarginBottom
                    __next40pxDefaultSize
                    isBlock
                    label="Admin theme"
                    value={settings.theme}
                    onChange={(value) => {
                      if (
                        value === 'light' ||
                        value === 'dark' ||
                        value === 'system' ||
                        value === 'custom'
                      ) {
                        onChange({ theme: value as AdminTheme })
                      }
                    }}
                  >
                    <ToggleGroupControlOption value="light" label="Light" />
                    <ToggleGroupControlOption value="dark" label="Dark" />
                    <ToggleGroupControlOption value="system" label="System" />
                    <ToggleGroupControlOption value="custom" label="Custom" />
                  </ToggleGroupControl>
                  {settings.theme === 'custom' ? (
                    <div className="theme-color-fields">
                      <ThemeColorField
                        label="Background"
                        value={settings.customBackground}
                        onChange={(customBackground) =>
                          onChange({ customBackground })
                        }
                      />
                      <ThemeColorField
                        label="Accent"
                        value={settings.customAccent}
                        onChange={(customAccent) => onChange({ customAccent })}
                      />
                    </div>
                  ) : null}
                </Stack>

                <Stack direction="column" gap="xl">
                  <Text variant="heading-lg">Your tools</Text>
                  <FolderField
                    label="New sites go here"
                    description="Each new site is created in a subfolder of this location."
                    value={settings.defaultLocation}
                    onChange={(defaultLocation) => onChange({ defaultLocation })}
                  />
                  <SelectControl
                    label="Open code in"
                    description="Site actions will open the checkout in this editor."
                    items={[...EDITOR_ITEMS]}
                    value={selectItem(EDITOR_ITEMS, settings.editor)}
                    onValueChange={(value) => {
                      const editor = asSetting(
                        value,
                        EDITOR_ITEMS.map((item) => item.value)
                      )
                      if (editor) {
                        onChange({ editor })
                      }
                    }}
                  />
                  <SelectControl
                    label="Open the terminal in"
                    description="Site actions will open a shell here."
                    items={[...TERMINAL_ITEMS]}
                    value={selectItem(TERMINAL_ITEMS, settings.terminal)}
                    onValueChange={(value) => {
                      const terminal = asSetting(
                        value,
                        TERMINAL_ITEMS.map((item) => item.value)
                      )
                      if (terminal) {
                        onChange({ terminal })
                      }
                    }}
                  />
                </Stack>

                <Stack direction="column" gap="xl">
                  <Text variant="heading-lg">Opening and quitting</Text>
                  <ToggleControl
                    __nextHasNoMarginBottom
                    label="Start the server when I open a site"
                    help="So the site and wp-admin are ready without an extra click."
                    checked={settings.autoStartServer}
                    onChange={(autoStartServer) => onChange({ autoStartServer })}
                  />
                  <ToggleControl
                    __nextHasNoMarginBottom
                    label="Start build watch when I open a site"
                    help="Compile Core assets as you work."
                    checked={settings.autoStartWatch}
                    onChange={(autoStartWatch) => onChange({ autoStartWatch })}
                  />
                  <SelectControl
                    label="When I quit"
                    description="What happens to running servers and build watches."
                    items={[...QUIT_ITEMS]}
                    value={selectItem(QUIT_ITEMS, settings.quitBehavior)}
                    onValueChange={(value) => {
                      const quitBehavior = asSetting(
                        value,
                        QUIT_ITEMS.map((item) => item.value)
                      )
                      if (quitBehavior) {
                        onChange({ quitBehavior })
                      }
                    }}
                  />
                </Stack>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel
              value="sites"
              tabIndex={-1}
              keepMounted
              className={
                tab === 'sites'
                  ? 'settings-panel'
                  : 'settings-panel settings-panel-inactive'
              }
            >
              <Stack direction="column" gap="2xl">
                <Stack direction="column" gap="xl">
                  <Text variant="heading-lg">Checkout defaults</Text>
                  <ToggleGroupControl
                    __nextHasNoMarginBottom
                    __next40pxDefaultSize
                    isBlock
                    label="PHP version"
                    value={settings.phpVersion}
                    onChange={(value) => {
                      if (value === '8.2' || value === '8.3' || value === '8.4') {
                        onChange({ phpVersion: value as PhpVersion })
                      }
                    }}
                  >
                    {PHP_ITEMS.map((item) => (
                      <ToggleGroupControlOption
                        key={item.value}
                        value={item.value}
                        label={item.label}
                      />
                    ))}
                  </ToggleGroupControl>
                  <ToggleGroupControl
                    __nextHasNoMarginBottom
                    __next40pxDefaultSize
                    isBlock
                    label="What to check out"
                    value={settings.checkoutType}
                    onChange={(value) => {
                      if (value === 'core' || value === 'core-gutenberg') {
                        onChange({ checkoutType: value as CheckoutType })
                      }
                    }}
                  >
                    {CHECKOUT_ITEMS.map((item) => (
                      <ToggleGroupControlOption
                        key={item.value}
                        value={item.value}
                        label={item.label}
                      />
                    ))}
                  </ToggleGroupControl>
                  <ToggleControl
                    __nextHasNoMarginBottom
                    label="Show PHP errors (WP_DEBUG)"
                    help="New sites start with debugging on so notices show up while you test."
                    checked={settings.wpDebug}
                    onChange={(wpDebug) => onChange({ wpDebug })}
                  />
                  <ToggleControl
                    __nextHasNoMarginBottom
                    label="Use unminified scripts (SCRIPT_DEBUG)"
                    help="Load development builds of Core scripts on new sites."
                    checked={settings.scriptDebug}
                    onChange={(scriptDebug) => onChange({ scriptDebug })}
                  />
                </Stack>

                <Stack direction="column" gap="xl">
                  <Text variant="heading-lg">Admin login for new sites</Text>
                  <InputControl
                    label="Username"
                    value={settings.adminUsername}
                    onChange={(event) =>
                      onChange({ adminUsername: event.currentTarget.value })
                    }
                  />
                  <InputControl
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={settings.adminPassword}
                    onChange={(event) =>
                      onChange({ adminPassword: event.currentTarget.value })
                    }
                    suffix={
                      <InputLayout.Slot padding="minimal">
                        <IconButton
                          icon={showPassword ? unseen : seen}
                          label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                          variant="minimal"
                          tone="neutral"
                          size="small"
                          onClick={() =>
                            setShowPassword((current) => !current)
                          }
                        />
                      </InputLayout.Slot>
                    }
                  />
                </Stack>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel
              value="account"
              tabIndex={-1}
              keepMounted
              className={
                tab === 'account'
                  ? 'settings-panel'
                  : 'settings-panel settings-panel-inactive'
              }
            >
              <Stack direction="column" gap="xl">
                <Text variant="heading-lg">How you contribute</Text>
                <InputControl
                  label="WordPress.org username"
                  description="Used when you link a Trac ticket."
                  value={settings.wordpressOrgUsername}
                  onChange={(event) =>
                    onChange({
                      wordpressOrgUsername: event.currentTarget.value,
                    })
                  }
                />
                <InputControl
                  label="GitHub username"
                  description="Used when you apply a pull request."
                  value={settings.githubUsername}
                  onChange={(event) =>
                    onChange({ githubUsername: event.currentTarget.value })
                  }
                />
              </Stack>
            </Tabs.Panel>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Popup>
    </Dialog.Root>
  )
}
