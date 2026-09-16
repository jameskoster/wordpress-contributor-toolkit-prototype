import { useEffect, useRef, useState } from 'react'
import { Button, Dialog, Stack, Text } from '@wordpress/ui'

const APPLY_DELAY = 1400

const DEFAULT_FILES = [
  'src/wp-includes/functions.php',
  'tests/phpunit/tests/functions/wpFilterObjectList.php',
] as const

function filesForPatch(value: string) {
  if (/\.(diff|patch)\b/i.test(value)) {
    return [
      'src/wp-includes/functions.php',
      'src/wp-includes/class-wp-list-util.php',
    ]
  }

  return [...DEFAULT_FILES]
}

function patchLabel(value: string) {
  const trimmed = value.trim()
  const fileName = trimmed.split('/').pop() ?? trimmed
  const pullMatch = trimmed.match(/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/i)
  const number = pullMatch?.[1] ?? fileName.match(/^#?(\d+)$/)?.[1]

  if (number) {
    return `#${number}`
  }

  return fileName
}

type ApplyPatchDialogProps = {
  value: string | null
  onOpenChange: (open: boolean) => void
  onApply: (value: string) => void
}

export function ApplyPatchDialog({
  value,
  onOpenChange,
  onApply,
}: ApplyPatchDialogProps) {
  const [pending, setPending] = useState(false)
  const [displayValue, setDisplayValue] = useState(value ?? '')
  const pendingTimer = useRef<number>(undefined)
  const files = filesForPatch(displayValue)

  useEffect(() => {
    return () => window.clearTimeout(pendingTimer.current)
  }, [])

  useEffect(() => {
    window.clearTimeout(pendingTimer.current)
    setPending(false)
    if (value) {
      setDisplayValue(value)
    }
  }, [value])

  function handleOpenChange(open: boolean) {
    if (pending) {
      return
    }

    onOpenChange(open)
  }

  function handleApply() {
    if (!value || pending) {
      return
    }

    setPending(true)
    pendingTimer.current = window.setTimeout(() => {
      onApply(displayValue || value)
      setPending(false)
    }, APPLY_DELAY)
  }

  return (
    <Dialog.Root open={Boolean(value)} onOpenChange={handleOpenChange}>
      <Dialog.Popup size="small">
        <Dialog.Header>
          <Dialog.Title>
            {displayValue
              ? `Apply ${patchLabel(displayValue)}`
              : 'Apply these changes'}
          </Dialog.Title>
          <Dialog.CloseIcon />
        </Dialog.Header>
        <Dialog.Content>
          <Stack direction="column" gap="md">
            <Text variant="body-md">
              These files in your checkout will be updated, then the site will
              rebuild.
            </Text>
            <ul className="change-list">
              {files.map((file) => (
                <li key={file}>
                  <Text variant="body-sm">
                    <code>{file}</code>
                  </Text>
                </li>
              ))}
            </ul>
          </Stack>
        </Dialog.Content>
        <Dialog.Footer>
          <Button
            loading={pending}
            loadingAnnouncement="Applying and rebuilding"
            onClick={handleApply}
          >
            Apply and rebuild
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  )
}
