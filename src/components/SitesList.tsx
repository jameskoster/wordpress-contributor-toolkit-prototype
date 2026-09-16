import { useMemo, useState } from 'react'
import {
  DataViews,
  filterSortAndPaginate,
  type Action,
  type Field,
  type View,
} from '@wordpress/dataviews'
import { Card, Text } from '@wordpress/ui'
import type { Site } from '../types'

const fields: Field<Site>[] = [
  {
    id: 'name',
    type: 'text',
    label: 'Name',
    enableHiding: false,
    enableGlobalSearch: true,
  },
  {
    id: 'path',
    type: 'text',
    label: 'Local path',
    enableGlobalSearch: true,
    render: ({ item }) => (
      <Text variant="body-sm" className="muted-label sites-list-path">
        {item.path}
      </Text>
    ),
  },
  {
    id: 'created',
    type: 'text',
    label: 'Created',
  },
  {
    id: 'ticket',
    type: 'text',
    label: 'Ticket',
    getValue: ({ item }) => item.ticket ?? '',
    render: ({ item }) => item.ticket ?? '—',
  },
]

const defaultView: View = {
  type: 'table',
  search: '',
  page: 1,
  perPage: 20,
  titleField: 'name',
  descriptionField: 'path',
  fields: ['created', 'ticket'],
  layout: {
    density: 'comfortable',
  },
}

const defaultLayouts = {
  table: {
    layout: {
      density: 'comfortable',
    },
  },
} as const

type SitesListProps = {
  sites: Site[]
  editorLabel: string
  terminalLabel: string
  onOpenSite: (site: Site) => void
  onRename: (site: Site) => void
  onCopyPath: (site: Site) => void
  onShowInFinder: (site: Site) => void
  onUpdateTrunk: (site: Site) => void
  onOpenInEditor: (site: Site) => void
  onOpenInTerminal: (site: Site) => void
  onDelete: (site: Site) => void
}

export function SitesList({
  sites,
  editorLabel,
  terminalLabel,
  onOpenSite,
  onRename,
  onCopyPath,
  onShowInFinder,
  onUpdateTrunk,
  onOpenInEditor,
  onOpenInTerminal,
  onDelete,
}: SitesListProps) {
  const [view, setView] = useState<View>(defaultView)
  const records = useMemo(() => [...sites].reverse(), [sites])
  const { data, paginationInfo } = useMemo(
    () => filterSortAndPaginate(records, view, fields),
    [records, view]
  )
  const actions = useMemo<Action<Site>[]>(
    () => [
      {
        id: 'rename',
        label: 'Rename…',
        callback: ([item]) => {
          if (item) {
            onRename(item)
          }
        },
      },
      {
        id: 'copy-path',
        label: 'Copy path',
        callback: ([item]) => {
          if (item) {
            onCopyPath(item)
          }
        },
      },
      {
        id: 'show-in-finder',
        label: 'Show in Finder',
        callback: ([item]) => {
          if (item) {
            onShowInFinder(item)
          }
        },
      },
      {
        id: 'update-trunk',
        label: 'Update to latest trunk',
        callback: ([item]) => {
          if (item) {
            onUpdateTrunk(item)
          }
        },
      },
      {
        id: 'open-in-editor',
        label: `Open in ${editorLabel}`,
        callback: ([item]) => {
          if (item) {
            onOpenInEditor(item)
          }
        },
      },
      {
        id: 'open-in-terminal',
        label: `Open in ${terminalLabel}`,
        callback: ([item]) => {
          if (item) {
            onOpenInTerminal(item)
          }
        },
      },
      {
        id: 'delete',
        label: 'Delete site',
        callback: ([item]) => {
          if (item) {
            onDelete(item)
          }
        },
      },
    ],
    [
      editorLabel,
      onCopyPath,
      onDelete,
      onOpenInEditor,
      onOpenInTerminal,
      onRename,
      onShowInFinder,
      onUpdateTrunk,
      terminalLabel,
    ]
  )

  return (
    <div className="sites-list">
      <Card.Root>
        <Card.Content style={{ height: 'auto', minHeight: 0 }}>
          <Card.FullBleed>
            <DataViews
              data={data}
              fields={fields}
              view={view}
              onChangeView={setView}
              paginationInfo={paginationInfo}
              defaultLayouts={defaultLayouts}
              actions={actions}
              searchLabel="Search sites"
              onClickItem={onOpenSite}
              empty={<Text variant="body-md">No sites match this search.</Text>}
            />
          </Card.FullBleed>
        </Card.Content>
      </Card.Root>
    </div>
  )
}
