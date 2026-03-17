import { eq, and } from 'drizzle-orm'
import { useDB } from '../db'
import { actions } from '../db/schema'
import { executeTool } from './integrations'
import type { ToolResult } from '../../shared/types'

export async function createPendingAction(
  messageId: string,
  tool: string,
  params: Record<string, unknown>
): Promise<string> {
  const db = useDB()
  const [action] = await db.insert(actions).values({
    messageId,
    tool,
    actionType: 'write',
    params,
    status: 'pending'
  }).returning({ id: actions.id })
  if (!action) throw new Error('Failed to create action')
  return action.id
}

export async function confirmAction(actionId: string): Promise<ToolResult> {
  const db = useDB()

  const [action] = await db.select()
    .from(actions)
    .where(and(eq(actions.id, actionId), eq(actions.status, 'pending')))
    .limit(1)

  if (!action) {
    return { toolCallId: actionId, content: 'Action not found or already processed', isError: true }
  }

  const params = action.params as Record<string, unknown>
  const result = await executeTool(action.tool, params)

  await db.update(actions)
    .set({
      status: result.isError ? 'failed' : 'executed',
      executedAt: new Date()
    })
    .where(eq(actions.id, actionId))

  return result
}

export async function cancelAction(actionId: string): Promise<void> {
  const db = useDB()
  await db.update(actions)
    .set({ status: 'cancelled' })
    .where(and(eq(actions.id, actionId), eq(actions.status, 'pending')))
}

export async function getPendingActions() {
  const db = useDB()
  return db.select()
    .from(actions)
    .where(eq(actions.status, 'pending'))
}
