import type { ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

const DISCORD_API = 'https://discord.com/api/v10'

function createAuthHeaders(token: string): Record<string, string> {
  return { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' }
}

async function discordSendMessage(token: string, channelId: string, content: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ id: string, channel_id: string }>(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: { content }
    })

    return {
      toolCallId: 'discord_send_message',
      content: JSON.stringify({ ok: true, messageId: data.id, channelId: data.channel_id })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'discord_send_message',
      content: `Error sending Discord message: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function discordSearchMessages(token: string, channelId: string, query: string, limit = 25): Promise<ToolResult> {
  try {
    const messages = await $fetch<Array<{ id: string, content: string, author: { username: string }, timestamp: string }>>(`${DISCORD_API}/channels/${channelId}/messages`, {
      headers: createAuthHeaders(token),
      params: { limit: Math.min(limit, 100) }
    })

    const filtered = messages
      .filter(m => m.content.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)
      .map(m => ({
        id: m.id,
        content: m.content.slice(0, 200),
        author: m.author.username,
        timestamp: m.timestamp
      }))

    return {
      toolCallId: 'discord_search',
      content: JSON.stringify({ results: filtered, count: filtered.length })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'discord_search',
      content: `Error searching Discord messages: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function discordListChannels(token: string): Promise<ToolResult> {
  try {
    const guilds = await $fetch<Array<{ id: string, name: string }>>(`${DISCORD_API}/users/@me/guilds`, {
      headers: createAuthHeaders(token)
    })

    if (guilds.length === 0) {
      return {
        toolCallId: 'discord_list_channels',
        content: JSON.stringify({ channels: [], count: 0, note: 'Bot is not in any servers' })
      }
    }

    const guildId = guilds[0]?.id
    if (!guildId) {
      return {
        toolCallId: 'discord_list_channels',
        content: JSON.stringify({ channels: [], count: 0, note: 'Bot is not in any servers' })
      }
    }

    const allChannels = await $fetch<Array<{ id: string, name: string, type: number, topic?: string | null }>>(`${DISCORD_API}/guilds/${guildId}/channels`, {
      headers: createAuthHeaders(token)
    })

    const textChannels = allChannels
      .filter(c => c.type === 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        topic: (c.topic || '').slice(0, 100)
      }))

    return {
      toolCallId: 'discord_list_channels',
      content: JSON.stringify({ guild: guilds[0]?.name, channels: textChannels, count: textChannels.length })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'discord_list_channels',
      content: `Error listing Discord channels: ${(error as Error).message}`,
      isError: true
    }
  }
}

const discordTools = [
  {
    name: 'discord_send_message',
    description: 'Send a message to a Discord channel',
    parameters: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Discord channel ID to send the message to' },
        content: { type: 'string', description: 'Message content to send' }
      },
      required: ['channelId', 'content']
    }
  },
  {
    name: 'discord_search',
    description: 'Search recent messages in a Discord channel by keyword',
    parameters: {
      type: 'object',
      properties: {
        channelId: { type: 'string', description: 'Discord channel ID to search in' },
        query: { type: 'string', description: 'Keyword to search for in messages' }
      },
      required: ['channelId', 'query']
    }
  },
  {
    name: 'discord_list_channels',
    description: 'List all text channels in the Discord server the bot is connected to',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
]

export function createDiscordAdapter(botToken: string): IntegrationAdapter {
  return {
    name: 'discord',
    isConfigured: () => true,
    tools: discordTools,

    async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
      switch (toolName) {
        case 'discord_send_message':
          return discordSendMessage(botToken, args.channelId as string, args.content as string)
        case 'discord_search':
          return discordSearchMessages(botToken, args.channelId as string, args.query as string)
        case 'discord_list_channels':
          return discordListChannels(botToken)
        default:
          return { toolCallId: toolName, content: `Unknown Discord tool: ${toolName}`, isError: true }
      }
    },

    async healthCheck(): Promise<boolean> {
      try {
        const data = await $fetch<{ id: string }>(`${DISCORD_API}/users/@me`, {
          headers: createAuthHeaders(botToken)
        })
        return !!data.id
      } catch (e) {
        console.error('[Discord] Health check failed:', (e as Error).message)
        return false
      }
    }
  }
}

// Default adapter using env vars (backward compatible)
function getEnvToken(): string | undefined {
  return process.env.DISCORD_BOT_TOKEN || (useRuntimeConfig().discordBotToken as string)
}

export const discord: IntegrationAdapter = {
  name: 'discord',
  isConfigured: () => !!getEnvToken(),
  tools: discordTools,

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    const token = getEnvToken()
    if (!token) return { toolCallId: toolName, content: 'DISCORD_BOT_TOKEN is not configured', isError: true }
    return createDiscordAdapter(token).execute(toolName, args)
  },

  async healthCheck(): Promise<boolean> {
    const token = getEnvToken()
    if (!token) return false
    return createDiscordAdapter(token).healthCheck()
  }
}
