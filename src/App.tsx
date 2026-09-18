import { useEffect, useRef, useState } from 'react'
import { ThemeProvider } from '@wordpress/theme'
import { Button, EmptyState, Notice } from '@wordpress/ui'
import { globe } from '@wordpress/icons'
import { AppFooter } from './components/AppFooter'
import { AppPage } from './components/AppPage'
import { BottomTray } from './components/BottomTray'
import { CreateSiteDialog } from './components/CreateSiteDialog'
import { ReviewChangesDialog } from './components/ReviewChangesDialog'
import { SettingsDialog } from './components/SettingsDialog'
import { DeleteDialog, FeedbackDialog, RenameDialog } from './components/SimpleDialogs'
import { SiteDashboard } from './components/SiteDashboard'
import { SitesSidebar } from './components/SitesSidebar'
import {
  formatDate,
  getThemeColorSeeds,
  slugifySiteName,
  usePrefersDarkScheme,
  yesterdayLabel,
} from './helpers'
import { editorLabel, terminalLabel } from './settings'
import {
  currentSiteFromStore,
  loadRestartSiteIds,
  loadSettings,
  loadSidebarOpen,
  loadStoredSites,
  saveRestartSiteIds,
  saveSettings,
  saveSidebarOpen,
  saveStoredSites,
} from './storage'
import type { AppSettings, Screen, Site, Toast, TrayId } from './types'

const SETUP_STEPS = [
  { label: 'Downloading WordPress…', duration: 2400 },
  { label: 'Installing npm dependencies…', duration: 2200 },
  { label: 'Compiling…', duration: 1600 },
] as const

function getInitialSites() {
  const stored = loadStoredSites()
  return {
    sites: stored.sites,
    site: currentSiteFromStore(stored),
  }
}

