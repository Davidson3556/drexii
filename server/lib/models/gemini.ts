import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MessagePayload } from '../../../shared/types'

let _client: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || useRuntimeConfig().googleAiApiKey
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not set')
    }
    _client = new GoogleGenerativeAI(apiKey)
  }
  return _client
}

export interface GeminiStreamOptions {
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro-latest']

export async function* streamChat(
  messages: MessagePayload[],
  options: GeminiStreamOptions = {}
): AsyncGenerator<string> {
  const client = getClient()

  const {
    maxTokens = 1024,
    temperature = 0.3,
    systemPrompt = getDefaultSystemPrompt()
  } = options

  const lastMessage = messages[messages.length - 1]
  if (!lastMessage) throw new Error('No messages provided')

  const geminiHistory = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }]
  }))

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature
        }
      })

      const chat = model.startChat({ history: geminiHistory })
      const result = await chat.sendMessageStream(lastMessage.content)

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) {
          yield text
        }
      }
      return
    }
    catch (error: unknown) {
      const errMsg = (error as Error).message || ''
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Too Many Requests')) {
        console.warn(`[Gemini] ${modelName} rate limited, trying next model...`)
        continue
      }
      throw error
    }
  }

  throw new Error('All Gemini models are rate limited. Please wait a moment and try again.')
}

export async function healthCheck(): Promise<boolean> {
  try {
    const client = getClient()
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent('ping')
    return result.response.text().length > 0
  }
  catch {
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
