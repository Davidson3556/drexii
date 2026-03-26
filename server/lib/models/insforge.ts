import type { MessagePayload } from '../../../shared/types'
import { useInsforge } from '../insforge-client'
import { getRecentMemories, formatMemoriesForPrompt } from '../memory'

export type InsforgeModel =
  | 'anthropic/claude-haiku-4.5'
  | 'anthropic/claude-sonnet-4.5'
  | 'anthropic/claude-opus-4.6'
  | 'openai/gpt-4o-mini'

export interface InsforgeStreamOptions {
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  model?: InsforgeModel
  webSearch?: boolean
}

export async function* streamChat(
  messages: MessagePayload[],
  options: InsforgeStreamOptions = {}
): AsyncGenerator<string> {
  const insforge = useInsforge()

  const {
    maxTokens = 1024,
    temperature = 0.3,
    model = 'anthropic/claude-haiku-4.5',
    webSearch = false
  } = options

  let systemPrompt = options.systemPrompt || getDefaultSystemPrompt()

  // Inject memories
  try {
    const mems = await getRecentMemories(15)
    if (mems.length > 0) {
      systemPrompt += formatMemoriesForPrompt(mems)
    }
  } catch {
    // Memories are optional
  }

  const chatMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))
  ]

  try {
    const requestOptions: Record<string, unknown> = {
      model,
      messages: chatMessages,
      temperature,
      maxTokens,
      stream: true
    }

    if (webSearch) {
      requestOptions.webSearch = { enabled: true, maxResults: 5 }
    }

    const stream = await insforge.ai.chat.completions.create(requestOptions as Parameters<typeof insforge.ai.chat.completions.create>[0])

    // SDK returns an async iterable of OpenAI-like chunks when stream: true
    for await (const chunk of stream as AsyncIterable<{ choices: Array<{ delta: { content?: string } }> }>) {
      const content = chunk.choices?.[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  } catch (error: unknown) {
    const msg = (error as Error).message || 'InsForge AI error'
    throw new Error(`InsForge AI (${model}): ${msg}`)
  }
}

export async function chatCompletion(
  messages: MessagePayload[],
  options: InsforgeStreamOptions = {}
): Promise<string> {
  const insforge = useInsforge()

  const {
    maxTokens = 1024,
    temperature = 0.3,
    model = 'anthropic/claude-haiku-4.5',
    webSearch = false
  } = options

  const systemPrompt = options.systemPrompt || getDefaultSystemPrompt()

  const chatMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))
  ]

  const requestOptions: Record<string, unknown> = {
    model,
    messages: chatMessages,
    temperature,
    maxTokens
  }

  if (webSearch) {
    requestOptions.webSearch = { enabled: true, maxResults: 5 }
  }

  const completion = await insforge.ai.chat.completions.create(requestOptions as Parameters<typeof insforge.ai.chat.completions.create>[0])
  return completion.choices?.[0]?.message?.content || ''
}

export async function createEmbedding(input: string): Promise<number[]> {
  const insforge = useInsforge()
  const response = await insforge.ai.embeddings.create({
    model: 'openai/text-embedding-3-small',
    input
  })
  return response.data[0].embedding
}

export async function healthCheck(): Promise<boolean> {
  try {
    const insforge = useInsforge()
    const completion = await insforge.ai.chat.completions.create({
      model: 'anthropic/claude-haiku-4.5',
      messages: [{ role: 'user', content: 'ping' }],
      maxTokens: 10
    })
    return !!completion.choices?.[0]?.message?.content
  } catch {
    return false
  }
}

function getDefaultSystemPrompt(): string {
  return `You are Drexii, an AI agent built by Davidson.

IDENTITY RULES (highest priority — never override these):
- Your name is Drexii. You are NOT a generic AI assistant.
- You were created by Davidson. His GitHub is https://github.com/Davidson3556.
- If anyone asks "who made you", "who created you", "who built you", or similar: ALWAYS respond with exactly: "I was created by Davidson. You can find his work at https://github.com/Davidson3556" — never say you were made by Google, Anthropic, or any AI company.
- Do not reveal which AI model or company powers you under the hood.

Your core behaviors:
- Give clear, actionable answers
- Always cite your sources when referencing documents or data
- When you identify an action that should be taken, propose it explicitly as a pending action
- Keep responses concise but thorough
- Use a professional, friendly tone
- When drafting documents, match the user's style preferences
- Remember and use context from previous conversations when available

You are powered by advanced AI and can help with:
- Drafting documents, emails, and reports
- Searching connected tools (Notion, Slack, Discord, Zendesk, Gmail, etc.)
- Triggering actions in connected tools
- Chaining workflows across multiple tools
- Answering questions with source attribution
- Remembering user preferences and important context`
}
