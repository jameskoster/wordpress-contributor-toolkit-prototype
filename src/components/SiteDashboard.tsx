import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react'
import {
  Badge,
  Button,
  Card,
  CollapsibleCard,
  EmptyState,
  Field,
  Icon,
  IconButton,
  InputControl,
  Link,
  Stack,
  Tabs,
  Text,
} from '@wordpress/ui'
import { globe, offline, seen, table, unseen, wordpress } from '@wordpress/icons'
import { formatTimeAgo } from '../helpers'
import { checkoutLabel } from '../settings'
import type { Site } from '../types'
import { ApplyPatchDialog } from './ApplyPatchDialog'
import { TracTicketCard } from './TracTicketCard'

const WATCH_COMPILES = [
  { files: ['packages/block-library', 'packages/components'], duration: '1.4s' },
  { files: ['packages/editor'], duration: '0.9s' },
  { files: ['packages/block-editor', 'packages/edit-post'], duration: '1.8s' },
] as const

const WATCH_RECENT_SLOTS = Math.max(
  ...WATCH_COMPILES.map((compile) => compile.files.length),
)

type WatchCompile = {
  at: number
  duration: string
  files: readonly string[]
}

function ServerLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: ComponentProps<typeof Icon>['icon']
  children: string
}) {
  return (
    <Stack className="sidebar-link" direction="row" align="center" gap="xs">
      <Icon icon={icon} size={16} />
      <Link href={href} tone="neutral" openInNewTab>
        {children}
      </Link>
    </Stack>
  )
}

function SectionHeading({
  title,
  online,
  pending,
  startAnnouncement,
  stopAnnouncement,
  startLabel,
  stopLabel,
  onToggle,
}: {
  title: string
  online: boolean
  pending: boolean
  startAnnouncement: string
  stopAnnouncement: string
  startLabel: string
  stopLabel: string
  onToggle: () => void
}) {
  return (
    <Stack direction="row" align="center" justify="space-between" gap="md">
      <Text variant="heading-lg">{title}</Text>
      <Button
        variant="minimal"
        tone="neutral"
        size="compact"
        loading={pending}
        loadingAnnouncement={online ? stopAnnouncement : startAnnouncement}
        aria-label={online ? stopLabel : startLabel}
        onClick={onToggle}
      >
        {online ? 'Stop' : 'Start'}
      </Button>
    </Stack>
  )
}

function OfflinePlaceholder({ title }: { title: string }) {
  return (
    <div className="sidebar-empty-state">
      <EmptyState.Root>
        <EmptyState.Icon icon={offline} />
        <EmptyState.Title>{title}</EmptyState.Title>
      </EmptyState.Root>
    </div>
  )
}

function getScrollParent(element: HTMLElement) {
  let parent = element.parentElement

  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent
    }
    parent = parent.parentElement
  }

  return null
}

function sidebarOverlapsTray(
  sidebar: HTMLElement,
  scrollParent: HTMLElement | null,
  root: Element | null,
) {
  if (!scrollParent) {
    return false
  }

  const styles = window.getComputedStyle(sidebar)
  const stickyTop =
    Number.parseFloat(styles.getPropertyValue('--dashboard-sidebar-sticky-top')) ||
    0
  const trayInset =
    root instanceof HTMLElement
      ? Number.parseFloat(
          window.getComputedStyle(root).getPropertyValue('--app-tray-inset'),
        ) || 0
      : 0

  return (
    sidebar.offsetHeight + stickyTop > scrollParent.clientHeight - trayInset
  )
}

function useStickyUntilTrayOverlap() {
  const sidebarRef = useRef<HTMLElement>(null)
  const [unstuck, setUnstuck] = useState(false)

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) {
      return
    }

    const root = sidebar.closest('.app-root')
    const scrollParent = getScrollParent(sidebar)

    const update = () => {
      const next = sidebarOverlapsTray(sidebar, scrollParent, root)
      setUnstuck((current) => (current === next ? current : next))
    }

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(sidebar)
    if (scrollParent) {
      resizeObserver.observe(scrollParent)
    }

    const mutationObserver = root
      ? new MutationObserver(update)
      : null
    if (root) {
      mutationObserver?.observe(root, {
        attributes: true,
        attributeFilter: ['style'],
      })
    }

    window.addEventListener('resize', update)
    update()

    return () => {
      resizeObserver.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return { sidebarRef, unstuck }
}

type SiteDashboardProps = {
  site: Site
  onCopyPath: () => void
  onLinkTicket: (ticket: string) => void
  onUnlinkTicket: () => void
  onApplyPatch: (value: string) => void
  onRefreshPullRequests: () => void
  onRefreshAttachments: () => void
  serverPending: boolean
  watchPending: boolean
  onToggleServer: () => void
  onToggleWatch: () => void
}

