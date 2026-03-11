// Drexii Shared Types — used by both server and client

// ============================================================
// Thread & Messages
// ============================================================

export interface Thread {
  id: string
  title: string
  createdAt: string
  archivedAt: string | null
}

export interface Message {
  id: string
  threadId: string
  role: 'user' | 'assistant'
  content: string
  modelUsed: 'anthropic' | 'gemini' | null
  toolCalls: ToolCall[] | null
  createdAt: string
}

// ============================================================
// AI Model Types
// ============================================================

export type AIProvider = 'anthropic' | 'gemini'

export type RouterState = 'HEALTHY' | 'DEGRADED' | 'FALLBACK' | 'RECOVERING'

export interface ProviderStatus {
  provider: AIProvider
  state: RouterState
  isHealthy: boolean
  isFallback: boolean
  lastChecked: string
}

export interface AgentRequest {
  threadId: string
  messages: MessagePayload[]
  tools?: ToolSchema[]
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface MessagePayload {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ModelResponse {
  content: string
  modelUsed: AIProvider
  toolCalls?: ToolCall[]
  finishReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'error'
}

export interface StreamChunk {
  type: 'text' | 'source' | 'action' | 'done' | 'error' | 'model_info'
  data: string
}

// ============================================================
// Tool / Function Calling
// ============================================================

export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
  required?: string[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  content: string
  isError?: boolean
}

// ============================================================
// Sources & Actions
// ============================================================

export interface Source {
  id: string
  messageId: string
  tool: string
  recordId: string
  title: string
  url: string
  excerpt: string
  score: number
}

export interface Action {
  id: string
  messageId: string
  tool: string
  actionType: string
  params: Record<string, unknown>
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled' | 'failed'
  executedAt: string | null
}

// ============================================================
// Model Events (analytics)
// ============================================================

export interface ModelEvent {
  id: string
  eventType: 'switch' | 'fallback' | 'recovery' | 'health_check' | 'error'
  provider: AIProvider
  reason: string
  durationMs: number
  createdAt: string
}

// ============================================================
// SSE Event Types
// ============================================================

export interface SSETextEvent {
  type: 'text'
  data: string
}

export interface SSESourceEvent {
  type: 'source'
  data: Source
}

export interface SSEActionEvent {
  type: 'action'
  data: Action
}

export interface SSEDoneEvent {
  type: 'done'
  data: { modelUsed: AIProvider }
}

export interface SSEErrorEvent {
  type: 'error'
  data: { message: string; code?: string }
}

export type SSEEvent = SSETextEvent | SSESourceEvent | SSEActionEvent | SSEDoneEvent | SSEErrorEvent
