import type { ToolSchema, ToolResult } from '../../../shared/types'
import { notion } from './notion'
import { slack } from './slack'
import { discord } from './discord'
import { zendesk } from './zendesk'
import { salesforce } from './salesforce'
import { logToolExecution } from '../audit'

export interface IntegrationAdapter {
  name: string
  isConfigured: () => boolean
  tools: ToolSchema[]
  execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult>
  healthCheck(): Promise<boolean>
}

const adapters: IntegrationAdapter[] = [notion, slack, discord, zendesk, salesforce]

// Tools that perform write/create/send operations — require confirmation before execution
const WRITE_TOOLS = new Set([
  'slack_send_message',
  'discord_send_message',
  'notion_create_page',
  'zendesk_create_ticket',
  'salesforce_create_record'
])

export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName)
}

export function getConfiguredAdapters(): IntegrationAdapter[] {
  return adapters.filter(a => a.isConfigured())
}

export function getAvailableTools(): ToolSchema[] {
  return getConfiguredAdapters().flatMap(a => a.tools)
}

export function getToolDescriptionsText(): string {
  const tools = getAvailableTools()
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

export async function executeTool(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
  for (const adapter of getConfiguredAdapters()) {
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
    content: `Tool "${toolName}" is not available. Available tools: ${getAvailableTools().map(t => t.name).join(', ')}`,
    isError: true
  }
}

export function getIntegrationStatus(): Array<{ name: string, connected: boolean, toolCount: number }> {
  return adapters.map(a => ({
    name: a.name,
    connected: a.isConfigured(),
    toolCount: a.isConfigured() ? a.tools.length : 0
  }))
}
