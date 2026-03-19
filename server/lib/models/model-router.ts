import type { MessagePayload, AIProvider, RouterState, ProviderStatus, TaskComplexity } from '../../../shared/types'
import * as anthropic from './anthropic'
import * as gemini from './gemini'

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

const RESPONSE_TIMEOUT = 15_000

// Keywords that indicate a complex, heavy task requiring the capable model
const HEAVY_KEYWORDS = [
  'write', 'draft', 'plan', 'analyze', 'analyse', 'compare', 'report',
  'implement', 'design', 'create', 'build', 'generate', 'summarize',
  'summarise', 'review', 'research', 'explain', 'describe', 'code',
  'script', 'function', 'architecture', 'step by step', 'in detail',
  'workflow', 'strategy', 'proposal', 'outline', 'translate'
]

// Prefixes that indicate a simple, lite query
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
  if (wordCount > 60) return 'heavy'

  // Deep threads need the more capable model for context tracking
  if (threadDepth > 12) return 'heavy'

  // Heavy keyword match overrides everything
  if (HEAVY_KEYWORDS.some(kw => text.includes(kw))) return 'heavy'

  // Lite starters on short messages
  if (LITE_STARTERS.some(s => text.startsWith(s)) && wordCount <= 25) return 'lite'

  // Very short messages are lite (greetings, acknowledgments, simple questions)
  if (wordCount <= 10) return 'lite'

  // Default: heavy (better to be safe)
  return 'heavy'
}

function hasAnthropicKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY
  return !!key && key.length > 0
}

export function getActiveProvider(): AIProvider {
  if (!hasAnthropicKey()) {
    return 'gemini'
  }
  if (circuitBreaker.state === 'FALLBACK' || circuitBreaker.state === 'RECOVERING') {
    return 'gemini'
  }
  return 'anthropic'
}

export function getProviderForMessages(messages: MessagePayload[]): AIProvider {
  if (!hasAnthropicKey()) return 'gemini'
  if (circuitBreaker.state === 'FALLBACK' || circuitBreaker.state === 'RECOVERING') return 'gemini'

  const complexity = classifyTask(messages)
  return complexity === 'lite' ? 'gemini' : 'anthropic'
}

export function getProviderStatus(): ProviderStatus {
  return {
    provider: getActiveProvider(),
    state: circuitBreaker.state,
    isHealthy: circuitBreaker.state === 'HEALTHY',
    isFallback: circuitBreaker.state === 'FALLBACK' || circuitBreaker.state === 'RECOVERING',
    lastChecked: new Date(circuitBreaker.lastHealthCheck).toISOString()
  }
}

export function forceProvider(provider: AIProvider): void {
  if (provider === 'gemini') {
    circuitBreaker.state = 'FALLBACK'
    circuitBreaker.fallbackUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN
  } else {
    circuitBreaker.state = 'HEALTHY'
    circuitBreaker.errorCount = 0
    circuitBreaker.fallbackUntil = 0
  }
}

function recordError(reason: string): void {
  circuitBreaker.errorCount++
  circuitBreaker.lastErrorTime = Date.now()

  console.warn(`[ModelRouter] Error #${circuitBreaker.errorCount}: ${reason}`)

  if (circuitBreaker.errorCount >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreaker.state = 'FALLBACK'
    circuitBreaker.fallbackUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN
    circuitBreaker.errorCount = 0
    console.warn('[ModelRouter] Circuit breaker OPEN — switching to Gemini')
  } else if (circuitBreaker.errorCount >= 2) {
    circuitBreaker.state = 'DEGRADED'
  }
}

function recordSuccess(): void {
  if (circuitBreaker.state === 'RECOVERING') {
    circuitBreaker.state = 'HEALTHY'
    circuitBreaker.errorCount = 0
    circuitBreaker.fallbackUntil = 0
    console.info('[ModelRouter] Anthropic recovered — switching back to primary')
  } else if (circuitBreaker.state === 'DEGRADED') {
    circuitBreaker.errorCount = Math.max(0, circuitBreaker.errorCount - 1)
    if (circuitBreaker.errorCount === 0) {
      circuitBreaker.state = 'HEALTHY'
    }
  }

  if (circuitBreaker.lastErrorTime > 0
    && Date.now() - circuitBreaker.lastErrorTime > CIRCUIT_BREAKER_WINDOW) {
    circuitBreaker.errorCount = 0
  }
}

export async function* streamChat(
  messages: MessagePayload[],
  options: { maxTokens?: number, temperature?: number, systemPrompt?: string, forceComplexity?: TaskComplexity } = {}
): AsyncGenerator<string> {
  const { forceComplexity, ...modelOptions } = options

  if (circuitBreaker.state === 'FALLBACK'
    && Date.now() > circuitBreaker.fallbackUntil) {
    circuitBreaker.state = 'RECOVERING'
  }

  // Determine complexity: caller can override (e.g. force 'lite' for follow-up summarization)
  const complexity = forceComplexity ?? classifyTask(messages)

  // Route lite tasks directly to Gemini — no need to hit the heavy model
  const isCircuitOpen = circuitBreaker.state === 'FALLBACK' || circuitBreaker.state === 'RECOVERING'
  const useGemini = complexity === 'lite' || isCircuitOpen || !hasAnthropicKey()

  console.info(`[ModelRouter] complexity=${complexity} circuit=${circuitBreaker.state} → ${useGemini ? 'gemini' : 'anthropic'}`)

  if (!useGemini) {
    try {
      const streamGen = anthropic.streamChat(messages, modelOptions)
      const timeoutId = setTimeout(() => {
        throw new Error('Response timeout')
      }, RESPONSE_TIMEOUT)

      for await (const chunk of streamGen) {
        recordSuccess()
        yield chunk
      }

      clearTimeout(timeoutId)
    } catch (error: unknown) {
      const err = error as { status?: number, message?: string }
      const status = err.status
      const reason = err.message || 'Unknown Anthropic error'

      if (status === 529 || status === 429 || (status && status >= 500)) {
        recordError(`HTTP ${status}: ${reason}`)
        yield* gemini.streamChat(messages, modelOptions)
        return
      }

      if (reason.includes('timeout') || reason.includes('Timeout')) {
        recordError(`Timeout: ${reason}`)
        yield* gemini.streamChat(messages, modelOptions)
        return
      }

      recordError(reason)
      yield* gemini.streamChat(messages, modelOptions)
    }
  } else {
    yield* gemini.streamChat(messages, modelOptions)
  }
}

export async function runHealthCheck(): Promise<{ anthropic: boolean, gemini: boolean }> {
  circuitBreaker.lastHealthCheck = Date.now()

  const [anthropicOk, geminiOk] = await Promise.all([
    anthropic.healthCheck().catch(() => false),
    gemini.healthCheck().catch(() => false)
  ])

  if (!anthropicOk && circuitBreaker.state === 'HEALTHY') {
    recordError('Health check failed')
  }

  if (anthropicOk && circuitBreaker.state === 'FALLBACK') {
    circuitBreaker.state = 'RECOVERING'
  }

  return { anthropic: anthropicOk, gemini: geminiOk }
}
