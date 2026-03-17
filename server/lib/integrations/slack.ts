import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

function getBotToken(): string | undefined {
  return process.env.SLACK_BOT_TOKEN || useRuntimeConfig().slackBotToken as string | undefined
}

const SLACK_API = 'https://slack.com/api'

function authHeader(): Record<string, string> {
  const token = getBotToken()
  if (!token) throw new Error('SLACK_BOT_TOKEN is not configured')
  return { Authorization: `Bearer ${token}` }
}

async function slackSendMessage(channel: string, text: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ ok: boolean, ts?: string, error?: string }>(`${SLACK_API}/chat.postMessage`, {
      method: 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
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

async function slackSearch(query: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ ok: boolean, messages?: { matches: Array<{ text: string, channel: { name: string }, username: string, ts: string }> }, error?: string }>(`${SLACK_API}/search.messages`, {
      headers: authHeader(),
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

async function slackListChannels(): Promise<ToolResult> {
  try {
    const data = await $fetch<{ ok: boolean, channels?: Array<{ id: string, name: string, purpose: { value: string } }>, error?: string }>(`${SLACK_API}/conversations.list`, {
      headers: authHeader(),
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

export const slack: IntegrationAdapter = {
  name: 'slack',
  isConfigured: () => !!getBotToken(),

  tools: [
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
  ] as ToolSchema[],

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    switch (toolName) {
      case 'slack_send_message':
        return slackSendMessage(args.channel as string, args.text as string)
      case 'slack_search':
        return slackSearch(args.query as string)
      case 'slack_list_channels':
        return slackListChannels()
      default:
        return { toolCallId: toolName, content: `Unknown Slack tool: ${toolName}`, isError: true }
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const data = await $fetch<{ ok: boolean }>(`${SLACK_API}/auth.test`, {
        headers: authHeader()
      })
      return data.ok
    } catch {
      return false
    }
  }
}
