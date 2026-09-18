import { useEffect, useRef, useState } from 'react'
import { Button, Dialog, InputControl, Spinner, Stack, Text } from '@wordpress/ui'
import { FolderField } from './FolderField'

type CreateSiteDialogProps = {
  open: boolean
  defaultLocation: string
  creating?: boolean
  statusMessage?: string
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, location: string) => void
}

export function CreateSiteDialog({
  open,
  defaultLocation,
  creating = false,
  statusMessage,
  onOpenChange,
  onCreate,
}: CreateSiteDialogProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState(defaultLocation)
  const [showProgress, setShowProgress] = useState(false)
  const wasOpen = useRef(open)

  useEffect(() => {
    if (creating) {
      setShowProgress(true)
    }
  }, [creating])

  useEffect(() => {
    if (open && !wasOpen.current) {
      setName('')
      setLocation(defaultLocation)
      setShowProgress(false)
    }

    wasOpen.current = open
  }, [open, defaultLocation])

  return (
    <Dialog.Root
      open={open}
      disablePointerDismissal={showProgress}
      onOpenChange={(next, eventDetails) => {
        if (
          !next &&
          showProgress &&
          (eventDetails.reason === 'escapeKey' ||
            eventDetails.reason === 'outsidePress' ||
            eventDetails.reason === 'closePress' ||
            eventDetails.reason === 'focusOut')
        ) {
          eventDetails.cancel()
          return
        }

        onOpenChange(next)
      }}
      onOpenChangeComplete={(next) => {
        if (!next) {
          setShowProgress(false)
        }
      }}
    >
      <Dialog.Popup size="small">
        <Dialog.Header>
          <Dialog.Title>Create site</Dialog.Title>
          {showProgress ? null : <Dialog.CloseIcon />}
        </Dialog.Header>
        <Dialog.Content>
          {showProgress ? (
            <Stack
              direction="column"
              gap="md"
              align="center"
              aria-live="polite"
              aria-busy="true"
            >
              <Spinner />
              <Text variant="body-md">{statusMessage}</Text>
            </Stack>
          ) : (
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
          )}
        </Dialog.Content>
        {showProgress ? null : (
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
        )}
      </Dialog.Popup>
    </Dialog.Root>
  )
}
