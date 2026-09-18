import { Page } from '@wordpress/admin-ui'
import { Button, IconButton } from '@wordpress/ui'
import { drawerLeft, drawerRight } from '@wordpress/icons'
import type { ReactNode } from 'react'
import type { Site } from '../types'
import { ProcessMenu } from './ProcessMenu'
import { SiteMenu } from './SiteMenu'

type AppPageProps = {
  site: Site
  children: ReactNode
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
  sitesListOpen?: boolean
  onToggleSitesList?: () => void
}

export function AppPage({
  site,
  children,
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
  sitesListOpen = true,
  onToggleSitesList,
}: AppPageProps) {
  return (
    <Page
      className="app-page"
      title={site.name}
      actions={
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
      }
      showSidebarToggle={Boolean(onToggleSitesList)}
      hasPadding={false}
      ariaLabel={site.name}
    >
      {onToggleSitesList ? (
        <Page.SidebarToggleFill>
          <IconButton
            icon={drawerLeft}
            label={sitesListOpen ? 'Hide sites list' : 'Show sites list'}
            variant="minimal"
            tone="neutral"
            size="compact"
            aria-pressed={sitesListOpen}
            onClick={onToggleSitesList}
          />
        </Page.SidebarToggleFill>
      ) : null}
      {children}
    </Page>
  )
}
