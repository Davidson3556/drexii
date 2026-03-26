import type { MessagePayload, AIProvider, RouterState, ProviderStatus, TaskComplexity } from '../../../shared/types'
import * as insforgeAI from './insforge'
import type { InsforgeModel } from './insforge'

interface CircuitBreakerState {
  state: RouterState
  errorCount: number
  lastErrorTime: number
  lastHealthCheck: number
  fallbackUntil: number
}

const circuitBreaker: CircuitBreakerState = {
  state: 'HEALTHY',
  errorCount: 0,
  lastErrorTime: 0,
  lastHealthCheck: 0,
  fallbackUntil: 0
}

const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_WINDOW = 60_000
const CIRCUIT_BREAKER_COOLDOWN = 300_000

// ── Model mapping per complexity tier ──────────────────────────────

const MODEL_MAP: Record<TaskComplexity, InsforgeModel> = {
  lite: 'openai/gpt-4o-mini',
  standard: 'anthropic/claude-sonnet-4.5',
  heavy: 'anthropic/claude-opus-4.6',
  code: 'anthropic/claude-sonnet-4.5'
}

const FALLBACK_MODEL: InsforgeModel = 'anthropic/claude-haiku-4.5'

// ── Task classification ────────────────────────────────────────────

// Keywords that indicate a heavy task requiring the most capable model
const HEAVY_KEYWORDS = [
  'analyze', 'analyse', 'compare', 'research', 'explain in detail',
  'step by step', 'deep dive', 'investigate', 'evaluate', 'assess',
  'comprehensive', 'thorough', 'detailed analysis', 'pros and cons',
  'architecture', 'strategy', 'proposal'
]

// Keywords that indicate a standard task (drafting, writing)
const STANDARD_KEYWORDS = [
  'write', 'draft', 'plan', 'create', 'generate', 'summarize',
  'summarise', 'review', 'describe', 'outline', 'translate',
  'compose', 'report', 'email', 'document', 'article', 'blog'
]

// Keywords that indicate a code task
const CODE_KEYWORDS = [
  'code', 'script', 'function', 'implement', 'debug', 'refactor',
  'regex', 'algorithm', 'sql', 'query', 'api', 'endpoint',
  'build', 'deploy', 'test', 'fix bug', 'error', 'stack trace',
  'typescript', 'javascript', 'python', 'html', 'css', 'json'
]

// Prefixes that indicate a simple lite query
const LITE_STARTERS = [
  'what is ', 'what are ', "what's ", 'who is ', 'where is ', 'when is ',
  'how do ', 'how does ', 'hi', 'hello', 'hey', 'thanks', 'thank you',
  'ok', 'okay', 'yes', 'no', 'sure', 'got it', 'is it ', 'does it ',
  'can you tell me', 'do you know', 'what does '
]

export function classifyTask(messages: MessagePayload[]): TaskComplexity {
  const last = messages[messages.length - 1]
  if (!last || last.role !== 'user') return 'heavy'

  const text = last.content.toLowerCase().trim()
  const wordCount = last.content.trim().split(/\s+/).length
  const threadDepth = messages.length

  // Long messages are inherently complex
  if (wordCount > 80) return 'heavy'

  // Deep threads need the most capable model
  if (threadDepth > 14) return 'heavy'

  // Check for code tasks first (most specific)
  if (CODE_KEYWORDS.some(kw => text.includes(kw))) return 'code'

  // Check for heavy tasks
  if (HEAVY_KEYWORDS.some(kw => text.includes(kw))) return 'heavy'

  // Check for standard writing/drafting tasks
  if (STANDARD_KEYWORDS.some(kw => text.includes(kw))) return 'standard'

  // Lite starters on short messages
  if (LITE_STARTERS.some(s => text.startsWith(s)) && wordCount <= 25) return 'lite'

  // Very short messages are lite
  if (wordCount <= 10) return 'lite'

  // Default: standard (balanced)
  return 'standard'
}

// ── Provider status (simplified — single provider: insforge) ───────

export function getActiveProvider(): AIProvider {
  return 'insforge'
}

export function getProviderForMessages(messages: MessagePayload[]): AIProvider {
  return 'insforge'
}

export function getModelForMessages(messages: MessagePayload[]): InsforgeModel {
  if (circuitBreaker.state === 'FALLBACK') return FALLBACK_MODEL
  const complexity = classifyTask(messages)
  return MODEL_MAP[complexity]
}

export function getProviderStatus(): ProviderStatus {
  return {
    provider: 'insforge',
    state: circuitBreaker.state,
    isHealthy: circuitBreaker.state === 'HEALTHY',
    isFallback: circuitBreaker.state === 'FALLBACK' || circuitBreaker.state === 'RECOVERING',
    lastChecked: new Date(circuitBreaker.lastHealthCheck).toISOString()
  }
}

