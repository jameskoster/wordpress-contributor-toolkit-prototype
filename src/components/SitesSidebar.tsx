import { useMemo, useState } from 'react'
import {
  DataViews,
  filterSortAndPaginate,
  type Action,
  type Field,
  type View,
} from '@wordpress/dataviews'
import { Page } from '@wordpress/admin-ui'
import { Button, Text } from '@wordpress/ui'
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
      <Text variant="body-sm" className="muted-label sites-sidebar-path">
        {item.path}
      </Text>
    ),
  },
]

const defaultView: View = {
  type: 'list',
  search: '',
  page: 1,
  perPage: 100,
  titleField: 'name',
  descriptionField: 'path',
  showMedia: false,
  fields: [],
  layout: {
    density: 'balanced',
  },
}

const defaultLayouts = {
  list: {
    layout: {
      density: 'balanced',
    },
  },
} as const

type SitesSidebarProps = {
  sites: Site[]
  selectedSiteId: string
  editorLabel: string
  terminalLabel: string
  onSelectSite: (site: Site) => void
  onCreateSite: () => void
  onRename: (site: Site) => void
  onCopyPath: (site: Site) => void
  onShowInFinder: (site: Site) => void
  onUpdateTrunk: (site: Site) => void
  onOpenInEditor: (site: Site) => void
  onOpenInTerminal: (site: Site) => void
  onDelete: (site: Site) => void
}

export function SitesSidebar({
  sites,
  selectedSiteId,
  editorLabel,
  terminalLabel,
  onSelectSite,
  onCreateSite,
  onRename,
  onCopyPath,
  onShowInFinder,
  onUpdateTrunk,
  onOpenInEditor,
  onOpenInTerminal,
  onDelete,
}: SitesSidebarProps) {
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

  function handleSelectionChange(ids: string[]) {
    const nextId = ids.find((id) => id !== selectedSiteId) ?? ids[0]
    if (!nextId) {
      return
    }

    const next = sites.find((item) => item.id === nextId)
    if (next) {
      onSelectSite(next)
    }
  }

  return (
    <Page
      className="sites-sidebar"
      title="My sites"
      actions={
        <Button
          variant="solid"
          tone="brand"
          size="compact"
          onClick={onCreateSite}
        >
          Create new site
        </Button>
      }
      showSidebarToggle={false}
      hasPadding={false}
      ariaLabel="My sites"
    >
      <div className="sites-sidebar-list">
        <DataViews
          data={data}
          fields={fields}
          view={view}
          onChangeView={setView}
          paginationInfo={paginationInfo}
          defaultLayouts={defaultLayouts}
          actions={actions}
          selection={[selectedSiteId]}
          onChangeSelection={handleSelectionChange}
        >
          <DataViews.Layout />
        </DataViews>
      </div>
    </Page>
  )
}
