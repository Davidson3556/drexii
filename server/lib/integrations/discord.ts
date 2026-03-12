import type { ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

function getBotToken(): string | undefined {
  return process.env.DISCORD_BOT_TOKEN || (useRuntimeConfig().discordBotToken as string)
}

const DISCORD_API = 'https://discord.com/api/v10'

function authHeaders(): Record<string, string> {
  const token = getBotToken()
  if (!token) throw new Error('DISCORD_BOT_TOKEN is not configured')
  return { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' }
}

async function discordSendMessage(channelId: string, content: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ id: string, channel_id: string }>(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: authHeaders(),
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

async function discordSearchMessages(channelId: string, query: string, limit = 25): Promise<ToolResult> {
  try {
    const messages = await $fetch<Array<{ id: string, content: string, author: { username: string }, timestamp: string }>>(`${DISCORD_API}/channels/${channelId}/messages`, {
      headers: authHeaders(),
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

async function discordListChannels(): Promise<ToolResult> {
  try {
    // First get the guilds the bot is in
    const guilds = await $fetch<Array<{ id: string, name: string }>>(`${DISCORD_API}/users/@me/guilds`, {
      headers: authHeaders()
    })

    if (guilds.length === 0) {
      return {
        toolCallId: 'discord_list_channels',
        content: JSON.stringify({ channels: [], count: 0, note: 'Bot is not in any servers' })
      }
    }

    // Get channels from the first guild
    const guildId = guilds[0]?.id
    if (!guildId) {
      return {
        toolCallId: 'discord_list_channels',
        content: JSON.stringify({ channels: [], count: 0, note: 'Bot is not in any servers' })
      }
    }

    const allChannels = await $fetch<Array<{ id: string, name: string, type: number, topic?: string | null }>>(`${DISCORD_API}/guilds/${guildId}/channels`, {
      headers: authHeaders()
    })

    // type 0 = text channels
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

export const discord: IntegrationAdapter = {
  name: 'discord',
  isConfigured: () => !!getBotToken(),

  tools: [
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
  ],

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    switch (toolName) {
      case 'discord_send_message':
        return discordSendMessage(args.channelId as string, args.content as string)
      case 'discord_search':
        return discordSearchMessages(args.channelId as string, args.query as string)
      case 'discord_list_channels':
        return discordListChannels()
      default:
        return { toolCallId: toolName, content: `Unknown Discord tool: ${toolName}`, isError: true }
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const data = await $fetch<{ id: string }>(`${DISCORD_API}/users/@me`, {
        headers: authHeaders()
      })
      return !!data.id
    } catch {
      return false
    }
  }
}
