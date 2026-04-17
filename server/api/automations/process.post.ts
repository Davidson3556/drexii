import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../db'
import { processAutomation } from '../../lib/agent-runner'
import { checkRateLimit } from '../../lib/rate-limiter'

const MANUAL_RATE_LIMIT = 11 // max manual triggers per window
const BATCH_RATE_LIMIT = 10 // max batch process calls per window
const RATE_WINDOW = 10 * 60 * 1000 // 10 minutes

/**
 * Process all due scheduled automations.
 * Designed to be called by a cron job (e.g. every 5 minutes).
 *
 * Also supports manually triggering a specific automation via { automationId }.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ automationId?: string, context?: string }>(event)

  // Rate limit — manual triggers and batch runs use separate buckets
  const ip = getHeader(event, 'x-forwarded-for') || event.node.req.socket?.remoteAddress || 'unknown'
  const isManual = !!body?.automationId
  const rateKey = isManual ? `automation:manual:${ip}` : `automation:batch:${ip}`
  const rateLimit = isManual ? MANUAL_RATE_LIMIT : BATCH_RATE_LIMIT
  const rl = checkRateLimit(rateKey, rateLimit, RATE_WINDOW)
  setResponseHeader(event, 'X-RateLimit-Limit', String(rateLimit))
  setResponseHeader(event, 'X-RateLimit-Remaining', String(rl.remaining))
  setResponseHeader(event, 'X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)))
  if (!rl.allowed) {
    throw createError({
      statusCode: 429,
      message: `Rate limit exceeded. Please wait ${Math.ceil((rl.resetAt - Date.now()) / 60000)} minute(s) before trying again.`
    })
  }

  const db = useDB()

  // ── Manual trigger for a specific automation ─────────────────────
  if (body?.automationId) {
    const [automation] = await db.select()
      .from(schema.automations)
      .where(eq(schema.automations.id, body.automationId))
      .limit(1)

    if (!automation) {
      throw createError({ statusCode: 404, message: 'Automation not found' })
    }

    // Manual test runs: await the result so the user sees what happened.
    try {
      const result = await processAutomation(
        automation.id,
        body.context || `Manual trigger at ${new Date().toISOString()}`,
        { manual: true }
      )

      if (!result) {
        throw createError({ statusCode: 500, message: 'Automation did not produce a result.' })
      }

      return {
        ok: result.status === 'success',
        processed: 1,
        status: result.status,
        output: result.output,
        toolsUsed: result.toolsUsed,
        durationMs: result.durationMs,
        results: [{ automationId: automation.id, status: result.status, output: result.output }]
      }
    } catch (err: unknown) {
      console.error('[automations/process] manual run failed:', err)
      throw createError({
        statusCode: 500,
        message: (err as Error).message || 'Automation run failed'
      })
    }
  }

  // ── Process all due scheduled automations ────────────────────────
  const activeAutomations = await db.select()
    .from(schema.automations)
    .where(eq(schema.automations.isActive, true))

  let processed = 0

  for (const automation of activeAutomations) {
    const config = automation.triggerConfig as Record<string, unknown>

    if (automation.trigger === 'schedule') {
      // Check if it's time to run based on interval
      const intervalMinutes = (config.intervalMinutes as number) || 60
      const lastRun = automation.lastRunAt ? new Date(automation.lastRunAt).getTime() : 0
      const now = Date.now()

      if (now - lastRun >= intervalMinutes * 60 * 1000) {
        const context = `Scheduled run at ${new Date().toISOString()}. Interval: every ${intervalMinutes} minutes.`
        processAutomation(automation.id, context, { scheduled: true })
          .catch((err: unknown) => console.error('[automations/process] scheduled run failed:', err))
        processed++
      }
    }

    if (automation.trigger === 'email_received') {
      // Email automations are processed via the Gmail webhook endpoint
      // But we also support polling here as a fallback
      try {
        await $fetch('/api/webhooks/gmail', {
          method: 'POST',
          body: { poll: true, userId: automation.userId }
        })
        processed++
      } catch {
        // Gmail polling failed — skip
      }
    }
  }

  return { ok: true, processed, results: [] }
})
