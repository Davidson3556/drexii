import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1'

// ── Token management ───────────────────────────────────────────────

interface GmailTokens {
  clientId: string
  clientSecret: string
  refreshToken: string
  accessToken?: string
  expiresAt?: number
}

async function getAccessToken(tokens: GmailTokens): Promise<string> {
  // Return cached token if still valid
  if (tokens.accessToken && tokens.expiresAt && Date.now() < tokens.expiresAt) {
    return tokens.accessToken
  }

  // Refresh the token
  console.info('[Gmail] Refreshing access token...')
  const response = await $fetch<{ access_token: string, expires_in: number }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: {
      client_id: tokens.clientId,
      client_secret: tokens.clientSecret,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token'
    }
  })

  tokens.accessToken = response.access_token
  tokens.expiresAt = Date.now() + (response.expires_in * 1000) - 60_000 // 1min buffer
  return response.access_token
}

function authHeader(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` }
}

// ── Gmail API functions ────────────────────────────────────────────

async function gmailSearch(tokens: GmailTokens, query: string, maxResults = 10): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)

    const listData = await $fetch<{ messages?: Array<{ id: string }> }>(`${GMAIL_API}/users/me/messages`, {
      headers: authHeader(accessToken),
      params: { q: query, maxResults }
    })

    if (!listData.messages || listData.messages.length === 0) {
      return { toolCallId: 'email_search', content: JSON.stringify({ results: [], count: 0 }) }
    }

    // Fetch details for each message
    const results = await Promise.all(
      listData.messages.slice(0, 5).map(async (msg) => {
        const detail = await $fetch<{
          id: string
          snippet: string
          payload?: { headers?: Array<{ name: string, value: string }> }
          internalDate: string
        }>(`${GMAIL_API}/users/me/messages/${msg.id}`, {
          headers: authHeader(accessToken),
          params: { format: 'metadata', metadataHeaders: ['From', 'To', 'Subject', 'Date'] }
        })

        const hdrs = detail.payload?.headers || []
        return {
          id: detail.id,
          subject: hdrs.find(h => h.name === 'Subject')?.value || '(no subject)',
          from: hdrs.find(h => h.name === 'From')?.value || '',
          to: hdrs.find(h => h.name === 'To')?.value || '',
          date: hdrs.find(h => h.name === 'Date')?.value || '',
          snippet: detail.snippet
        }
      })
    )

    return {
      toolCallId: 'email_search',
      content: JSON.stringify({ results, count: results.length })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'email_search',
      content: `Error searching Gmail: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function gmailRead(tokens: GmailTokens, messageId: string): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)

    const detail = await $fetch<{
      id: string
      snippet: string
      payload?: {
        headers?: Array<{ name: string, value: string }>
        parts?: Array<{ mimeType: string, body: { data?: string } }>
        body?: { data?: string }
      }
    }>(`${GMAIL_API}/users/me/messages/${messageId}`, {
      headers: authHeader(accessToken),
      params: { format: 'full' }
    })

    const hdrs = detail.payload?.headers || []

    // Extract body text
    let body = ''
    if (detail.payload?.parts) {
      const textPart = detail.payload.parts.find(p => p.mimeType === 'text/plain')
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64url').toString('utf-8')
      }
    } else if (detail.payload?.body?.data) {
      body = Buffer.from(detail.payload.body.data, 'base64url').toString('utf-8')
    }

    return {
      toolCallId: 'email_read',
      content: JSON.stringify({
        id: detail.id,
        subject: hdrs.find(h => h.name === 'Subject')?.value || '(no subject)',
        from: hdrs.find(h => h.name === 'From')?.value || '',
        to: hdrs.find(h => h.name === 'To')?.value || '',
        date: hdrs.find(h => h.name === 'Date')?.value || '',
        body: body.slice(0, 3000)
      })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'email_read',
      content: `Error reading email: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function gmailSend(tokens: GmailTokens, to: string, subject: string, body: string): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)

    // Build RFC 2822 email
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\r\n')

    const encoded = Buffer.from(email).toString('base64url')

    const result = await $fetch<{ id: string, threadId: string }>(`${GMAIL_API}/users/me/messages/send`, {
      method: 'POST',
      headers: { ...authHeader(accessToken), 'Content-Type': 'application/json' },
      body: { raw: encoded }
    })

    return {
      toolCallId: 'email_send',
      content: JSON.stringify({ ok: true, messageId: result.id, threadId: result.threadId })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'email_send',
      content: `Error sending email: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function gmailDraft(tokens: GmailTokens, to: string, subject: string, body: string): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)

    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\r\n')

    const encoded = Buffer.from(email).toString('base64url')

    const result = await $fetch<{ id: string }>(`${GMAIL_API}/users/me/drafts`, {
      method: 'POST',
      headers: { ...authHeader(accessToken), 'Content-Type': 'application/json' },
      body: { message: { raw: encoded } }
    })

    return {
      toolCallId: 'email_draft',
      content: JSON.stringify({ ok: true, draftId: result.id })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'email_draft',
      content: `Error creating draft: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function gmailList(tokens: GmailTokens, label = 'INBOX', maxResults = 10): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)

    const listData = await $fetch<{ messages?: Array<{ id: string }> }>(`${GMAIL_API}/users/me/messages`, {
      headers: authHeader(accessToken),
      params: { labelIds: label, maxResults }
    })

    if (!listData.messages || listData.messages.length === 0) {
      return { toolCallId: 'email_list', content: JSON.stringify({ emails: [], count: 0 }) }
    }

    const emails = await Promise.all(
      listData.messages.slice(0, 10).map(async (msg) => {
        const detail = await $fetch<{
          id: string
          snippet: string
          labelIds: string[]
          payload?: { headers?: Array<{ name: string, value: string }> }
        }>(`${GMAIL_API}/users/me/messages/${msg.id}`, {
          headers: authHeader(accessToken),
          params: { format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] }
        })

        const hdrs = detail.payload?.headers || []
        return {
          id: detail.id,
          subject: hdrs.find(h => h.name === 'Subject')?.value || '(no subject)',
          from: hdrs.find(h => h.name === 'From')?.value || '',
          date: hdrs.find(h => h.name === 'Date')?.value || '',
          snippet: detail.snippet,
          isUnread: detail.labelIds?.includes('UNREAD') || false
        }
      })
    )

    return {
      toolCallId: 'email_list',
      content: JSON.stringify({ emails, count: emails.length })
    }
  } catch (error: unknown) {
    console.error('[Gmail] email_list error:', error)
    return {
      toolCallId: 'email_list',
      content: `Error listing emails: ${(error as Error).message}`,
      isError: true
    }
  }
}

// ── Tool schemas ───────────────────────────────────────────────────

const gmailTools: ToolSchema[] = [
  {
    name: 'email_search',
    description: 'Search emails in the user\'s Gmail inbox by query (supports Gmail search operators)',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Gmail search query (e.g. "from:john subject:invoice", "is:unread newer_than:7d")' }
      },
      required: ['query']
    }
  },
  {
    name: 'email_read',
    description: 'Read the full content of a specific email by its message ID',
    parameters: {
      type: 'object',
      properties: {
        message_id: { type: 'string', description: 'Gmail message ID to read' }
      },
      required: ['message_id']
    }
  },
  {
    name: 'email_send',
    description: 'Send an email from the user\'s Gmail account',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Email body text' }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'email_draft',
    description: 'Create an email draft in the user\'s Gmail account (does not send)',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Email body text' }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'email_list',
    description: 'List recent emails from a Gmail label (default: INBOX)',
    parameters: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Gmail label to list (default: INBOX). Options: INBOX, SENT, DRAFT, SPAM, TRASH, UNREAD' }
      }
    }
  }
]

// ── Write tools that need confirmation ─────────────────────────────

export const GMAIL_WRITE_TOOLS = new Set(['email_send'])

// ── Adapter factory ────────────────────────────────────────────────

export function createGmailAdapter(credentials: { client_id: string, client_secret: string, refresh_token: string }): IntegrationAdapter {
  const tokens: GmailTokens = {
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    refreshToken: credentials.refresh_token
  }

  return {
    name: 'gmail',
    isConfigured: () => true,
    tools: gmailTools,

    async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
      switch (toolName) {
        case 'email_search':
          return gmailSearch(tokens, args.query as string)
        case 'email_read':
          return gmailRead(tokens, args.message_id as string)
        case 'email_send':
          return gmailSend(tokens, args.to as string, args.subject as string, args.body as string)
        case 'email_draft':
          return gmailDraft(tokens, args.to as string, args.subject as string, args.body as string)
        case 'email_list':
          return gmailList(tokens, (args.label as string) || 'INBOX')
        default:
          return { toolCallId: toolName, content: `Unknown Gmail tool: ${toolName}`, isError: true }
      }
    },

    async healthCheck(): Promise<boolean> {
      try {
        const accessToken = await getAccessToken(tokens)
        const profile = await $fetch<{ emailAddress: string }>(`${GMAIL_API}/users/me/profile`, {
          headers: authHeader(accessToken)
        })
        return !!profile.emailAddress
      } catch (e) {
        console.error('[Gmail] Health check failed:', (e as Error).message)
        return false
      }
    }
  }
}

// ── Helper: fetch new messages since a timestamp ───────────────────

export async function fetchNewMessages(credentials: { client_id: string, client_secret: string, refresh_token: string }, afterEpochMs: number): Promise<Array<{ id: string, subject: string, from: string, snippet: string, date: string }>> {
  const tokens: GmailTokens = {
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    refreshToken: credentials.refresh_token
  }

  const accessToken = await getAccessToken(tokens)
  const afterSeconds = Math.floor(afterEpochMs / 1000)

  const listData = await $fetch<{ messages?: Array<{ id: string }> }>(`${GMAIL_API}/users/me/messages`, {
    headers: authHeader(accessToken),
    params: { q: `after:${afterSeconds} is:unread`, maxResults: 20 }
  })

  if (!listData.messages || listData.messages.length === 0) return []

  return Promise.all(
    listData.messages.map(async (msg) => {
      const detail = await $fetch<{
        id: string
        snippet: string
        payload: { headers: Array<{ name: string, value: string }> }
      }>(`${GMAIL_API}/users/me/messages/${msg.id}`, {
        headers: authHeader(accessToken),
        params: { format: 'metadata', metadataHeaders: 'From,Subject,Date' }
      })

      const headers = detail.payload.headers
      return {
        id: detail.id,
        subject: headers.find(h => h.name === 'Subject')?.value || '(no subject)',
        from: headers.find(h => h.name === 'From')?.value || '',
        snippet: detail.snippet,
        date: headers.find(h => h.name === 'Date')?.value || ''
      }
    })
  )
}
