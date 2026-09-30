import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DataViews,
  filterSortAndPaginate,
  type Field,
  type View,
} from '@wordpress/dataviews'
import {
  AlertDialog,
  Button,
  Drawer,
  Icon,
  InputControl,
  Select,
  Spinner,
  Stack,
  Tabs,
  Text,
} from '@wordpress/ui'
import { code, file, html, image, page, styles } from '@wordpress/icons'

type ChangedFile = {
  id: string
  path: string
  status: string
  diff: string
}

const CHANGED_FILES: ChangedFile[] = [
  {
    id: 'functions-php',
    path: 'src/wp-includes/functions.php',
    status: 'Modified',
    diff: `--- a/src/wp-includes/functions.php
+++ b/src/wp-includes/functions.php
@@ -6124,7 +6124,10 @@ function wp_maybe_load_widgets() {
 	if ( ! did_action( 'widgets_init' ) ) {
 		return;
 	}
-
-	_doing_it_wrong( __FUNCTION__, 'Widgets should load from widgets_init.', '6.9.0' );
+	// Keep the helper comment next to the doing-it-wrong notice
+	// so contributors can see why the call is rejected.
+	_doing_it_wrong(
+		__FUNCTION__,
+		'Widgets should load from widgets_init.',
+		'6.9.0'
+	);
 }`,
  },
  {
    id: 'common-css',
    path: 'src/wp-admin/css/common.css',
    status: 'Modified',
    diff: `--- a/src/wp-admin/css/common.css
+++ b/src/wp-admin/css/common.css
@@ -48,8 +48,8 @@ body.wp-admin {
 	background: #f0f0f1;
 }
 
-.wrap {
-	margin: 10px 20px 0 2px;
+.wrap {
+	margin: 16px 24px 0 8px;
 }`,
  },
  {
    id: 'common-js',
    path: 'src/wp-admin/js/common.js',
    status: 'Modified',
    diff: `--- a/src/wp-admin/js/common.js
+++ b/src/wp-admin/js/common.js
@@ -120,6 +120,9 @@ function columns() {
 		return;
 	}
 
+	// Remember the last collapsed admin menu state.
+	window.localStorage.setItem( 'wp-admin-menu', 'collapsed' );
+
 	$( '#adminmenu' ).addClass( 'folded' );
 }`,
  },
]

function fileName(path: string) {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? path : path.slice(slash + 1)
}

function fileDirectory(path: string) {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? '' : path.slice(0, slash)
}

function fileDetail(item: ChangedFile) {
  const directory = fileDirectory(item.path)
  return directory ? `${directory} · ${item.status}` : item.status
}

