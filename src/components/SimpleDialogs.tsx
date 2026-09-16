import { useState } from 'react'
import { AlertDialog, Button, Dialog, InputControl, TextareaControl } from '@wordpress/ui'

type RenameDialogProps = {
  open: boolean
  value: string
  onOpenChange: (open: boolean) => void
  onRename: (name: string) => void
}

export function RenameDialog({
  open,
  value,
  onOpenChange,
  onRename,
}: RenameDialogProps) {
  const [name, setName] = useState(value)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) {
          setName(value)
        }
      }}
    >
      <Dialog.Popup size="small">
        <Dialog.Header>
          <Dialog.Title>Rename site</Dialog.Title>
          <Dialog.CloseIcon />
        </Dialog.Header>
        <Dialog.Content>
          <InputControl
            label="Site name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </Dialog.Content>
        <Dialog.Footer>
          <Button onClick={() => onRename(name.trim() || value)}>Rename</Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  )
}

type FeedbackDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}

export function FeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
}: FeedbackDialogProps) {
  const [message, setMessage] = useState('')

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setMessage('')
        }
      }}
    >
      <Dialog.Popup size="small">
        <Dialog.Header>
          <Dialog.Title>Give feedback</Dialog.Title>
          <Dialog.CloseIcon />
        </Dialog.Header>
        <Dialog.Content>
          <TextareaControl
            label="How can this app help you contribute?"
            value={message}
            onChange={(event) => setMessage(event.currentTarget.value)}
          />
        </Dialog.Content>
        <Dialog.Footer>
          <Button onClick={onSubmit} disabled={!message.trim()}>
            Send feedback
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  )
}

type DeleteDialogProps = {
  open: boolean
  siteName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteDialog({
  open,
  siteName,
  onOpenChange,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange} onConfirm={onConfirm}>
      <AlertDialog.Popup
        intent="irreversible"
        title={`Delete ${siteName}?`}
        description="This will permanently delete the site and all of its files from your computer. This can’t be undone."
        confirmButtonText="Delete site"
        cancelButtonText="Cancel"
      />
    </AlertDialog.Root>
  )
}