export default function App() {
  const [sites, setSites] = useState<Site[]>(() => getInitialSites().sites)
  const [site, setSite] = useState<Site | null>(() => getInitialSites().site)
  const [screen, setScreen] = useState<Screen>(() =>
    getInitialSites().site ? 'site' : 'boot'
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [restartSiteIds, setRestartSiteIds] = useState(loadRestartSiteIds)
  const prefersDark = usePrefersDarkScheme()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [tray, setTray] = useState<TrayId | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(loadSidebarOpen)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [setupStep, setSetupStep] = useState(0)
  const [pendingSite, setPendingSite] = useState<Site | null>(null)
  const [serverPending, setServerPending] = useState(false)
  const [watchPending, setWatchPending] = useState(false)
  const serverTimer = useRef<number>(undefined)
  const watchTimer = useRef<number>(undefined)
  const settingsRef = useRef(settings)
  const sitesRef = useRef(sites)
  const siteRef = useRef(site)

  function updateSettings(next: Partial<AppSettings>) {
    setSettings((current) => ({ ...current, ...next }))
  }

  function toast(message: string, intent: Toast['intent'] = 'info') {
    const id = Date.now()
    setToasts((current) => [...current, { id, message, intent }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3200)
  }

  function upsertSite(next: Site) {
    setSite(next)
    setSites((current) => {
      const exists = current.some((item) => item.id === next.id)
      return exists
        ? current.map((item) => (item.id === next.id ? next : item))
        : [...current, next]
    })
  }

  function copySitePath(target: Site) {
    void navigator.clipboard?.writeText(target.path)
    toast('Path copied.')
  }

  function requestRename(target: Site) {
    setSite(target)
    setRenameOpen(true)
  }

  function requestDelete(target: Site) {
    setSite(target)
    setDeleteOpen(true)
  }

  function handleCreate(name: string, location: string) {
    if (pendingSite) {
      return
    }

    const nextSite: Site = {
      id: crypto.randomUUID(),
      name,
      path: `${location.replace(/\/$/, '')}/${slugifySiteName(name) || 'Site-Name'}`,
      created: formatDate(new Date()),
      trunkAsOf: yesterdayLabel(),
      ticket: null,
      patch: null,
      serverOnline: false,
      watchOnline: false,
      phpVersion: settings.phpVersion,
      wpDebug: settings.wpDebug,
      scriptDebug: settings.scriptDebug,
      checkoutType: settings.checkoutType,
      adminUsername: settings.adminUsername,
      adminPassword: settings.adminPassword,
    }
    setPendingSite(nextSite)
    setSetupStep(0)
  }

  useEffect(() => {
    settingsRef.current = settings
    sitesRef.current = sites
    siteRef.current = site
  }, [settings, sites, site])

  useEffect(() => {
    return () => {
      window.clearTimeout(serverTimer.current)
      window.clearTimeout(watchTimer.current)
    }
  }, [])

  useEffect(() => {
    window.clearTimeout(serverTimer.current)
    window.clearTimeout(watchTimer.current)
    setServerPending(false)
    setWatchPending(false)
  }, [site?.id])

  useEffect(() => {
    if (screen !== 'site') {
      setTray(null)
      setDeleteOpen(false)
      setRenameOpen(false)
      setReviewOpen(false)
    }
  }, [screen])

  useEffect(() => {
    if (!pendingSite) {
      return
    }

    const timeout = window.setTimeout(() => {
      if (setupStep < SETUP_STEPS.length - 1) {
        setSetupStep((step) => step + 1)
        return
      }

      upsertSite(pendingSite)
      setPendingSite(null)
      setCreateOpen(false)
      setScreen('site')
      toast(`${pendingSite.name} created`, 'success')
    }, SETUP_STEPS[setupStep].duration)

    return () => window.clearTimeout(timeout)
  }, [setupStep, pendingSite])

  useEffect(() => {
    saveStoredSites({ sites, currentId: site?.id ?? null })
  }, [sites, site])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    function persistForQuit() {
      const currentSettings = settingsRef.current
      const currentSites = sitesRef.current
      const currentId = siteRef.current?.id ?? null

      if (currentSettings.quitBehavior === 'leave') {
        return
      }

      const runningIds = currentSites
        .filter((item) => item.serverOnline || item.watchOnline)
        .map((item) => item.id)
      saveStoredSites({
        sites: currentSites.map((item) => ({
          ...item,
          serverOnline: false,
          watchOnline: false,
        })),
        currentId,
      })
      saveRestartSiteIds(
        currentSettings.quitBehavior === 'restart' ? runningIds : []
      )
    }

    window.addEventListener('beforeunload', persistForQuit)
    return () => window.removeEventListener('beforeunload', persistForQuit)
  }, [])

  function patchSite(id: string, patch: Partial<Site>) {
    setSites((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
    setSite((current) =>
      current?.id === id ? { ...current, ...patch } : current
    )
  }

  function startServerProcess(id: string, stop = false) {
    setServerPending(true)
    serverTimer.current = window.setTimeout(() => {
      patchSite(id, { serverOnline: !stop })
      toast(stop ? 'Development server stopped.' : 'Development server started.')
      setServerPending(false)
    }, stop ? 800 : 1400)
  }

  function startWatchProcess(id: string, stop = false) {
    setWatchPending(true)
    watchTimer.current = window.setTimeout(() => {
      patchSite(id, { watchOnline: !stop })
      toast(stop ? 'Build watch stopped.' : 'Build watch started.')
      setWatchPending(false)
    }, stop ? 700 : 1100)
  }

  function requestServerToggle() {
    if (!site || serverPending) {
      return
    }

    startServerProcess(site.id, site.serverOnline)
  }

  function requestWatchToggle() {
    if (!site || watchPending) {
      return
    }

    startWatchProcess(site.id, site.watchOnline)
  }

  function consumeRestart(id: string) {
    setRestartSiteIds((current) => {
      if (!current.includes(id)) {
        return current
      }

      const next = current.filter((item) => item !== id)
      saveRestartSiteIds(next)
      return next
    })
  }

  useEffect(() => {
    if (screen !== 'site' || !site) {
      return
    }

    const restart = restartSiteIds.includes(site.id)
    const currentSettings = settingsRef.current
    const shouldStartServer =
      !site.serverOnline && (currentSettings.autoStartServer || restart)
    const shouldStartWatch =
      !site.watchOnline && (currentSettings.autoStartWatch || restart)

    if (!shouldStartServer && !shouldStartWatch) {
      return
    }

    consumeRestart(site.id)
    if (shouldStartServer) {
      startServerProcess(site.id)
    }
    if (shouldStartWatch) {
      startWatchProcess(site.id)
    }
  }, [screen, site?.id])

  return (
    <ThemeProvider
      isRoot
      cornerRadius="moderate"
      color={getThemeColorSeeds(settings.theme, prefersDark, {
        background: settings.customBackground,
        accent: settings.customAccent,
      })}
    >
      <div className="app-root">
      {screen === 'boot' ? (
        <div className="page-body is-centered">
          <EmptyState.Root>
            <EmptyState.Icon icon={globe} />
            <EmptyState.Title>No sites</EmptyState.Title>
            <EmptyState.Description>
              Create your first site to begin contributing
            </EmptyState.Description>
            <EmptyState.Actions>
              <Button onClick={() => setCreateOpen(true)}>Create site</Button>
            </EmptyState.Actions>
          </EmptyState.Root>
        </div>
      ) : null}

      {screen === 'site' && site ? (
        <div className="site-shell">
          <SitesSidebar
            sites={sites}
            selectedSiteId={site.id}
            editorLabel={editorLabel(settings.editor)}
            terminalLabel={terminalLabel(settings.terminal)}
            onSelectSite={setSite}
            onCreateSite={() => setCreateOpen(true)}
            onRename={requestRename}
            onCopyPath={copySitePath}
            onShowInFinder={() => toast('Showed site folder in Finder.')}
            onUpdateTrunk={() => toast('Updated checkout to latest trunk.')}
            onOpenInEditor={() =>
              toast(`Opened site directory in ${editorLabel(settings.editor)}.`)
            }
            onOpenInTerminal={() =>
              toast(
                `Opened site directory in ${terminalLabel(settings.terminal)}.`
              )
            }
            onDelete={requestDelete}
          />
          <div className="site-shell-main">
            <AppPage
              site={site}
              onRename={() => setRenameOpen(true)}
              onCopyPath={() => copySitePath(site)}
              onShowInFinder={() => toast('Showed site folder in Finder.')}
              onUpdateTrunk={() => toast('Updated checkout to latest trunk.')}
              editorLabel={editorLabel(settings.editor)}
              terminalLabel={terminalLabel(settings.terminal)}
              onOpenInEditor={() =>
                toast(
                  `Opened site directory in ${editorLabel(settings.editor)}.`
                )
              }
              onOpenInTerminal={() =>
                toast(
                  `Opened site directory in ${terminalLabel(settings.terminal)}.`
                )
              }
              onDelete={() => setDeleteOpen(true)}
              serverPending={serverPending}
              watchPending={watchPending}
              onToggleServer={requestServerToggle}
              onToggleWatch={requestWatchToggle}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => {
                setSidebarOpen((current) => {
                  const next = !current
                  saveSidebarOpen(next)
                  return next
                })
              }}
            >
              <div className="site-workspace-main">
                <SiteDashboard
                  site={site}
                  onCopyPath={() => {
                    void navigator.clipboard?.writeText(site.path)
                  }}
                  onLinkTicket={(ticket) => {
                    upsertSite({ ...site, ticket })
                    toast(
                      settings.wordpressOrgUsername
                        ? `Linked ticket ${ticket} as ${settings.wordpressOrgUsername}.`
                        : `Linked ticket ${ticket}.`
                    )
                  }}
                  onUnlinkTicket={() => {
                    upsertSite({ ...site, ticket: null })
                    toast('Unlinked ticket.')
                  }}
                  onRefreshPullRequests={() => toast('Pull requests refreshed.')}
                  onRefreshAttachments={() => toast('Attachments refreshed.')}
                  onApplyPatch={(value) => {
                    upsertSite({ ...site, patch: value })
                    toast(
                      settings.githubUsername
                        ? `Applied ${value} as ${settings.githubUsername} and rebuilt.`
                        : `Applied ${value} and rebuilt.`
                    )
                  }}
                  serverPending={serverPending}
                  watchPending={watchPending}
                  onToggleServer={requestServerToggle}
                  onToggleWatch={requestWatchToggle}
                  sidebarOpen={sidebarOpen}
                />
              </div>
            </AppPage>
            <BottomTray tray={tray} site={site} onClose={() => setTray(null)} />
            <AppFooter
              showTrays
              activeTray={tray}
              onToggleTray={(next) =>
                setTray((current) => (current === next ? null : next))
              }
              onGiveFeedback={() => setFeedbackOpen(true)}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>
        </div>
      ) : null}

      <CreateSiteDialog
        open={createOpen}
        defaultLocation={settings.defaultLocation}
        creating={Boolean(pendingSite)}
        statusMessage={SETUP_STEPS[setupStep].label}
        onOpenChange={(open) => {
          if (open || pendingSite) {
            return
          }
          setCreateOpen(false)
        }}
        onCreate={handleCreate}
      />

      {site ? (
        <>
          <ReviewChangesDialog
            open={reviewOpen}
            siteName={site.name}
            onOpenChange={setReviewOpen}
            onSubmit={() => {
              setReviewOpen(false)
              toast('Opened a pull request from the current changes.')
            }}
          />
          <RenameDialog
            key={site.id}
            open={renameOpen}
            value={site.name}
            onOpenChange={setRenameOpen}
            onRename={(name) => {
              upsertSite({ ...site, name })
              setRenameOpen(false)
              toast('Site renamed.')
            }}
          />
          <DeleteDialog
            key={site.id}
            open={deleteOpen}
            siteName={site.name}
            onOpenChange={setDeleteOpen}
            onConfirm={() => {
              const remaining = sites.filter((item) => item.id !== site.id)
              const next = remaining.at(-1) ?? null
              setDeleteOpen(false)
              setRenameOpen(false)
              setReviewOpen(false)
              setTray(null)
              setSites(remaining)
              setSite(next)
              setScreen(next ? 'site' : 'boot')
              toast('Site deleted.')
            }}
          />
        </>
      ) : null}

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        onSubmit={() => {
          setFeedbackOpen(false)
          toast('Thanks — feedback sent.')
        }}
      />

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onOpenChange={setSettingsOpen}
        onChange={updateSettings}
      />

      <div className="toast-stack">
        {toasts.map((item) => (
          <Notice.Root key={item.id} intent={item.intent ?? 'info'}>
            <Notice.Title>{item.message}</Notice.Title>
          </Notice.Root>
        ))}
      </div>
      </div>
    </ThemeProvider>
  )
}
