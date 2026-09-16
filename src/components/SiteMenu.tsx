import { IconButton, Menu } from '@wordpress/ui'
import { moreVertical } from '@wordpress/icons'

type SiteMenuProps = {
  editorLabel: string
  terminalLabel: string
  onRename: () => void
  onCopyPath: () => void
  onShowInFinder: () => void
  onUpdateTrunk: () => void
  onOpenInEditor: () => void
  onOpenInTerminal: () => void
  onDelete: () => void
}

export function SiteMenu({
  editorLabel,
  terminalLabel,
  onRename,
  onCopyPath,
  onShowInFinder,
  onUpdateTrunk,
  onOpenInEditor,
  onOpenInTerminal,
  onDelete,
}: SiteMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <IconButton
            icon={moreVertical}
            label="Site actions"
            variant="minimal"
            tone="neutral"
            size="compact"
          />
        }
      />
      <Menu.Popup>
        <Menu.Item onClick={onRename}>
          <Menu.ItemLabel>Rename…</Menu.ItemLabel>
        </Menu.Item>
        <Menu.Item onClick={onCopyPath}>
          <Menu.ItemLabel>Copy path</Menu.ItemLabel>
        </Menu.Item>
        <Menu.Item onClick={onShowInFinder}>
          <Menu.ItemLabel>Show in Finder</Menu.ItemLabel>
        </Menu.Item>
        <Menu.Item onClick={onUpdateTrunk}>
          <Menu.ItemLabel>Update to latest trunk</Menu.ItemLabel>
        </Menu.Item>
        <Menu.Item onClick={onOpenInEditor}>
          <Menu.ItemLabel>Open in {editorLabel}</Menu.ItemLabel>
        </Menu.Item>
        <Menu.Item onClick={onOpenInTerminal}>
          <Menu.ItemLabel>Open in {terminalLabel}</Menu.ItemLabel>
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item onClick={onDelete}>
          <Menu.ItemLabel>Delete site</Menu.ItemLabel>
        </Menu.Item>
      </Menu.Popup>
    </Menu.Root>
  )
}