export function SiteDashboard({
  site,
  onCopyPath,
  onLinkTicket,
  onUnlinkTicket,
  onApplyPatch,
  onRefreshPullRequests,
  onRefreshAttachments,
  serverPending,
  watchPending,
  onToggleServer,
  onToggleWatch,
}: SiteDashboardProps) {
  const [prDraft, setPrDraft] = useState(site.patch ?? '12345')
  const [patchFile, setPatchFile] = useState('')
  const [pendingPatch, setPendingPatch] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [watchCompile, setWatchCompile] = useState<WatchCompile | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [pathCopied, setPathCopied] = useState(false)
  const compileIndex = useRef(0)
  const pathCopiedTimer = useRef<number>(undefined)
  const { sidebarRef, unstuck } = useStickyUntilTrayOverlap()

  useEffect(() => {
    setPathCopied(false)
    setPendingPatch(null)
    window.clearTimeout(pathCopiedTimer.current)

    return () => window.clearTimeout(pathCopiedTimer.current)
  }, [site.id])

  function handleCopyPath() {
    onCopyPath()
    setPathCopied(true)
    window.clearTimeout(pathCopiedTimer.current)
    pathCopiedTimer.current = window.setTimeout(() => {
      setPathCopied(false)
    }, 1500)
  }

  function requestApply(value: string) {
    const next = value.trim()
    if (!next) {
      return
    }

    setPendingPatch(next)
  }

  function recordCompile() {
    const next = WATCH_COMPILES[compileIndex.current % WATCH_COMPILES.length]
    compileIndex.current += 1
    setWatchCompile({
      at: Date.now(),
      duration: next.duration,
      files: next.files,
    })
  }

  useEffect(() => {
    if (!site.watchOnline) {
      setWatchCompile(null)
      compileIndex.current = 0
      return
    }

    recordCompile()
    const rebuild = window.setInterval(recordCompile, 12000)
    const tick = window.setInterval(() => setNow(Date.now()), 1000)

    return () => {
      window.clearInterval(rebuild)
      window.clearInterval(tick)
    }
  }, [site.watchOnline])

  return (
    <div className="dashboard">
      <Stack direction="column" gap="2xl">
        <TracTicketCard
          ticket={site.ticket}
          onLinkTicket={onLinkTicket}
          onUnlinkTicket={onUnlinkTicket}
          onApplyPatch={requestApply}
          onRefreshPullRequests={onRefreshPullRequests}
          onRefreshAttachments={onRefreshAttachments}
        />

        <CollapsibleCard.Root>
          <CollapsibleCard.Header>
            <Stack direction="column" gap="xs">
              <Card.Title>Apply a patch or PR</Card.Title>
              <CollapsibleCard.HeaderDescription>
                Test changes in this checkout. Your own changes are preserved.
              </CollapsibleCard.HeaderDescription>
            </Stack>
          </CollapsibleCard.Header>
          <CollapsibleCard.Content>
            <Stack direction="column" gap="md">
              <Tabs.Root
                defaultValue="pr"
                render={<Stack direction="column" gap="md" />}
              >
                <div className="patch-tabs-bar">
                  <Tabs.List variant="minimal" className="patch-tabs">
                    <Tabs.Tab value="pr">Pull request</Tabs.Tab>
                    <Tabs.Tab value="diff">Diff</Tabs.Tab>
                  </Tabs.List>
                  <hr className="card-divider" />
                </div>
                <Tabs.Panel value="pr" tabIndex={-1}>
                  <div className="inline-field">
                    <InputControl
                      label="Pull request URL or number"
                      value={prDraft}
                      onChange={(event) =>
                        setPrDraft(event.currentTarget.value)
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() => requestApply(prDraft.trim())}
                      disabled={!prDraft.trim()}
                    >
                      Apply PR
                    </Button>
                  </div>
                </Tabs.Panel>
                <Tabs.Panel value="diff" tabIndex={-1}>
                  <Field.Root>
                    <Field.Label>Patch file</Field.Label>
                    <Field.Control
                      className="file-field-control"
                      render={
                        <input
                          type="file"
                          accept=".diff,.patch,text/x-diff"
                        />
                      }
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0]
                        if (!file) {
                          return
                        }
                        const path = `/Users/rileyhart/Downloads/${file.name}`
                        setPatchFile(path)
                        onApplyPatch(path)
                      }}
                    />
                    {patchFile ? (
                      <Text variant="body-sm">{patchFile}</Text>
                    ) : null}
                    <Field.Description>
                      Choose a local .diff or .patch file
                    </Field.Description>
                  </Field.Root>
                </Tabs.Panel>
              </Tabs.Root>
              {site.patch ? (
                <Text variant="body-sm">Applied {site.patch}.</Text>
              ) : null}
            </Stack>
          </CollapsibleCard.Content>
        </CollapsibleCard.Root>
      </Stack>

      <aside
        ref={sidebarRef}
        className={unstuck ? 'dashboard-sidebar is-unstuck' : 'dashboard-sidebar'}
      >
        <Stack direction="column" gap="xl">
          <Stack direction="column" gap="md">
            <Text variant="heading-lg">
              Details
            </Text>
            <Stack direction="column" gap="md">
              <Stack direction="column">
                <Text variant="body-md" className="muted-label">
                  Created
                </Text>
                <Text variant="body-md">{site.created}</Text>
              </Stack>
              <Stack direction="column">
                <Text variant="body-md" className="muted-label">
                  Trunk as of
                </Text>
                <Text variant="body-md">{site.trunkAsOf}</Text>
              </Stack>
              <Stack direction="row" align="end" justify="space-between">
                <Stack direction="column" className="path-meta">
                  <Text variant="body-md" className="muted-label">
                    Local path
                  </Text>
                  <Text variant="body-md" className="path-value">
                    {site.path}
                  </Text>
                </Stack>
                <Button
                  variant="minimal"
                  tone="neutral"
                  size="compact"
                  aria-live="polite"
                  onClick={handleCopyPath}
                >
                  {pathCopied ? 'Copied' : 'Copy'}
                </Button>
              </Stack>
              <Stack direction="column">
                <Text variant="body-md" className="muted-label">
                  Checkout
                </Text>
                <Text variant="body-md">
                  {checkoutLabel(site.checkoutType)} · PHP {site.phpVersion}
                </Text>
              </Stack>
              <Stack direction="column">
                <Text variant="body-md" className="muted-label">
                  Debugging
                </Text>
                <Text variant="body-md">
                  {[
                    site.wpDebug ? 'WP_DEBUG' : null,
                    site.scriptDebug ? 'SCRIPT_DEBUG' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Off'}
                </Text>
              </Stack>
            </Stack>
          </Stack>

          <hr className="card-divider" />

          <Stack direction="column" gap="md">
            <SectionHeading
              title="Server"
              online={site.serverOnline}
              pending={serverPending}
              startAnnouncement="Starting development server"
              stopAnnouncement="Stopping development server"
              startLabel="Start development server"
              stopLabel="Stop development server"
              onToggle={onToggleServer}
            />
            {site.serverOnline ? (
              <Stack direction="column" gap="xl">
                <Stack direction="column" gap="sm">
                  <ServerLink href="http://localhost:8881" icon={globe}>
                    View site
                  </ServerLink>
                  <ServerLink
                    href="http://localhost:8881/wp-admin"
                    icon={wordpress}
                  >
                    wp-admin
                  </ServerLink>
                  <ServerLink
                    href="http://localhost:8881/adminer"
                    icon={table}
                  >
                    Database
                  </ServerLink>
                </Stack>
                <Stack direction="column" gap="md">
                  <Text variant="heading-sm">
                    Admin credentials
                  </Text>
                  <div className="credential-list">
                    <Text variant="body-md" className="muted-label">
                      Username
                    </Text>
                    <Text variant="body-md">
                      {site.adminUsername}
                    </Text>
                    <Text variant="body-md" className="muted-label">
                      Password
                    </Text>
                    <div className="credential-value">
                      <Text variant="body-md">
                        {showPassword ? site.adminPassword : '••••••••'}
                      </Text>
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
                    </div>
                  </div>
                </Stack>
              </Stack>
            ) : (
              <OfflinePlaceholder title="Development server offline" />
            )}
          </Stack>

          <hr className="card-divider" />

          <Stack direction="column" gap="md">
            <SectionHeading
              title="Latest build"
              online={site.watchOnline}
              pending={watchPending}
              startAnnouncement="Starting build watch"
              stopAnnouncement="Stopping build watch"
              startLabel="Start build watch"
              stopLabel="Stop build watch"
              onToggle={onToggleWatch}
            />
            {site.watchOnline && watchCompile ? (
              <Stack direction="column" gap="md">
                <Stack direction="row" align="center" gap="sm" wrap="wrap">
                  <Badge intent="stable">Compiled successfully</Badge>
                  <Text variant="body-md" className="muted-label">
                    {formatTimeAgo(watchCompile.at, now)} · {watchCompile.duration}
                  </Text>
                </Stack>
                <Stack direction="column">
                  <Text variant="body-md" className="muted-label">
                    Watching
                  </Text>
                  <Text variant="body-md">src/</Text>
                </Stack>
                <Stack direction="column">
                  <Text variant="body-md" className="muted-label">
                    Recent
                  </Text>
                  <div
                    key={watchCompile.at}
                    className="watch-recent-files"
                    style={{
                      minHeight: `calc(${WATCH_RECENT_SLOTS} * 1lh)`,
                    }}
                  >
                    {watchCompile.files.map((file) => (
                      <Text
                        key={file}
                        variant="body-md"
                        className="watch-recent-file"
                      >
                        {file}
                      </Text>
                    ))}
                  </div>
                </Stack>
              </Stack>
            ) : (
              <OfflinePlaceholder title="Build watch offline" />
            )}
          </Stack>
        </Stack>
      </aside>

      <ApplyPatchDialog
        value={pendingPatch}
        onOpenChange={(open) => {
          if (!open) {
            setPendingPatch(null)
          }
        }}
        onApply={(value) => {
          onApplyPatch(value)
          if (site.watchOnline) {
            recordCompile()
          }
          setPendingPatch(null)
        }}
      />
    </div>
  )
}