function fileExtension(path: string) {
  const name = fileName(path)
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

function fileTypeIcon(path: string) {
  switch (fileExtension(path)) {
    case 'php':
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'json':
      return code
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return styles
    case 'html':
    case 'htm':
    case 'xml':
      return html
    case 'md':
    case 'txt':
      return page
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return image
    default:
      return file
  }
}

const fields: Field<ChangedFile>[] = [
  {
    id: 'media',
    type: 'media',
    label: 'Type',
    enableHiding: false,
    enableSorting: false,
    getValue: ({ item }) => fileExtension(item.path),
    render: ({ item }) => (
      <span className="review-file-icon" aria-hidden="true">
        <Icon icon={fileTypeIcon(item.path)} />
      </span>
    ),
  },
  {
    id: 'name',
    type: 'text',
    label: 'File',
    enableHiding: false,
    enableGlobalSearch: true,
    getValue: ({ item }) => fileName(item.path),
  },
  {
    id: 'detail',
    type: 'text',
    label: 'Location',
    enableHiding: false,
    getValue: ({ item }) => fileDetail(item),
    render: ({ item }) => (
      <Text variant="body-sm" className="muted-label">
        {fileDetail(item)}
      </Text>
    ),
  },
]

const defaultView: View = {
  type: 'list',
  search: '',
  page: 1,
  perPage: 20,
  titleField: 'name',
  descriptionField: 'detail',
  mediaField: 'media',
  showMedia: true,
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

type DiffKind = 'hunk' | 'context' | 'add' | 'remove'

type DiffLine = {
  kind: DiffKind
  text: string
  oldNumber?: number
  newNumber?: number
}

type DiffLayout = 'unified' | 'split'

type SplitRow = {
  left: DiffLine | null
  right: DiffLine | null
}

const DIFF_LAYOUTS = [
  { value: 'unified', label: 'Unified' },
  { value: 'split', label: 'Split' },
] as const

function parseDiff(diff: string): DiffLine[] {
  const lines: DiffLine[] = []
  let oldNumber = 0
  let newNumber = 0

  for (const raw of diff.split('\n')) {
    if (raw.startsWith('---') || raw.startsWith('+++') || raw.startsWith('\\')) {
      continue
    }

    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw)
    if (hunk) {
      oldNumber = Number(hunk[1])
      newNumber = Number(hunk[2])
      lines.push({ kind: 'hunk', text: raw })
      continue
    }

    if (raw.startsWith('+')) {
      lines.push({ kind: 'add', text: raw.slice(1), newNumber })
      newNumber += 1
      continue
    }

    if (raw.startsWith('-')) {
      lines.push({ kind: 'remove', text: raw.slice(1), oldNumber })
      oldNumber += 1
      continue
    }

    const text = raw.startsWith(' ') ? raw.slice(1) : raw
    lines.push({ kind: 'context', text, oldNumber, newNumber })
    oldNumber += 1
    newNumber += 1
  }

  return lines
}

function toSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line) {
      break
    }

    if (line.kind === 'hunk' || line.kind === 'context') {
      rows.push({ left: line, right: line })
      index += 1
      continue
    }

    const removed: DiffLine[] = []
    const added: DiffLine[] = []
    while (lines[index]?.kind === 'remove') {
      const next = lines[index]
      if (next) {
        removed.push(next)
      }
      index += 1
    }
    while (lines[index]?.kind === 'add') {
      const next = lines[index]
      if (next) {
        added.push(next)
      }
      index += 1
    }

    const count = Math.max(removed.length, added.length)
    for (let pair = 0; pair < count; pair += 1) {
      rows.push({
        left: removed[pair] ?? null,
        right: added[pair] ?? null,
      })
    }
  }

  return rows
}

function lineMarker(kind: DiffKind) {
  if (kind === 'add') {
    return '+'
  }
  if (kind === 'remove') {
    return '-'
  }
  if (kind === 'context') {
    return ' '
  }
  return ''
}

function FilePath({ path }: { path: string }) {
  const parts = path.split('/')
  const name = parts.pop() ?? path

  return (
    <span className="review-diff-path" title={path}>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          <span className="review-diff-path-dir">{part}</span>
          <span className="review-diff-path-sep"> / </span>
        </span>
      ))}
      <span className="review-diff-path-name">{name}</span>
    </span>
  )
}

function DiffCode({ line }: { line: DiffLine }) {
  if (line.kind === 'hunk') {
    return line.text
  }

  return `${lineMarker(line.kind)}${line.text}`
}

