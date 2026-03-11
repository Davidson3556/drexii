import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

function getConfig(): { subdomain: string, email: string, token: string } | undefined {
  const subdomain = process.env.ZENDESK_SUBDOMAIN || useRuntimeConfig().zendeskSubdomain
  const email = process.env.ZENDESK_EMAIL || useRuntimeConfig().zendeskEmail
  const token = process.env.ZENDESK_API_TOKEN || useRuntimeConfig().zendeskApiToken
  if (!subdomain || !email || !token) return undefined
  return { subdomain, email, token }
}

function apiUrl(path: string): string {
  const config = getConfig()
  if (!config) throw new Error('Zendesk is not configured')
  return `https://${config.subdomain}.zendesk.com/api/v2${path}`
}

function authHeader(): Record<string, string> {
  const config = getConfig()
  if (!config) throw new Error('Zendesk is not configured')
  const credentials = btoa(`${config.email}/token:${config.token}`)
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  }
}

async function zendeskSearchTickets(query: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ results: Array<{ id: number, subject: string, status: string, priority: string, created_at: string, description: string }> }>(apiUrl('/search.json'), {
      headers: authHeader(),
      params: { query: `type:ticket ${query}` }
    })

    const results = data.results.map(t => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      created: t.created_at,
      description: t.description?.slice(0, 200)
    }))

    return {
      toolCallId: 'zendesk_search_tickets',
      content: JSON.stringify({ results, count: results.length })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'zendesk_search_tickets',
      content: `Error searching Zendesk: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function zendeskGetTicket(ticketId: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ ticket: { id: number, subject: string, status: string, priority: string, description: string, created_at: string, updated_at: string, tags: string[] } }>(apiUrl(`/tickets/${ticketId}.json`), {
      headers: authHeader()
    })

    const t = data.ticket
    return {
      toolCallId: 'zendesk_get_ticket',
      content: JSON.stringify({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        description: t.description?.slice(0, 2000),
        created: t.created_at,
        updated: t.updated_at,
        tags: t.tags
      })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'zendesk_get_ticket',
      content: `Error fetching Zendesk ticket: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function zendeskCreateTicket(subject: string, body: string, priority?: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ ticket: { id: number, subject: string, status: string } }>(apiUrl('/tickets.json'), {
      method: 'POST',
      headers: authHeader(),
      body: {
        ticket: {
          subject,
          comment: { body },
          priority: priority || 'normal'
        }
      }
    })

    return {
      toolCallId: 'zendesk_create_ticket',
      content: JSON.stringify({
        id: data.ticket.id,
        subject: data.ticket.subject,
        status: data.ticket.status
      })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'zendesk_create_ticket',
      content: `Error creating Zendesk ticket: ${(error as Error).message}`,
      isError: true
    }
  }
}

export const zendesk: IntegrationAdapter = {
  name: 'zendesk',
  isConfigured: () => !!getConfig(),

  tools: [
    {
      name: 'zendesk_search_tickets',
      description: 'Search Zendesk support tickets by query',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query for tickets' }
        },
        required: ['query']
      }
    },
    {
      name: 'zendesk_get_ticket',
      description: 'Get details of a specific Zendesk ticket by ID',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: { type: 'string', description: 'The Zendesk ticket ID' }
        },
        required: ['ticket_id']
      }
    },
    {
      name: 'zendesk_create_ticket',
      description: 'Create a new Zendesk support ticket',
      parameters: {
        type: 'object',
        properties: {
          subject: { type: 'string', description: 'Ticket subject line' },
          body: { type: 'string', description: 'Ticket description body' },
          priority: { type: 'string', description: 'Priority: low, normal, high, urgent', enum: ['low', 'normal', 'high', 'urgent'] }
        },
        required: ['subject', 'body']
      }
    }
  ] as ToolSchema[],

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    switch (toolName) {
      case 'zendesk_search_tickets':
        return zendeskSearchTickets(args.query as string)
      case 'zendesk_get_ticket':
        return zendeskGetTicket(args.ticket_id as string)
      case 'zendesk_create_ticket':
        return zendeskCreateTicket(args.subject as string, args.body as string, args.priority as string | undefined)
      default:
        return { toolCallId: toolName, content: `Unknown Zendesk tool: ${toolName}`, isError: true }
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      await $fetch(apiUrl('/users/me.json'), { headers: authHeader() })
      return true
    } catch {
      return false
    }
  }
}
