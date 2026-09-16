import { Button, IconButton, Tooltip } from '@wordpress/ui'
import { cog, envelope, listView, preformatted } from '@wordpress/icons'
import type { TrayId } from '../types'

type AppFooterProps = {
  showTrays?: boolean
  activeTray?: TrayId | null
  onToggleTray?: (tray: TrayId) => void
  onGiveFeedback: () => void
  onOpenSettings: () => void
}

export function AppFooter({
  showTrays = true,
  activeTray = null,
  onToggleTray,
  onGiveFeedback,
  onOpenSettings,
}: AppFooterProps) {
  return (
    <Tooltip.Provider>
      <footer className="app-footer">
        <div className="app-footer-actions">
          {showTrays ? (
            <>
              <IconButton
                icon={preformatted}
                label="Toggle Terminal"
                variant="minimal"
                tone="neutral"
                size="compact"
                aria-pressed={activeTray === 'terminal'}
                onClick={() => onToggleTray?.('terminal')}
              />
              <IconButton
                icon={listView}
                label="Toggle Logs"
                variant="minimal"
                tone="neutral"
                size="compact"
                aria-pressed={activeTray === 'logs'}
                onClick={() => onToggleTray?.('logs')}
              />
              <IconButton
                icon={envelope}
                label="Toggle Email"
                variant="minimal"
                tone="neutral"
                size="compact"
                aria-pressed={activeTray === 'email'}
                onClick={() => onToggleTray?.('email')}
              />
            </>
          ) : null}
        </div>
        <div className="app-footer-meta">
          <Button
            variant="minimal"
            tone="neutral"
            size="compact"
            onClick={onGiveFeedback}
          >
            Give feedback
          </Button>
          <IconButton
            icon={cog}
            label="Settings"
            variant="minimal"
            tone="neutral"
            size="compact"
            onClick={onOpenSettings}
          />
        </div>
      </footer>
    </Tooltip.Provider>
  )
}
