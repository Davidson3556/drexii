import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../db'
import { processAutomation } from '../../lib/agent-runner'

/**
 * Process all due scheduled automations.
 * Designed to be called by a cron job (e.g. every 5 minutes).
 *
 * Also supports manually triggering a specific automation via { automationId }.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ automationId?: string, context?: string }>(event)

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

    await processAutomation(
      automation.id,
      body.context || `Manual trigger at ${new Date().toISOString()}`,
      { manual: true }
    )

    return { ok: true, processed: 1 }
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
        await processAutomation(automation.id, context, { scheduled: true })
        processed++
      }
    }

    if (automation.trigger === 'email_received') {
      // Email automations are processed via the Gmail webhook endpoint
      // But we also support polling here as a fallback
      try {
        const response = await $fetch('/api/webhooks/gmail', {
          method: 'POST',
          body: { poll: true, userId: automation.userId }
        })
        processed++
      } catch {
        // Gmail polling failed — skip
      }
    }
  }

  return { ok: true, processed }
})
