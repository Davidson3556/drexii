import type { MessagePayload, AIProvider, RouterState, ProviderStatus } from '../../../shared/types'
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
const HEALTH_CHECK_INTERVAL = 30_000
const RESPONSE_TIMEOUT = 15_000

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
  }
  else {
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
  }
  else if (circuitBreaker.errorCount >= 2) {
    circuitBreaker.state = 'DEGRADED'
  }
}

function recordSuccess(): void {
  if (circuitBreaker.state === 'RECOVERING') {
    circuitBreaker.state = 'HEALTHY'
    circuitBreaker.errorCount = 0
    circuitBreaker.fallbackUntil = 0
    console.info('[ModelRouter] Anthropic recovered — switching back to primary')
  }
  else if (circuitBreaker.state === 'DEGRADED') {
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
  options: { maxTokens?: number; temperature?: number; systemPrompt?: string } = {}
): AsyncGenerator<string> {
  const provider = getActiveProvider()

  if (circuitBreaker.state === 'FALLBACK'
    && Date.now() > circuitBreaker.fallbackUntil) {
    circuitBreaker.state = 'RECOVERING'
  }

  if (provider === 'anthropic') {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Response timeout')), RESPONSE_TIMEOUT)
      })

      const streamGen = anthropic.streamChat(messages, options)
      let firstChunk = true

      for await (const chunk of streamGen) {
        if (firstChunk) {
          firstChunk = false
        }
        recordSuccess()
        yield chunk
      }
    }
    catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      const status = err.status
      const reason = err.message || 'Unknown Anthropic error'

      if (status === 529 || status === 429 || (status && status >= 500)) {
        recordError(`HTTP ${status}: ${reason}`)
        yield* gemini.streamChat(messages, options)
        return
      }

      if (reason.includes('timeout') || reason.includes('Timeout')) {
        recordError(`Timeout: ${reason}`)
        yield* gemini.streamChat(messages, options)
        return
      }

      recordError(reason)
      yield* gemini.streamChat(messages, options)
    }
  }
  else {
    yield* gemini.streamChat(messages, options)
  }
}

export async function runHealthCheck(): Promise<{ anthropic: boolean; gemini: boolean }> {
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
