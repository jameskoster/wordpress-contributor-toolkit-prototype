import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, InputControl, Link, Stack, Text } from '@wordpress/ui'

const LINK_DELAY = 1100
const UNLINK_DELAY = 700
const REFRESH_DELAY = 800

const LINKED_TICKET = {
  title: (
    <>
      Inconsistent <code>$operator</code> documentation for{' '}
      <code>wp_filter_object_list()</code>
    </>
  ),
  meta: 'Defect (bug) · General · 7.2 · Opened 4 weeks ago',
  pullRequests: [
    {
      id: '#13245',
      title: (
        <>
          Docs: Correct the <code>$operator</code> default for{' '}
          <code>wp_filter_object_list()</code>
        </>
      ),
      status: 'Open',
      latest: true,
      lastCommit: '24/08/2026',
    },
    {
      id: '#13012',
      title: (
        <>
          Docs: List accepted <code>$operator</code> values for{' '}
          <code>wp_filter_object_list()</code>
        </>
      ),
      status: 'Closed',
      latest: false,
      lastCommit: '11/06/2026',
    },
  ],
  attachments: [
    {
      file: '65933.diff',
      uploaded: '18/08/2026',
      size: '3.2 KB',
      latest: true,
    },
    {
      file: '65933.2.diff',
      uploaded: '02/07/2026',
      size: '2.8 KB',
      latest: false,
    },
  ],
} as const

function ticketNumber(ticket: string) {
  const match = ticket.match(/(\d+)\s*$/)
  return match?.[1] ?? ticket
}

function ticketUrl(ticket: string) {
  return `https://core.trac.wordpress.org/ticket/${ticketNumber(ticket)}`
}

function pullRequestUrl(id: string) {
  return `https://github.com/WordPress/wordpress-develop/pull/${ticketNumber(id)}`
}

function attachmentUrl(ticket: string, file: string) {
  return `https://core.trac.wordpress.org/attachment/ticket/${ticketNumber(ticket)}/${file}`
}

function attachmentName(ticket: string, file: string) {
  return file.replace('65933', ticketNumber(ticket))
}

function SectionHead({
  title,
  onRefresh,
}: {
  title: string
  onRefresh: () => void
}) {
  const [pending, setPending] = useState(false)
  const pendingTimer = useRef<number>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(pendingTimer.current)
  }, [])

  function handleRefresh() {
    if (pending) {
      return
    }

    setPending(true)
    pendingTimer.current = window.setTimeout(() => {
      onRefresh()
      setPending(false)
    }, REFRESH_DELAY)
  }

  return (
    <Stack direction="row" align="center" justify="space-between" gap="md">
      <Text variant="heading-lg">{title}</Text>
      <Button
        variant="minimal"
        tone="neutral"
        size="compact"
        loading={pending}
        loadingAnnouncement={`Refreshing ${title.toLowerCase()}`}
        onClick={handleRefresh}
      >
        Refresh
      </Button>
    </Stack>
  )
}

type TracTicketCardProps = {
  ticket: string | null
  onLinkTicket: (ticket: string) => void
  onUnlinkTicket: () => void
  onApplyPatch: (value: string) => void
  onRefreshPullRequests: () => void
  onRefreshAttachments: () => void
}