export function forceProvider(_provider: AIProvider): void {
  // No-op — InsForge handles all models now
}

// ── Circuit breaker helpers ────────────────────────────────────────

function recordError(reason: string): void {
  circuitBreaker.errorCount++
  circuitBreaker.lastErrorTime = Date.now()

  console.warn(`[ModelRouter] Error #${circuitBreaker.errorCount}: ${reason}`)

  if (circuitBreaker.errorCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.state = 'FALLBACK'
    circuitBreaker.fallbackUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN
    circuitBreaker.errorCount = 0
    console.warn('[ModelRouter] Circuit breaker OPEN — falling back to Haiku')
  } else if (circuitBreaker.errorCount >= 2) {
    circuitBreaker.state = 'DEGRADED'
  }
}

function recordSuccess(): void {
  if (circuitBreaker.state === 'RECOVERING') {
    circuitBreaker.state = 'HEALTHY'
    circuitBreaker.errorCount = 0
    circuitBreaker.fallbackUntil = 0
    console.info('[ModelRouter] InsForge recovered — back to normal routing')
  } else if (circuitBreaker.state === 'DEGRADED') {
    circuitBreaker.errorCount = Math.max(0, circuitBreaker.errorCount - 1)
    if (circuitBreaker.errorCount === 0) {
      circuitBreaker.state = 'HEALTHY'
    }
  }

  if (circuitBreaker.lastErrorTime > 0 && Date.now() - circuitBreaker.lastErrorTime > CIRCUIT_BREAKER_WINDOW) {
    circuitBreaker.errorCount = 0
  }
}

// ── Streaming chat ─────────────────────────────────────────────────

export async function* streamChat(
  messages: MessagePayload[],
  options: {
    maxTokens?: number
    temperature?: number
    systemPrompt?: string
    forceComplexity?: TaskComplexity
    webSearch?: boolean
  } = {}
): AsyncGenerator<string> {
  const { forceComplexity, webSearch, ...modelOptions } = options

  // Check if circuit breaker cooldown is over
  if (circuitBreaker.state === 'FALLBACK' && Date.now() > circuitBreaker.fallbackUntil) {
    circuitBreaker.state = 'RECOVERING'
  }

  const complexity = forceComplexity ?? classifyTask(messages)
  const isFallback = circuitBreaker.state === 'FALLBACK'
  const model = isFallback ? FALLBACK_MODEL : MODEL_MAP[complexity]

  console.info(`[ModelRouter] complexity=${complexity} circuit=${circuitBreaker.state} → ${model}`)

  try {
    const stream = insforgeAI.streamChat(messages, {
      ...modelOptions,
      model,
      webSearch
    })

    for await (const chunk of stream) {
      recordSuccess()
      yield chunk
    }
  } catch (error: unknown) {
    const err = error as Error
    const reason = err.message || 'Unknown InsForge AI error'
    recordError(reason)

    // Retry with fallback model if not already using it
    if (model !== FALLBACK_MODEL) {
      console.warn(`[ModelRouter] Retrying with fallback model: ${FALLBACK_MODEL}`)
      yield* insforgeAI.streamChat(messages, {
        ...modelOptions,
        model: FALLBACK_MODEL
      })
    } else {
      throw error
    }
  }
}

// ── Non-streaming completion (for background agent) ────────────────

export async function completion(
  messages: MessagePayload[],
  options: {
    maxTokens?: number
    temperature?: number
    systemPrompt?: string
    forceComplexity?: TaskComplexity
    webSearch?: boolean
  } = {}
): Promise<string> {
  const { forceComplexity, webSearch, ...modelOptions } = options
  const complexity = forceComplexity ?? classifyTask(messages)
  const model = circuitBreaker.state === 'FALLBACK' ? FALLBACK_MODEL : MODEL_MAP[complexity]

  try {
    const result = await insforgeAI.chatCompletion(messages, {
      ...modelOptions,
      model,
      webSearch
    })
    recordSuccess()
    return result
  } catch (error: unknown) {
    const reason = (error as Error).message || 'Unknown error'
    recordError(reason)

    if (model !== FALLBACK_MODEL) {
      return insforgeAI.chatCompletion(messages, {
        ...modelOptions,
        model: FALLBACK_MODEL
      })
    }
    throw error
  }
}

// ── Health check ───────────────────────────────────────────────────

export async function runHealthCheck(): Promise<{ insforge: boolean }> {
  circuitBreaker.lastHealthCheck = Date.now()

  const insforgeOk = await insforgeAI.healthCheck().catch(() => false)

  if (!insforgeOk && circuitBreaker.state === 'HEALTHY') {
    recordError('Health check failed')
  }

  if (insforgeOk && circuitBreaker.state === 'FALLBACK') {
    circuitBreaker.state = 'RECOVERING'
  }

  return { insforge: insforgeOk }
}
