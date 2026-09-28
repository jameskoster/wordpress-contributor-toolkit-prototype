import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, IconButton, Stack, Tabs, Text } from '@wordpress/ui'
import { closeSmall } from '@wordpress/icons'
import { loadTrayHeight, saveTrayHeight } from '../storage'
import type { Site, TrayId } from '../types'

type LogSource = 'server' | 'watch' | 'debug'

const titles: Record<TrayId, string> = {
  terminal: 'Terminal',
  logs: 'Logs',
  email: 'Email',
}

const logTabs: { value: LogSource; label: string }[] = [
  { value: 'server', label: 'Server' },
  { value: 'watch', label: 'Build watch' },
  { value: 'debug', label: 'Debug.log' },
]

function isLogSource(value: unknown): value is LogSource {
  return value === 'server' || value === 'watch' || value === 'debug'
}

function logsBody(source: LogSource, site: Site) {
  if (source === 'server') {
    return site.serverOnline
      ? `[Tue Sep 15 19:04:00 2026] PHP 8.3.6 Development Server (http://localhost:8881) started
[Tue Sep 15 19:04:08 2026] 127.0.0.1:52340 [200]: GET /
[Tue Sep 15 19:04:08 2026] 127.0.0.1:52341 [200]: GET /wp-admin/`
      : `Development server is offline.
Start the development server to see request logs.`
  }

  if (source === 'watch') {
    return site.watchOnline
      ? `[build-watch] watching src/
[build-watch] compiled successfully in 1.4s
[build-watch] no errors`
      : `[build-watch] idle
Start build watch to compile Core assets.`
  }

  return site.serverOnline
    ? `[15-Sep-2026 18:04:22 UTC] PHP Notice: Function _load_textdomain_just_in_time was called incorrectly. Translation loading for the \`default\` domain was triggered too early. in ${site.path}/wp-includes/functions.php on line 6131
[15-Sep-2026 18:05:01 UTC] PHP Notice: Function wp_enqueue_script was called incorrectly. Scripts and styles should not be registered or enqueued until the \`wp_enqueue_scripts\` hook. in ${site.path}/wp-includes/functions.php on line 6114`
    : `No entries in debug.log.`
}

function emailInboxKey(site: Site) {
  return `${site.id}:${site.ticket ?? ''}`
}

function trayBody(tray: TrayId, site: Site, emailsCleared = false) {
  if (tray === 'terminal') {
    return `$ cd ${site.path}
$ wp server --host=localhost --port=8881
${site.serverOnline ? 'Success: Started WordPress at http://localhost:8881' : 'Development server is offline.'}`
  }

  if (!emailsCleared && site.ticket) {
    return `Inbox for ${site.name}

From: wordpress@example.com
Subject: [${site.ticket}] Comment received
A new comment was posted on the linked Trac ticket.`
  }

  return `Inbox for ${site.name}

No mail yet. WordPress transactional email will appear here once the site sends any.`
}

function measureMinHeight(
  tray: HTMLElement | null,
  header: HTMLElement | null,
  log: HTMLElement | null,
) {
  if (!tray || !header || !log) {
    return 0
  }

  const trayStyles = window.getComputedStyle(tray)
  const logStyles = window.getComputedStyle(log)
  const paddingY =
    Number.parseFloat(trayStyles.paddingTop) +
    Number.parseFloat(trayStyles.paddingBottom)
  const logPaddingY =
    Number.parseFloat(logStyles.paddingTop) +
    Number.parseFloat(logStyles.paddingBottom)
  const lineHeight =
    Number.parseFloat(logStyles.lineHeight) ||
    Number.parseFloat(logStyles.fontSize)
  const borderTop = Number.parseFloat(trayStyles.borderTopWidth) || 0

  return Math.ceil(
    header.offsetHeight + paddingY + logPaddingY + lineHeight + borderTop,
  )
}

function clampTrayHeight(height: number, minHeight: number) {
  const maxHeight = window.innerHeight * 0.5
  const min = minHeight > 0 ? Math.min(minHeight, maxHeight) : 0
  return Math.min(Math.max(height, min), maxHeight)
}

type BottomTrayProps = {
  tray: TrayId | null
  site: Site
  onClose: () => void
}