export function TracTicketCard({
  ticket,
  onLinkTicket,
  onUnlinkTicket,
  onApplyPatch,
  onRefreshPullRequests,
  onRefreshAttachments,
}: TracTicketCardProps) {
  const [ticketDraft, setTicketDraft] = useState(ticket ?? '12345')
  const [pending, setPending] = useState(false)
  const pendingTimer = useRef<number>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(pendingTimer.current)
  }, [])

  useEffect(() => {
    window.clearTimeout(pendingTimer.current)
    setPending(false)
  }, [ticket])

  function runAfterDelay(delay: number, action: () => void) {
    if (pending) {
      return
    }

    setPending(true)
    pendingTimer.current = window.setTimeout(action, delay)
  }

  if (ticket) {
    const number = ticketNumber(ticket)

    return (
      <Card.Root>
        <Card.Header>
          <Stack
            direction="row"
            align="baseline"
            justify="space-between"
            gap="md"
            wrap="wrap"
          >
            <Card.Title>Trac ticket</Card.Title>
            <Button
              variant="minimal"
              tone="neutral"
              size="compact"
              loading={pending}
              loadingAnnouncement="Unlinking ticket"
              onClick={() => runAfterDelay(UNLINK_DELAY, onUnlinkTicket)}
            >
              Unlink
            </Button>
          </Stack>
        </Card.Header>
        <Card.Content render={<Stack direction="column" gap="xl" />}>
          <Stack direction="column" gap="sm">
            <Text variant="heading-md">
              <Link href={ticketUrl(number)} openInNewTab>
                #{number} {LINKED_TICKET.title}
              </Link>
            </Text>
            <Stack direction="row" align="center" gap="sm" wrap="wrap">
              <Badge intent="informational">Reviewing</Badge>
              <Text variant="body-md" className="muted-label">
                {LINKED_TICKET.meta}
              </Text>
            </Stack>
          </Stack>

          <hr className="card-divider" />

          <Stack direction="column" gap="sm">
            <SectionHead
              title="Linked pull requests"
              onRefresh={onRefreshPullRequests}
            />
            <Text variant="body-md" className="muted-label">
              See the work that already exists on this ticket before adding
              your own.
            </Text>
            <ul className="ticket-pr-list">
              {LINKED_TICKET.pullRequests.map((pullRequest) => (
                <li key={pullRequest.id} className="ticket-pr">
                  <Stack direction="column" gap="sm">
                    <Stack
                      direction="row"
                      align="center"
                      gap="sm"
                      wrap="wrap"
                    >
                      <Text variant="body-md" className="ticket-pr-id">
                        {pullRequest.id}
                      </Text>
                      <Badge
                        intent={
                          pullRequest.status === 'Open' ? 'stable' : 'none'
                        }
                      >
                        {pullRequest.status}
                      </Badge>
                      {pullRequest.latest ? (
                        <Badge intent="informational">Latest</Badge>
                      ) : null}
                    </Stack>
                    <Text
                      variant="body-md"
                      render={
                        <Link
                          href={pullRequestUrl(pullRequest.id)}
                          openInNewTab
                        />
                      }
                    >
                      {pullRequest.title}
                    </Text>
                    <Text variant="body-md" className="muted-label">
                      Last commit {pullRequest.lastCommit}
                    </Text>
                    <Stack direction="row">
                      <Button
                        variant="outline"
                        size="compact"
                        onClick={() => onApplyPatch(pullRequest.id)}
                      >
                        Apply
                      </Button>
                    </Stack>
                  </Stack>
                </li>
              ))}
            </ul>
          </Stack>

          <hr className="card-divider" />

          <Stack direction="column" gap="sm">
            <SectionHead
              title="Trac attachments"
              onRefresh={onRefreshAttachments}
            />
            <Text variant="body-md" className="muted-label">
              Patch files are sometimes attached on Trac instead of a PR.
              Reading them opens the ticket so you can pass its human-check
              once.
            </Text>
            <ul className="ticket-pr-list">
              {LINKED_TICKET.attachments.map((attachment) => {
                const file = attachmentName(number, attachment.file)

                return (
                  <li key={attachment.file} className="ticket-pr">
                    <Stack direction="column" gap="sm">
                      <Stack
                        direction="row"
                        align="center"
                        gap="sm"
                        wrap="wrap"
                      >
                        <Text
                          variant="body-md"
                          className="ticket-pr-id"
                          render={
                            <Link
                              href={attachmentUrl(number, file)}
                              openInNewTab
                            />
                          }
                        >
                          {file}
                        </Text>
                        {attachment.latest ? (
                          <Badge intent="informational">Latest</Badge>
                        ) : null}
                      </Stack>
                      <Text variant="body-md" className="muted-label">
                        Uploaded {attachment.uploaded} · {attachment.size}
                      </Text>
                      <Stack direction="row">
                        <Button
                          variant="outline"
                          size="compact"
                          onClick={() => onApplyPatch(file)}
                        >
                          Apply
                        </Button>
                      </Stack>
                    </Stack>
                  </li>
                )
              })}
            </ul>
          </Stack>
        </Card.Content>
      </Card.Root>
    )
  }

  return (
    <Card.Root>
      <Card.Header render={<Stack direction="column" gap="xs" />}>
        <Card.Title>Trac ticket</Card.Title>
        <Text variant="body-md" className="muted-label">
          Link the ticket you’re working on.
        </Text>
      </Card.Header>
      <Card.Content>
        <div className="inline-field">
          <InputControl
            label="Ticket number or URL"
            value={ticketDraft}
            disabled={pending}
            onChange={(event) => setTicketDraft(event.currentTarget.value)}
          />
          <Button
            variant="outline"
            loading={pending}
            loadingAnnouncement="Linking ticket"
            onClick={() => {
              const next = ticketDraft.trim()
              if (!next) {
                return
              }

              runAfterDelay(LINK_DELAY, () => onLinkTicket(next))
            }}
            disabled={pending || !ticketDraft.trim()}
          >
            Link ticket
          </Button>
        </div>
      </Card.Content>
      <footer className="card-footer">
        <hr className="card-divider" />
        <div className="card-footer-content">
          <Text variant="body-md">
            Not sure yet?{' '}
            <Link
              href="https://core.trac.wordpress.org/query?status=!closed&keywords=~good-first-bug"
              openInNewTab
            >
              Browse good first bugs on Trac
            </Link>
          </Text>
        </div>
      </footer>
    </Card.Root>
  )
}
