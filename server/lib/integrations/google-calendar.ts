import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

interface GoogleTokens {
  clientId: string
  clientSecret: string
  refreshToken: string
  accessToken?: string
  expiresAt?: number
}

async function getAccessToken(tokens: GoogleTokens): Promise<string> {
  if (tokens.accessToken && tokens.expiresAt && Date.now() < tokens.expiresAt) {
    return tokens.accessToken
  }
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
  tokens.expiresAt = Date.now() + (response.expires_in * 1000) - 60_000
  return response.access_token
}

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` }
}

// ── Calendar tools ─────────────────────────────────────────────────

async function listEvents(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const now = new Date()
    const timeMin = (args.start_date as string) || now.toISOString()
    const timeMax = (args.end_date as string) || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const maxResults = Math.min(Number(args.max_results) || 10, 25)

    const data = await $fetch<{ items?: Array<Record<string, unknown>> }>(
      `${CALENDAR_API}/calendars/primary/events`,
      {
        headers: authHeader(accessToken),
        query: { timeMin, timeMax, maxResults, singleEvents: true, orderBy: 'startTime' }
      }
    )

    if (!data.items || data.items.length === 0) {
      return { toolCallId: 'calendar_list_events', content: 'No events found in that date range.' }
    }

    const formatted = data.items.map((e) => {
      const start = (e.start as Record<string, string>)?.dateTime || (e.start as Record<string, string>)?.date || 'Unknown'
      const end = (e.end as Record<string, string>)?.dateTime || (e.end as Record<string, string>)?.date || ''
      return `- ${e.summary || 'Untitled'} | ${start}${end ? ' → ' + end : ''} | ID: ${e.id}`
    }).join('\n')

    return { toolCallId: 'calendar_list_events', content: `Events:\n${formatted}` }
  } catch (error) {
    return { toolCallId: 'calendar_list_events', content: `Failed to list events: ${(error as Error).message}`, isError: true }
  }
}

async function getEvent(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const eventId = args.event_id as string
    if (!eventId) return { toolCallId: 'calendar_get_event', content: 'event_id is required', isError: true }

    const event = await $fetch<Record<string, unknown>>(
      `${CALENDAR_API}/calendars/primary/events/${eventId}`,
      { headers: authHeader(accessToken) }
    )

    const start = (event.start as Record<string, string>)?.dateTime || (event.start as Record<string, string>)?.date
    const end = (event.end as Record<string, string>)?.dateTime || (event.end as Record<string, string>)?.date
    const attendees = (event.attendees as Array<{ email: string }> | undefined)?.map(a => a.email).join(', ') || 'None'

    return {
      toolCallId: 'calendar_get_event',
      content: `Event: ${event.summary}\nStart: ${start}\nEnd: ${end}\nLocation: ${event.location || 'N/A'}\nAttendees: ${attendees}\nDescription: ${event.description || 'None'}`
    }
  } catch (error) {
    return { toolCallId: 'calendar_get_event', content: `Failed to get event: ${(error as Error).message}`, isError: true }
  }
}

async function createEvent(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const { summary, start_datetime, end_datetime, description, location, attendee_emails } = args as Record<string, string>

    if (!summary || !start_datetime || !end_datetime) {
      return { toolCallId: 'calendar_create_event', content: 'summary, start_datetime, and end_datetime are required', isError: true }
    }

    const body: Record<string, unknown> = {
      summary,
      start: { dateTime: start_datetime, timeZone: 'UTC' },
      end: { dateTime: end_datetime, timeZone: 'UTC' }
    }
    if (description) body.description = description
    if (location) body.location = location
    if (attendee_emails) {
      body.attendees = attendee_emails.split(',').map((e: string) => ({ email: e.trim() }))
    }

    const event = await $fetch<{ id: string, htmlLink: string }>(
      `${CALENDAR_API}/calendars/primary/events`,
      { method: 'POST', headers: authHeader(accessToken), body }
    )

    return {
      toolCallId: 'calendar_create_event',
      content: `Event created: "${summary}" — ${event.htmlLink}`
    }
  } catch (error) {
    return { toolCallId: 'calendar_create_event', content: `Failed to create event: ${(error as Error).message}`, isError: true }
  }
}

async function updateEvent(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const { event_id, summary, start_datetime, end_datetime, description, location } = args as Record<string, string>
    if (!event_id) return { toolCallId: 'calendar_update_event', content: 'event_id is required', isError: true }

    const existing = await $fetch<Record<string, unknown>>(
      `${CALENDAR_API}/calendars/primary/events/${event_id}`,
      { headers: authHeader(accessToken) }
    )

    const updates: Record<string, unknown> = { ...existing }
    if (summary) updates.summary = summary
    if (start_datetime) updates.start = { dateTime: start_datetime, timeZone: 'UTC' }
    if (end_datetime) updates.end = { dateTime: end_datetime, timeZone: 'UTC' }
    if (description) updates.description = description
    if (location) updates.location = location

    await $fetch(`${CALENDAR_API}/calendars/primary/events/${event_id}`, {
      method: 'PUT',
      headers: authHeader(accessToken),
      body: updates
    })

    return { toolCallId: 'calendar_update_event', content: `Event "${event_id}" updated successfully.` }
  } catch (error) {
    return { toolCallId: 'calendar_update_event', content: `Failed to update event: ${(error as Error).message}`, isError: true }
  }
}

async function deleteEvent(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const eventId = args.event_id as string
    if (!eventId) return { toolCallId: 'calendar_delete_event', content: 'event_id is required', isError: true }

    await $fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: authHeader(accessToken)
    })

    return { toolCallId: 'calendar_delete_event', content: `Event deleted successfully.` }
  } catch (error) {
    return { toolCallId: 'calendar_delete_event', content: `Failed to delete event: ${(error as Error).message}`, isError: true }
  }
}

async function findFreeSlots(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const now = new Date()
    const timeMin = (args.start_date as string) || now.toISOString()
    const timeMax = (args.end_date as string) || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const durationMinutes = Number(args.duration_minutes) || 60

    const data = await $fetch<{ calendars?: Record<string, { busy: Array<{ start: string, end: string }> }> }>(
      `${CALENDAR_API}/freeBusy`,
      {
        method: 'POST',
        headers: authHeader(accessToken),
        body: {
          timeMin,
          timeMax,
          items: [{ id: 'primary' }]
        }
      }
    )

    const busy = data.calendars?.primary?.busy || []
    if (busy.length === 0) {
      return { toolCallId: 'calendar_find_free_slots', content: `You are free from ${timeMin} to ${timeMax}. No conflicts found.` }
    }

    const lines = busy.map(b => `- Busy: ${b.start} → ${b.end}`).join('\n')
    return {
      toolCallId: 'calendar_find_free_slots',
      content: `Looking for ${durationMinutes}-minute slots between ${timeMin} and ${timeMax}.\nBusy periods:\n${lines}`
    }
  } catch (error) {
    return { toolCallId: 'calendar_find_free_slots', content: `Failed to check availability: ${(error as Error).message}`, isError: true }
  }
}

// ── Tool schemas ───────────────────────────────────────────────────

const tools: ToolSchema[] = [
  {
    name: 'calendar_list_events',
    description: 'List events from Google Calendar in a date range',
    parameters: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'ISO 8601 start datetime (default: now)' },
        end_date: { type: 'string', description: 'ISO 8601 end datetime (default: 7 days from now)' },
        max_results: { type: 'number', description: 'Max events to return (default 10, max 25)' }
      }
    }
  },
  {
    name: 'calendar_get_event',
    description: 'Get full details of a specific calendar event',
    parameters: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'The event ID from calendar_list_events' }
      },
      required: ['event_id']
    }
  },
  {
    name: 'calendar_create_event',
    description: 'Create a new calendar event',
    parameters: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Event title' },
        start_datetime: { type: 'string', description: 'ISO 8601 start datetime e.g. 2026-03-28T14:00:00Z' },
        end_datetime: { type: 'string', description: 'ISO 8601 end datetime' },
        description: { type: 'string', description: 'Event description (optional)' },
        location: { type: 'string', description: 'Event location (optional)' },
        attendee_emails: { type: 'string', description: 'Comma-separated attendee email addresses (optional)' }
      },
      required: ['summary', 'start_datetime', 'end_datetime']
    }
  },
  {
    name: 'calendar_update_event',
    description: 'Update an existing calendar event (reschedule, rename, etc.)',
    parameters: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'The event ID to update' },
        summary: { type: 'string', description: 'New title (optional)' },
        start_datetime: { type: 'string', description: 'New start datetime (optional)' },
        end_datetime: { type: 'string', description: 'New end datetime (optional)' },
        description: { type: 'string', description: 'New description (optional)' },
        location: { type: 'string', description: 'New location (optional)' }
      },
      required: ['event_id']
    }
  },
  {
    name: 'calendar_delete_event',
    description: 'Delete a calendar event',
    parameters: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'The event ID to delete' }
      },
      required: ['event_id']
    }
  },
  {
    name: 'calendar_find_free_slots',
    description: 'Find free time slots in a calendar for scheduling',
    parameters: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'ISO 8601 start of search window (default: now)' },
        end_date: { type: 'string', description: 'ISO 8601 end of search window (default: 7 days from now)' },
        duration_minutes: { type: 'number', description: 'Required duration in minutes (default: 60)' }
      }
    }
  }
]

export const CALENDAR_WRITE_TOOLS = new Set([
  'calendar_create_event',
  'calendar_update_event',
  'calendar_delete_event'
])

// ── Adapter factory ────────────────────────────────────────────────

export function createGoogleCalendarAdapter(creds: {
  client_id: string
  client_secret: string
  refresh_token: string
}): IntegrationAdapter {
  const tokens: GoogleTokens = {
    clientId: creds.client_id,
    clientSecret: creds.client_secret,
    refreshToken: creds.refresh_token
  }

  return {
    name: 'google_calendar',
    isConfigured: () => !!(creds.client_id && creds.client_secret && creds.refresh_token),
    tools,
    async execute(toolName, args) {
      switch (toolName) {
        case 'calendar_list_events': return listEvents(tokens, args)
        case 'calendar_get_event': return getEvent(tokens, args)
        case 'calendar_create_event': return createEvent(tokens, args)
        case 'calendar_update_event': return updateEvent(tokens, args)
        case 'calendar_delete_event': return deleteEvent(tokens, args)
        case 'calendar_find_free_slots': return findFreeSlots(tokens, args)
        default: return { toolCallId: toolName, content: `Unknown tool: ${toolName}`, isError: true }
      }
    },
    async healthCheck() {
      try {
        const accessToken = await getAccessToken(tokens)
        await $fetch(`${CALENDAR_API}/calendars/primary`, { headers: authHeader(accessToken) })
        return true
      } catch { return false }
    }
  }
}
