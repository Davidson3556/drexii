import { useDB } from '../db'
import { auditLog } from '../db/schema'
import { desc } from 'drizzle-orm'
import type { ToolResult } from '../../shared/types'

export async function logToolExecution(
  integration: string,
  toolName: string,
  args: Record<string, unknown>,
  result: ToolResult
): Promise<void> {
  try {
    const db = useDB()
    await db.insert(auditLog).values({
      integration,
      toolName,
      args,
      result: { content: result.content, isError: result.isError || false },
      status: result.isError ? 'error' : 'success'
    })
  } catch (error) {
    console.error('[Audit] Failed to log tool execution:', error)
  }
}

export async function getAuditEntries(limit = 50) {
  const db = useDB()
  return db.select().from(auditLog).orderBy(desc(auditLog.executedAt)).limit(limit)
}
