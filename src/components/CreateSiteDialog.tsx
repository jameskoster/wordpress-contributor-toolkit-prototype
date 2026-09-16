import { useState } from 'react'
import { Button, Dialog, InputControl, Stack } from '@wordpress/ui'
import { FolderField } from './FolderField'

type CreateSiteDialogProps = {
  open: boolean
  defaultLocation: string
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, location: string) => void
}

export function CreateSiteDialog({
  open,
  defaultLocation,
  onOpenChange,
  onCreate,
}: CreateSiteDialogProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState(defaultLocation)

  function reset() {
    setName('')
    setLocation(defaultLocation)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) {
          setLocation(defaultLocation)
        } else {
          reset()
        }
      }}
    >
      <Dialog.Popup size="small">
        <Dialog.Header>
          <Dialog.Title>Create site</Dialog.Title>
          <Dialog.CloseIcon />
        </Dialog.Header>
        <Dialog.Content>
          <Stack direction="column" gap="md">
            <InputControl
              label="Site name"
              value={name}
              placeholder="My WordPress site"
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <FolderField
              label="Location"
              description="Choose the parent folder where you want this new site created. A new subdirectory will be created for the site"
              value={location}
              onChange={setLocation}
            />
          </Stack>
        </Dialog.Content>
        <Dialog.Footer>
          <Button
            onClick={() =>
              onCreate(
                name.trim() || 'My WordPress site',
                location.trim() || defaultLocation
              )
            }
          >
            Create site
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  )
}