export function BottomTray({ tray, site, onClose }: BottomTrayProps) {
  const [renderedTray, setRenderedTray] = useState<TrayId | null>(tray)
  const [open, setOpen] = useState(false)
  const [logSource, setLogSource] = useState<LogSource>('server')
  const [clearedEmailKey, setClearedEmailKey] = useState<string | null>(null)
  const [height, setHeight] = useState<number | null>(() => loadTrayHeight())
  const [dragging, setDragging] = useState(false)
  const trayRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLPreElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)

  useEffect(() => {
    if (tray) {
      setRenderedTray(tray)
      const frame = window.requestAnimationFrame(() => {
        setOpen(true)
      })
      return () => window.cancelAnimationFrame(frame)
    }

    setOpen(false)
    const timeout = window.setTimeout(() => {
      setRenderedTray(null)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [tray])

  useLayoutEffect(() => {
    if (!open) {
      return
    }

    const minHeight = measureMinHeight(
      trayRef.current,
      headerRef.current,
      logRef.current,
    )

    setHeight((current) => {
      const next = clampTrayHeight(
        current ?? trayRef.current?.offsetHeight ?? minHeight,
        minHeight,
      )
      if (next !== current) {
        saveTrayHeight(next)
      }
      return next
    })
  }, [open, renderedTray])

  useEffect(() => {
    if (!open) {
      return
    }

    function onResize() {
      const minHeight = measureMinHeight(
        trayRef.current,
        headerRef.current,
        logRef.current,
      )
      setHeight((current) => {
        if (current == null) {
          return current
        }
        const next = clampTrayHeight(current, minHeight)
        if (next !== current) {
          saveTrayHeight(next)
        }
        return next
      })
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open])

  useLayoutEffect(() => {
    const root = shellRef.current?.closest('.app-root')
    if (!(root instanceof HTMLElement)) {
      return
    }

    const inset = open && height != null ? `${height}px` : '0px'
    root.style.setProperty('--app-tray-inset', inset)
    return () => {
      root.style.removeProperty('--app-tray-inset')
    }
  }, [open, height])

  useEffect(() => {
    if (!dragging) {
      return
    }

    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ns-resize'

    function onMove(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag) {
        return
      }

      const next = clampTrayHeight(
        drag.startHeight + (drag.startY - event.clientY),
        measureMinHeight(trayRef.current, headerRef.current, logRef.current),
      )
      setHeight(next)
      saveTrayHeight(next)
    }

    function onUp() {
      dragRef.current = null
      setDragging(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging])

  if (!renderedTray) {
    return null
  }

  const inboxKey = emailInboxKey(site)
  const emailsCleared = clearedEmailKey === inboxKey
  const hasEmails = Boolean(site.ticket) && !emailsCleared

  const slotClass = [
    'app-tray-slot',
    open ? 'is-open' : '',
    dragging ? 'is-dragging' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="app-tray-shell" ref={shellRef}>
      <div
        className={slotClass}
        style={height != null ? { height } : undefined}
      >
        <div className="app-tray-slot-inner">
          <aside
            ref={trayRef}
            className="app-tray"
            aria-label={titles[renderedTray]}
            aria-hidden={!open}
          >
            {open ? (
              <button
                type="button"
                className="app-tray-resize"
                aria-label="Resize tray"
                onPointerDown={(event) => {
                  if (event.button !== 0) {
                    return
                  }

                  event.preventDefault()
                  dragRef.current = {
                    startY: event.clientY,
                    startHeight: trayRef.current?.offsetHeight ?? height ?? 0,
                  }
                  setDragging(true)
                  try {
                    event.currentTarget.setPointerCapture(event.pointerId)
                  } catch {
                    // Capture is optional; window-level pointer listeners still resize.
                  }
                }}
              />
            ) : null}
            {renderedTray === 'logs' ? (
              <Tabs.Root
                value={logSource}
                onValueChange={(value) => {
                  if (isLogSource(value)) {
                    setLogSource(value)
                  }
                }}
                render={<div className="app-tray-logs" />}
              >
                <div className="app-tray-header app-tray-header-logs" ref={headerRef}>
                  <Stack direction="column" gap="sm">
                    <Stack direction="row" align="center" justify="space-between">
                      <Text variant="heading-lg">{titles.logs}</Text>
                      <IconButton
                        icon={closeSmall}
                        label="Close"
                        variant="minimal"
                        tone="neutral"
                        size="compact"
                        onClick={onClose}
                      />
                    </Stack>
                    <Tabs.List variant="minimal" className="log-tabs">
                      {logTabs.map((tab) => (
                        <Tabs.Tab key={tab.value} value={tab.value}>
                          {tab.label}
                        </Tabs.Tab>
                      ))}
                    </Tabs.List>
                  </Stack>
                </div>
                {logTabs.map((tab) => (
                  <Tabs.Panel
                    key={tab.value}
                    value={tab.value}
                    tabIndex={-1}
                    className="app-tray-log-panel"
                  >
                    <pre
                      className="tray-log"
                      ref={logSource === tab.value ? logRef : undefined}
                    >
                      {logsBody(tab.value, site)}
                    </pre>
                  </Tabs.Panel>
                ))}
              </Tabs.Root>
            ) : (
              <>
                <div className="app-tray-header" ref={headerRef}>
                  <Stack direction="row" align="center" justify="space-between">
                    <Text variant="heading-lg">{titles[renderedTray]}</Text>
                    <Stack direction="row" align="center" gap="xs">
                      {renderedTray === 'email' ? (
                        <Button
                          variant="minimal"
                          tone="neutral"
                          size="compact"
                          disabled={!hasEmails}
                          onClick={() => setClearedEmailKey(inboxKey)}
                        >
                          Clear emails
                        </Button>
                      ) : null}
                      <IconButton
                        icon={closeSmall}
                        label="Close"
                        variant="minimal"
                        tone="neutral"
                        size="compact"
                        onClick={onClose}
                      />
                    </Stack>
                  </Stack>
                </div>
                <pre className="tray-log" ref={logRef}>
                  {trayBody(renderedTray, site, emailsCleared)}
                </pre>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
