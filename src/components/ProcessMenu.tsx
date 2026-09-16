import { Button, Menu } from '@wordpress/ui'
import { Icon, chevronDown } from '@wordpress/icons'

type ProcessMenuProps = {
  online: boolean
  pending: boolean
  runningLabel: string
  stoppedLabel: string
  startLabel: string
  stopLabel: string
  onToggle: () => void
}

export function ProcessMenu({
  online,
  pending,
  runningLabel,
  stoppedLabel,
  startLabel,
  stopLabel,
  onToggle,
}: ProcessMenuProps) {
  const label = online ? runningLabel : stoppedLabel

  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button
            className="process-menu-trigger"
            variant="minimal"
            tone="neutral"
            size="compact"
            aria-label={label}
          >
            <span
              className={
                online ? 'process-status is-online' : 'process-status'
              }
            />
            {label}
            <Icon icon={chevronDown} size={16} />
          </Button>
        }
      />
      <Menu.Popup>
        <Menu.Item disabled={pending} onClick={onToggle}>
          <Menu.ItemLabel>{online ? stopLabel : startLabel}</Menu.ItemLabel>
        </Menu.Item>
      </Menu.Popup>
    </Menu.Root>
  )
}
