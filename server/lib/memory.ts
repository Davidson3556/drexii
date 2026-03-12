import { useDB } from '../db'
import { memories } from '../db/schema'
import { desc, ilike } from 'drizzle-orm'

export async function saveMemory(
  category: 'fact' | 'preference' | 'context',
  content: string,
  source?: string
): Promise<void> {
  try {
    const db = useDB()
    await db.insert(memories).values({
      category,
      content,
      source: source || null
    })
  } catch (error) {
    console.error('[Memory] Failed to save memory:', error)
  }
}

export async function searchMemories(query: string, limit = 10) {
  const db = useDB()
  return db
    .select()
    .from(memories)
    .where(ilike(memories.content, `%${query}%`))
    .orderBy(desc(memories.createdAt))
    .limit(limit)
}

export async function getRecentMemories(limit = 20) {
  const db = useDB()
  return db
    .select()
    .from(memories)
    .orderBy(desc(memories.createdAt))
    .limit(limit)
}

export function formatMemoriesForPrompt(mems: Array<{ category: string, content: string }>): string {
  if (mems.length === 0) return ''

  const lines = mems.map(m => `- [${m.category}] ${m.content}`)
  return `\n\nYou have the following memories from previous conversations:\n${lines.join('\n')}\n\nUse these memories to personalize your responses and remember user preferences.`
}
