import type { ToolSchema, ToolResult } from '../../../shared/types'
import { notion, createNotionAdapter } from './notion'
import { slack, createSlackAdapter } from './slack'
import { discord, createDiscordAdapter } from './discord'
import { zendesk, createZendeskAdapter } from './zendesk'
import { createGmailAdapter, GMAIL_WRITE_TOOLS } from './gmail'
import { createGoogleCalendarAdapter, CALENDAR_WRITE_TOOLS } from './google-calendar'
import { createGoogleDriveAdapter, DRIVE_WRITE_TOOLS } from './google-drive'
import { createJiraAdapter, JIRA_WRITE_TOOLS } from './jira'
import { createLinearAdapter, LINEAR_WRITE_TOOLS } from './linear'
import { logToolExecution } from '../audit'

export interface IntegrationAdapter {
  name: string
  isConfigured: () => boolean
  tools: ToolSchema[]
  execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult>
  healthCheck(): Promise<boolean>
}

// Default adapters using env vars
const defaultAdapters: IntegrationAdapter[] = [notion, slack, discord, zendesk]

// Tools that perform write/create/send operations — require confirmation before execution
const WRITE_TOOLS = new Set([
  'slack_send_message',
  'discord_send_message',
  'notion_create_page',
  'zendesk_create_ticket',
  ...GMAIL_WRITE_TOOLS,
  ...CALENDAR_WRITE_TOOLS,
  ...DRIVE_WRITE_TOOLS,
  ...JIRA_WRITE_TOOLS,
  ...LINEAR_WRITE_TOOLS
])

export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName)
}

// --- Per-user adapter creation from stored credentials ---

export interface UserIntegrationRecord {
  integration: string
  credentials: Record<string, string>
}

export function createAdapterFromCredentials(record: UserIntegrationRecord): IntegrationAdapter | null {
  const c = record.credentials
  switch (record.integration) {
    case 'slack':
      if (c.bot_token) return createSlackAdapter(c.bot_token)
      break
    case 'notion':
      if (c.api_key) return createNotionAdapter(c.api_key)
      break
    case 'discord':
      if (c.bot_token) return createDiscordAdapter(c.bot_token)
      break
    case 'zendesk':
      if (c.subdomain && c.email && c.api_token) {
        return createZendeskAdapter({ subdomain: c.subdomain, email: c.email, token: c.api_token })
      }
      break
    case 'gmail':
      if (c.client_id && c.client_secret && c.refresh_token) {
        return createGmailAdapter({ client_id: c.client_id, client_secret: c.client_secret, refresh_token: c.refresh_token })
      }
      break
    case 'google_calendar':
      if (c.client_id && c.client_secret && c.refresh_token) {
        return createGoogleCalendarAdapter({ client_id: c.client_id, client_secret: c.client_secret, refresh_token: c.refresh_token })
      }
      break
    case 'google_drive':
      if (c.client_id && c.client_secret && c.refresh_token) {
        return createGoogleDriveAdapter({ client_id: c.client_id, client_secret: c.client_secret, refresh_token: c.refresh_token })
      }
      break
    case 'jira':
      if (c.subdomain && c.email && c.api_token) {
        return createJiraAdapter({ subdomain: c.subdomain, email: c.email, token: c.api_token })
      }
      break
    case 'linear':
      if (c.api_key) return createLinearAdapter(c.api_key)
      break
  }
  return null
}

export function buildUserAdapters(records: UserIntegrationRecord[]): IntegrationAdapter[] {
  const adapters: IntegrationAdapter[] = []
  for (const record of records) {
    const adapter = createAdapterFromCredentials(record)
    if (adapter) adapters.push(adapter)
  }
  return adapters
}

// --- Default (env-based) functions ---

export function getConfiguredAdapters(): IntegrationAdapter[] {
  return defaultAdapters.filter(a => a.isConfigured())
}

export function getAvailableTools(adapters?: IntegrationAdapter[]): ToolSchema[] {
  const list = adapters || getConfiguredAdapters()
  return list.flatMap(a => a.tools)
}

export function getToolDescriptionsText(adapters?: IntegrationAdapter[]): string {
  const tools = getAvailableTools(adapters)
  if (tools.length === 0) return ''

  const lines = tools.map((t) => {
    const params = t.parameters as { properties?: Record<string, { type: string, description?: string }> }
    const paramList = params.properties
      ? Object.entries(params.properties).map(([k, v]) => `${k} (${v.type}): ${v.description || ''}`).join(', ')
      : 'none'
    return `- ${t.name}: ${t.description} | params: ${paramList}`
  })

  return lines.join('\n')
}

export async function executeTool(toolName: string, args: Record<string, unknown>, adapters?: IntegrationAdapter[]): Promise<ToolResult> {
  const list = adapters || getConfiguredAdapters()
  for (const adapter of list) {
    const hasTool = adapter.tools.some(t => t.name === toolName)
    if (hasTool) {
      console.info(`[Integrations] Executing ${toolName} via ${adapter.name}`)
      const result = await adapter.execute(toolName, args)

      // Audit trail — log every tool execution
      logToolExecution(adapter.name, toolName, args, result).catch(() => {})

      return result
    }
  }

  return {
    toolCallId: toolName,
    content: `Tool "${toolName}" is not available. Available tools: ${getAvailableTools(list).map(t => t.name).join(', ')}`,
    isError: true
  }
}

export function getIntegrationStatus(): Array<{ name: string, connected: boolean, toolCount: number }> {
  return defaultAdapters.map(a => ({
    name: a.name,
    connected: a.isConfigured(),
    toolCount: a.isConfigured() ? a.tools.length : 0
  }))
}
