import { Breadcrumbs, Page } from '@wordpress/admin-ui'
import { Button, IconButton } from '@wordpress/ui'
import { Icon, drawerRight, wordpress } from '@wordpress/icons'
import type { MouseEvent, ReactNode } from 'react'
import type { Site } from '../types'
import { AppRouter } from './AppRouter'
import { ProcessMenu } from './ProcessMenu'
import { SiteMenu } from './SiteMenu'

type AppPageProps = {
  site: Site | null
  hasPadding?: boolean
  children: ReactNode
  onGoToSites: () => void
  onCreateSite?: () => void
  onRename: () => void
  onCopyPath: () => void
  onShowInFinder: () => void
  onUpdateTrunk: () => void
  editorLabel: string
  terminalLabel: string
  onOpenInEditor: () => void
  onOpenInTerminal: () => void
  onDelete: () => void
  serverPending?: boolean
  watchPending?: boolean
  onToggleServer?: () => void
  onToggleWatch?: () => void
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
}

export function AppPage({
  site,
  hasPadding = false,
  children,
  onGoToSites,
  onCreateSite,
  onRename,
  onCopyPath,
  onShowInFinder,
  onUpdateTrunk,
  editorLabel,
  terminalLabel,
  onOpenInEditor,
  onOpenInTerminal,
  onDelete,
  serverPending = false,
  watchPending = false,
  onToggleServer,
  onToggleWatch,
  sidebarOpen = true,
  onToggleSidebar,
}: AppPageProps) {
  const breadcrumbs = site ? (
    <div
      className="app-page-breadcrumbs"
      onClickCapture={(event: MouseEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest('a')) {
          event.preventDefault()
          event.stopPropagation()
          onGoToSites()
        }
      }}
    >
      <AppRouter>
        <Breadcrumbs
          items={[
            { label: 'My sites', to: '/sites' },
            { label: site.name },
          ]}
        />
      </AppRouter>
    </div>
  ) : undefined

  const actions = site ? (
    <>
      <ProcessMenu
        online={site.serverOnline}
        pending={serverPending}
        runningLabel="Server running"
        stoppedLabel="Server stopped"
        startLabel="Start development server"
        stopLabel="Stop development server"
        onToggle={() => onToggleServer?.()}
      />
      <ProcessMenu
        online={site.watchOnline}
        pending={watchPending}
        runningLabel="Build watching"
        stoppedLabel="Build stopped"
        startLabel="Start build watch"
        stopLabel="Stop build watch"
        onToggle={() => onToggleWatch?.()}
      />
      <Button variant="solid" tone="brand" size="compact" disabled>
        Review & submit changes
      </Button>
      {onToggleSidebar ? (
        <IconButton
          icon={drawerRight}
          label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          variant="minimal"
          tone="neutral"
          size="compact"
          aria-pressed={sidebarOpen}
          onClick={onToggleSidebar}
        />
      ) : null}
      <SiteMenu
        editorLabel={editorLabel}
        terminalLabel={terminalLabel}
        onRename={onRename}
        onCopyPath={onCopyPath}
        onShowInFinder={onShowInFinder}
        onUpdateTrunk={onUpdateTrunk}
        onOpenInEditor={onOpenInEditor}
        onOpenInTerminal={onOpenInTerminal}
        onDelete={onDelete}
      />
    </>
  ) : onCreateSite ? (
    <Button variant="solid" tone="brand" size="compact" onClick={onCreateSite}>
      Create site
    </Button>
  ) : undefined

  return (
    <Page
      className="app-page"
      visual={<Icon icon={wordpress} size={24} />}
      title={site ? undefined : 'My sites'}
      breadcrumbs={breadcrumbs}
      actions={actions}
      showSidebarToggle={false}
      hasPadding={hasPadding}
      ariaLabel={site?.name ?? 'My sites'}
    >
      {children}
    </Page>
  )
}
