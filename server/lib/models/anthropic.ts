import Anthropic from '@anthropic-ai/sdk'
import type { MessagePayload } from '../../../shared/types'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY || useRuntimeConfig().anthropicApiKey
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export interface AnthropicStreamOptions {
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  tools?: Anthropic.Tool[]
}

export async function* streamChat(
  messages: MessagePayload[],
  options: AnthropicStreamOptions = {}
): AsyncGenerator<string> {
  const client = getClient()

  const {
    maxTokens = 1024,
    temperature = 0.3,
    systemPrompt = getDefaultSystemPrompt()
  } = options

  const anthropicMessages = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  }))

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: anthropicMessages
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      const delta = event.delta as { type: string, text?: string }
      if (delta.type === 'text_delta' && delta.text) {
        yield delta.text
      }
    }
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const client = getClient()
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }]
    })
    return response.id !== undefined
  } catch {
    return false
  }
}

function getDefaultSystemPrompt(): string {
  return `You are Drexii, an AI agent that turns conversation into execution.

Your core behaviors:
- Give clear, actionable answers
- Always cite your sources when referencing documents or data
- When you identify an action that should be taken, propose it explicitly as a pending action
- Keep responses concise but thorough
- Use a professional, friendly tone
- When drafting documents, match the user's style preferences

You are powered by advanced AI and can help with:
- Drafting documents, emails, and reports
- Searching connected tools (Notion, Slack, Zendesk, etc.)
- Triggering actions in connected tools
- Answering questions with source attribution`
}
