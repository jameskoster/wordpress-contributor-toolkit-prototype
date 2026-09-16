import { useState } from 'react'
import { Field, Text } from '@wordpress/ui'
import { folderPathFromFiles } from '../helpers'

type FolderFieldProps = {
  label: string
  description: string
  value: string
  onChange: (path: string) => void
}

export function FolderField({
  label,
  description,
  value,
  onChange,
}: FolderFieldProps) {
  const [pickerKey, setPickerKey] = useState(0)

  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <Field.Control
        key={pickerKey}
        className="file-field-control"
        render={
          <input
            type="file"
            // @ts-expect-error — folder picker is a non-standard input attribute
            webkitdirectory=""
          />
        }
        onChange={(event) => {
          const path = folderPathFromFiles(event.currentTarget.files)
          if (!path) {
            return
          }
          onChange(path)
          setPickerKey((key) => key + 1)
        }}
      />
      {value ? <Text variant="body-sm">{value}</Text> : null}
      <Field.Description>{description}</Field.Description>
    </Field.Root>
  )
}
