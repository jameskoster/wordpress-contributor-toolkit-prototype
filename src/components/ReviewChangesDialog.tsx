import { Button, Dialog, Stack, Text } from '@wordpress/ui'

type ReviewChangesDialogProps = {
  open: boolean
  siteName: string
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}

export function ReviewChangesDialog({
  open,
  siteName,
  onOpenChange,
  onSubmit,
}: ReviewChangesDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Popup size="medium">
        <Dialog.Header>
          <Dialog.Title>Review & submit changes</Dialog.Title>
          <Dialog.CloseIcon />
        </Dialog.Header>
        <Dialog.Content>
          <Stack direction="column" gap="md">
            <Text variant="body-md">
              Local changes on {siteName}. This prototype shows a typical review
              list from the current app.
            </Text>
            <ul className="change-list">
              <li>
                <Text variant="body-sm">
                  src/wp-includes/functions.php — updated helper comments
                </Text>
              </li>
              <li>
                <Text variant="body-sm">
                  src/wp-admin/css/common.css — spacing tweak
                </Text>
              </li>
            </ul>
          </Stack>
        </Dialog.Content>
        <Dialog.Footer>
          <Button variant="outline" tone="neutral" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Create pull request</Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  )
}