function UnifiedDiff({ lines }: { lines: DiffLine[] }) {
  return (
    <table className="review-diff">
      <tbody>
        {lines.map((line, index) => {
          const number =
            line.kind === 'add' || line.kind === 'context'
              ? line.newNumber
              : line.oldNumber

          return (
            <tr key={index} className={`is-${line.kind}`}>
              <td className={`review-diff-gutter is-${line.kind}`}>
                {number ?? ''}
              </td>
              <td className={`review-diff-code is-${line.kind}`}>
                <DiffCode line={line} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function SplitPane({
  line,
  side,
}: {
  line: DiffLine | null
  side: 'left' | 'right'
}) {
  if (!line || line.kind === 'hunk') {
    return (
      <div className="review-diff-pane">
        <span className="review-diff-gutter" />
        <span className="review-diff-code">{'\u00a0'}</span>
      </div>
    )
  }

  const number = side === 'left' ? line.oldNumber : line.newNumber

  return (
    <div className={`review-diff-pane is-${line.kind}`}>
      <span className={`review-diff-gutter is-${line.kind}`}>{number ?? ''}</span>
      <span className={`review-diff-code is-${line.kind}`}>
        <DiffCode line={line} />
      </span>
    </div>
  )
}

function SplitDiff({ rows }: { rows: SplitRow[] }) {
  return (
    <div className="review-diff is-split">
      {rows.map((row, index) => {
        if (row.left?.kind === 'hunk') {
          return (
            <div key={index} className="review-diff-hunk">
              {row.left.text}
            </div>
          )
        }

        return (
          <div key={index} className="review-diff-split-row">
            <SplitPane line={row.left} side="left" />
            <SplitPane line={row.right} side="right" />
          </div>
        )
      })}
    </div>
  )
}

const GITHUB_CONNECT_DELAY = 5000

function generateDeviceCode() {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return String(value[0] % 100_000_000).padStart(8, '0')
}

function countDiffStats(files: ChangedFile[]) {
  let added = 0
  let removed = 0

  for (const file of files) {
    for (const line of file.diff.split('\n')) {
      if (line.startsWith('+++') || line.startsWith('---')) {
        continue
      }
      if (line.startsWith('+')) {
        added += 1
      } else if (line.startsWith('-')) {
        removed += 1
      }
    }
  }

  return { files: files.length, added, removed }
}

const DIFF_STATS = countDiffStats(CHANGED_FILES)

function formatDeviceCode(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

const GITHUB_REPO = 'WordPress/wordpress-develop'

const TARGET_BRANCHES = [
  { value: 'trunk', label: 'trunk' },
  { value: '6.9', label: '6.9' },
  { value: '6.8', label: '6.8' },
] as const

type TargetBranch = (typeof TARGET_BRANCHES)[number]['value']

function isTargetBranch(value: unknown): value is TargetBranch {
  return TARGET_BRANCHES.some((branch) => branch.value === value)
}

function GitHubMark() {
  return (
    <span className="review-github-mark" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="16" height="16">
        <path
          fill="currentColor"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
        />
      </svg>
    </span>
  )
}

function GitHubConnectionStatus({
  onDisconnected,
}: {
  onDisconnected: () => void
}) {
  return (
    <div className="review-github-status">
      <span className="review-github-status-identity">
        <span className="review-github-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <circle cx="12" cy="8.25" r="3.15" fill="currentColor" />
            <path
              fill="currentColor"
              d="M6.1 18.8c.7-3.15 2.9-4.7 5.9-4.7s5.2 1.55 5.9 4.7c.15.65-.35 1.2-1 1.2H7.1c-.65 0-1.15-.55-1-1.2z"
            />
          </svg>
          <span className="review-github-status-dot" />
        </span>
        <Text variant="body-md">GitHub connected</Text>
      </span>
      <Button
        variant="minimal"
        tone="brand"
        size="compact"
        onClick={onDisconnected}
      >
        Disconnect
      </Button>
    </div>
  )
}

type GitHubSubmitCardProps = {
  connected: boolean
  onConnected: () => void
  onCopyDeviceCode: () => void
  onOpenPullRequest: (branch: TargetBranch) => void
}

function GitHubSubmitCard({
  connected,
  onConnected,
  onCopyDeviceCode,
  onOpenPullRequest,
}: GitHubSubmitCardProps) {
  const [code, setCode] = useState<string | null>(null)
  const [targetBranch, setTargetBranch] = useState<TargetBranch>('trunk')
  const timerRef = useRef<number>(undefined)
  const waiting = Boolean(code) && !connected

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (connected) {
      window.clearTimeout(timerRef.current)
      setCode(null)
      return
    }

    setTargetBranch('trunk')
  }, [connected])

  function startConnect() {
    const nextCode = generateDeviceCode()
    setCode(nextCode)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setCode(null)
      onConnected()
    }, GITHUB_CONNECT_DELAY)
  }

  function cancelConnect() {
    window.clearTimeout(timerRef.current)
    setCode(null)
  }

  const displayCode = code ? formatDeviceCode(code) : ''

  return (
    <Stack direction="column" gap="md">
      {connected ? (
        <Stack direction="column" gap="sm">
          <Text variant="heading-sm">Pull request</Text>
          <Select.Root
            items={TARGET_BRANCHES}
            modal={false}
            value={targetBranch}
            onValueChange={(value) => {
              if (isTargetBranch(value)) {
                setTargetBranch(value)
              }
            }}
          >
            <Select.Trigger
              aria-label="Target branch"
              className="review-github-branch"
            >
              {(value) => (
                <span className="review-github-branch-value">
                  <GitHubMark />
                  <span className="review-github-branch-copy">
                    <Text variant="body-md" className="review-github-repo">
                      {GITHUB_REPO}
                    </Text>
                    <Text variant="body-sm" className="muted-label">
                      Target branch: {isTargetBranch(value) ? value : targetBranch}
                    </Text>
                  </span>
                </span>
              )}
            </Select.Trigger>
            <Select.Popup>
              {TARGET_BRANCHES.map((branch) => (
                <Select.Item key={branch.value} value={branch.value}>
                  {branch.label}
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Root>
        </Stack>
      ) : (
        <Text variant="body-md">
          Connect your GitHub account to open a pull request from this checkout.
          A browser window will open — paste the generated code there to finish
          connecting.
        </Text>
      )}
      {waiting ? (
        <Stack direction="column" gap="md">
          <Stack
            direction="row"
            align="center"
            justify="space-between"
            gap="sm"
          >
            <Text variant="heading-md" className="review-github-code">
              {displayCode}
            </Text>
            <Button
              variant="outline"
              size="compact"
              onClick={() => {
                void navigator.clipboard?.writeText(displayCode)
                onCopyDeviceCode()
              }}
            >
              Copy code
            </Button>
          </Stack>
          <Stack direction="row" align="center" gap="sm">
            <Spinner />
            <Text variant="body-md">
              Waiting for you to finish in the browser…
            </Text>
          </Stack>
          <Button variant="outline" tone="neutral" onClick={cancelConnect}>
            Cancel
          </Button>
        </Stack>
      ) : (
        <Stack direction="column" gap="sm">
          <Button
            variant="solid"
            tone="brand"
            onClick={
              connected ? () => onOpenPullRequest(targetBranch) : startConnect
            }
          >
            {connected
              ? 'Open a pull request on GitHub'
              : 'Connect to GitHub'}
          </Button>
        </Stack>
      )}
    </Stack>
  )
}

type TracSubmitCardProps = {
  onDownloadPatch: () => void
}

function TracSubmitCard({ onDownloadPatch }: TracSubmitCardProps) {
  const [username, setUsername] = useState('')

  return (
    <Stack direction="column" gap="md">
      <Text variant="body-md">
        Download a patch to attach to the linked WordPress Core Trac ticket.
      </Text>
      <InputControl
        label="WordPress.org username"
        description="Your username makes sure contribution credits are applied to you."
        value={username}
        autoComplete="username"
        spellCheck={false}
        onChange={(event) => setUsername(event.currentTarget.value)}
      />
      <Button variant="outline" tone="neutral" onClick={onDownloadPatch}>
        Download a patch to attach to Trac
      </Button>
    </Stack>
  )
}

type ReviewChangesDrawerProps = {
  open: boolean
  githubConnected: boolean
  onOpenChange: (open: boolean) => void
  onGitHubConnected: () => void
  onGitHubDisconnected: () => void
  onCopyDeviceCode: () => void
  onOpenPullRequest: (branch: TargetBranch) => void
  onDownloadPatch: () => void
}

export function ReviewChangesDrawer({
  open,
  githubConnected,
  onOpenChange,
  onGitHubConnected,
  onGitHubDisconnected,
  onCopyDeviceCode,
  onOpenPullRequest,
  onDownloadPatch,
}: ReviewChangesDrawerProps) {
  const [view, setView] = useState<View>(defaultView)
  const [selectedId, setSelectedId] = useState(CHANGED_FILES[0]?.id ?? '')
  const [diffLayout, setDiffLayout] = useState<DiffLayout>('unified')
  const [discardOpen, setDiscardOpen] = useState(false)
  const { data, paginationInfo } = useMemo(
    () => filterSortAndPaginate(CHANGED_FILES, view, fields),
    [view]
  )
  const selectedFile =
    CHANGED_FILES.find((file) => file.id === selectedId) ?? CHANGED_FILES[0]
  const diffLines = useMemo(
    () => (selectedFile ? parseDiff(selectedFile.diff) : []),
    [selectedFile]
  )
  const splitRows = useMemo(() => toSplitRows(diffLines), [diffLines])

  useEffect(() => {
    if (open) {
      setSelectedId(CHANGED_FILES[0]?.id ?? '')
      setView(defaultView)
    }
  }, [open])

  function handleSelectionChange(ids: string[]) {
    const nextId = ids[0]
    if (nextId) {
      setSelectedId(nextId)
    }
  }

  return (
    <>
    <Drawer.Root
      open={open}
      swipeDirection="down"
      onOpenChange={onOpenChange}
    >
      <Drawer.Popup size="stretch" className="review-drawer-popup">
        <Drawer.Header>
          <Stack direction="column" gap="xs" className="review-drawer-heading">
            <Drawer.Title>Review & submit changes</Drawer.Title>
            <Drawer.Description>
              {DIFF_STATS.files}{' '}
              {DIFF_STATS.files === 1 ? 'file' : 'files'} changed{' '}
              <span className="review-diff-stat is-added">
                +{DIFF_STATS.added}
              </span>{' '}
              <span className="review-diff-stat is-removed">
                - {DIFF_STATS.removed}
              </span>
            </Drawer.Description>
          </Stack>
          <Drawer.CloseIcon />
        </Drawer.Header>
        <Drawer.Content className="review-drawer-content">
          <div className="review-drawer-columns">
            <div className="review-drawer-files">
              <div className="review-drawer-files-body">
                <DataViews
                  data={data}
                  fields={fields}
                  view={view}
                  onChangeView={setView}
                  paginationInfo={paginationInfo}
                  defaultLayouts={defaultLayouts}
                  selection={selectedFile ? [selectedFile.id] : []}
                  onChangeSelection={handleSelectionChange}
                >
                  <DataViews.Layout />
                </DataViews>
              </div>
              <div className="review-files-footer">
                <Button
                  variant="outline"
                  tone="neutral"
                  className="review-files-discard"
                  onClick={() => setDiscardOpen(true)}
                >
                  Discard all changes
                </Button>
              </div>
            </div>
            <div className="review-drawer-diff">
              {selectedFile ? (
                <>
                  <div className="review-diff-header">
                    <FilePath path={selectedFile.path} />
                    <Select.Root
                      items={DIFF_LAYOUTS}
                      modal={false}
                      value={diffLayout}
                      onValueChange={(value) => {
                        if (value === 'unified' || value === 'split') {
                          setDiffLayout(value)
                        }
                      }}
                    >
                      <Select.Trigger
                        size="compact"
                        aria-label="Diff layout"
                      />
                      <Select.Popup width="content">
                        {DIFF_LAYOUTS.map((item) => (
                          <Select.Item key={item.value} value={item.value}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Popup>
                    </Select.Root>
                  </div>
                  <div
                    className="review-diff-scroll"
                    aria-label={`Diff for ${fileName(selectedFile.path)}`}
                  >
                    {diffLayout === 'split' ? (
                      <SplitDiff rows={splitRows} />
                    ) : (
                      <UnifiedDiff lines={diffLines} />
                    )}
                  </div>
                </>
              ) : null}
            </div>
            <div className="review-drawer-submit">
              <Stack direction="column" gap="md" className="review-drawer-submit-body">
                <Stack direction="column" gap="sm">
                  <Text variant="heading-lg">Submit on GitHub or Trac</Text>
                  <Text variant="body-md">
                    Open a pull request on GitHub, or download a patch to attach
                    to a Trac ticket. GitHub is often quicker if you already
                    have an account; Trac is the traditional Core workflow.
                  </Text>
                </Stack>
                <Tabs.Root
                  defaultValue="github"
                  render={<Stack direction="column" gap="md" />}
                >
                  <div className="patch-tabs-bar">
                    <Tabs.List variant="minimal" className="patch-tabs">
                      <Tabs.Tab value="github">GitHub</Tabs.Tab>
                      <Tabs.Tab value="trac">Trac</Tabs.Tab>
                    </Tabs.List>
                    <hr className="card-divider" />
                  </div>
                  <Tabs.Panel value="github" tabIndex={-1}>
                    <GitHubSubmitCard
                      connected={githubConnected}
                      onConnected={onGitHubConnected}
                      onCopyDeviceCode={onCopyDeviceCode}
                      onOpenPullRequest={onOpenPullRequest}
                    />
                  </Tabs.Panel>
                  <Tabs.Panel value="trac" tabIndex={-1}>
                    <TracSubmitCard onDownloadPatch={onDownloadPatch} />
                  </Tabs.Panel>
                </Tabs.Root>
              </Stack>
              {githubConnected ? (
                <GitHubConnectionStatus
                  onDisconnected={onGitHubDisconnected}
                />
              ) : null}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Popup>
    </Drawer.Root>
    <AlertDialog.Root
      open={discardOpen}
      onOpenChange={(open) => setDiscardOpen(open)}
      onConfirm={() => undefined}
    >
      <AlertDialog.Popup
        intent="irreversible"
        title="Discard all changes?"
        description="Local changes in this checkout will be removed. This can’t be undone."
        confirmButtonText="Discard all changes"
        cancelButtonText="Cancel"
      />
    </AlertDialog.Root>
    </>
  )
}
