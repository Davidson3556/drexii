import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

const SLACK_API = 'https://slack.com/api'

function createAuthHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

async function slackSendMessage(token: string, channel: string, text: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ ok: boolean, ts?: string, error?: string }>(`${SLACK_API}/chat.postMessage`, {
      method: 'POST',
      headers: { ...createAuthHeader(token), 'Content-Type': 'application/json' },
      body: { channel, text }
    })

    if (!data.ok) {
      return { toolCallId: 'slack_send_message', content: `Slack error: ${data.error}`, isError: true }
    }

    return {
      toolCallId: 'slack_send_message',
      content: JSON.stringify({ ok: true, channel, timestamp: data.ts })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'slack_send_message',
      content: `Error sending Slack message: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function slackSearch(token: string, query: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ ok: boolean, messages?: { matches: Array<{ text: string, channel: { name: string }, username: string, ts: string }> }, error?: string }>(`${SLACK_API}/search.messages`, {
      headers: createAuthHeader(token),
      params: { query, count: 10 }
    })

    if (!data.ok) {
      return { toolCallId: 'slack_search', content: `Slack error: ${data.error}`, isError: true }
    }

    const results = (data.messages?.matches || []).map(m => ({
      text: m.text.slice(0, 200),
      channel: m.channel.name,
      user: m.username,
      timestamp: m.ts
    }))

    return {
      toolCallId: 'slack_search',
      content: JSON.stringify({ results, count: results.length })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'slack_search',
      content: `Error searching Slack: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function slackListChannels(token: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ ok: boolean, channels?: Array<{ id: string, name: string, purpose: { value: string } }>, error?: string }>(`${SLACK_API}/conversations.list`, {
      headers: createAuthHeader(token),
      params: { types: 'public_channel', limit: 50 }
    })

    if (!data.ok) {
      return { toolCallId: 'slack_list_channels', content: `Slack error: ${data.error}`, isError: true }
    }

    const channels = (data.channels || []).map(c => ({
      id: c.id,
      name: c.name,
      purpose: c.purpose.value.slice(0, 100)
    }))

    return {
      toolCallId: 'slack_list_channels',
      content: JSON.stringify({ channels, count: channels.length })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'slack_list_channels',
      content: `Error listing Slack channels: ${(error as Error).message}`,
      isError: true
    }
  }
}

const slackTools: ToolSchema[] = [
  {
    name: 'slack_send_message',
    description: 'Send a message to a Slack channel',
    parameters: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Channel name or ID to post to (e.g. #general or C01234ABC)' },
        text: { type: 'string', description: 'Message text to send' }
      },
      required: ['channel', 'text']
    }
  },
  {
    name: 'slack_search',
    description: 'Search messages across the Slack workspace',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query text' }
      },
      required: ['query']
    }
  },
  {
    name: 'slack_list_channels',
    description: 'List available Slack channels in the workspace',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
]

export function createSlackAdapter(botToken: string): IntegrationAdapter {
  return {
    name: 'slack',
    isConfigured: () => true,
    tools: slackTools,

    async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
      switch (toolName) {
        case 'slack_send_message':
          return slackSendMessage(botToken, args.channel as string, args.text as string)
        case 'slack_search':
          return slackSearch(botToken, args.query as string)
        case 'slack_list_channels':
          return slackListChannels(botToken)
        default:
          return { toolCallId: toolName, content: `Unknown Slack tool: ${toolName}`, isError: true }
      }
    },

    async healthCheck(): Promise<boolean> {
      try {
        const data = await $fetch<{ ok: boolean }>(`${SLACK_API}/auth.test`, {
          headers: createAuthHeader(botToken)
        })
        return data.ok
      } catch (e) {
        console.error('[Slack] Health check failed:', (e as Error).message)
        return false
      }
    }
  }
}

// Default adapter using env vars (backward compatible)
function getEnvToken(): string | undefined {
  return process.env.SLACK_BOT_TOKEN || useRuntimeConfig().slackBotToken as string | undefined
}

export const slack: IntegrationAdapter = {
  name: 'slack',
  isConfigured: () => !!getEnvToken(),
  tools: slackTools,

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    const token = getEnvToken()
    if (!token) return { toolCallId: toolName, content: 'SLACK_BOT_TOKEN is not configured', isError: true }
    return createSlackAdapter(token).execute(toolName, args)
  },

  async healthCheck(): Promise<boolean> {
    const token = getEnvToken()
    if (!token) return false
    return createSlackAdapter(token).healthCheck()
  }
}
