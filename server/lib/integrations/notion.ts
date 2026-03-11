import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

function getApiKey(): string | undefined {
  return process.env.NOTION_API_KEY || useRuntimeConfig().notionApiKey
}

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

function headers(): Record<string, string> {
  const key = getApiKey()
  if (!key) throw new Error('NOTION_API_KEY is not configured')
  return {
    'Authorization': `Bearer ${key}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json'
  }
}

async function notionSearch(query: string): Promise<ToolResult> {
  try {
    const data = await $fetch<{ results: Array<{ id: string, object: string, url?: string, properties?: Record<string, unknown> }> }>(`${NOTION_API}/search`, {
      method: 'POST',
      headers: headers(),
      body: { query, page_size: 10 }
    })

    const results = data.results.map((r: { id: string, object: string, url?: string, properties?: Record<string, unknown> }) => ({
      id: r.id,
      type: r.object,
      url: r.url || '',
      title: extractTitle(r.properties)
    }))

    return {
      toolCallId: 'notion_search',
      content: JSON.stringify({ results, count: results.length })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'notion_search',
      content: `Error searching Notion: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function notionGetPage(pageId: string): Promise<ToolResult> {
  try {
    const page = await $fetch<{ id: string, url: string, properties: Record<string, unknown> }>(`${NOTION_API}/pages/${pageId}`, {
      headers: headers()
    })

    const blocks = await $fetch<{ results: Array<{ type: string, [key: string]: unknown }> }>(`${NOTION_API}/blocks/${pageId}/children`, {
      headers: headers()
    })

    const content = blocks.results.map((b: { type: string, [key: string]: unknown }) => extractBlockText(b)).filter(Boolean).join('\n')

    return {
      toolCallId: 'notion_get_page',
      content: JSON.stringify({
        id: page.id,
        url: page.url,
        title: extractTitle(page.properties),
        content: content.slice(0, 2000)
      })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'notion_get_page',
      content: `Error fetching Notion page: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function notionCreatePage(databaseId: string, title: string, content?: string): Promise<ToolResult> {
  try {
    const body: Record<string, unknown> = {
      parent: { database_id: databaseId },
      properties: {
        Name: { title: [{ text: { content: title } }] }
      }
    }

    if (content) {
      body.children = [{
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content } }]
        }
      }]
    }

    const page = await $fetch<{ id: string, url: string }>(`${NOTION_API}/pages`, {
      method: 'POST',
      headers: headers(),
      body
    })

    return {
      toolCallId: 'notion_create_page',
      content: JSON.stringify({ id: page.id, url: page.url, title })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'notion_create_page',
      content: `Error creating Notion page: ${(error as Error).message}`,
      isError: true
    }
  }
}

function extractTitle(properties?: Record<string, unknown>): string {
  if (!properties) return 'Untitled'
  for (const val of Object.values(properties)) {
    const prop = val as { type?: string, title?: Array<{ plain_text: string }> }
    if (prop.type === 'title' && Array.isArray(prop.title) && prop.title.length > 0) {
      return prop.title.map(t => t.plain_text).join('')
    }
  }
  return 'Untitled'
}

function extractBlockText(block: { type: string, [key: string]: unknown }): string {
  const blockData = block[block.type] as { rich_text?: Array<{ plain_text: string }> } | undefined
  if (blockData?.rich_text) {
    return blockData.rich_text.map(t => t.plain_text).join('')
  }
  return ''
}

export const notion: IntegrationAdapter = {
  name: 'notion',
  isConfigured: () => !!getApiKey(),

  tools: [
    {
      name: 'notion_search',
      description: 'Search Notion workspace for pages and databases by keyword query',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query text' }
        },
        required: ['query']
      }
    },
    {
      name: 'notion_get_page',
      description: 'Get a Notion page content by its page ID',
      parameters: {
        type: 'object',
        properties: {
          page_id: { type: 'string', description: 'The Notion page ID' }
        },
        required: ['page_id']
      }
    },
    {
      name: 'notion_create_page',
      description: 'Create a new page in a Notion database',
      parameters: {
        type: 'object',
        properties: {
          database_id: { type: 'string', description: 'Target database ID' },
          title: { type: 'string', description: 'Page title' },
          content: { type: 'string', description: 'Optional page body text' }
        },
        required: ['database_id', 'title']
      }
    }
  ] as ToolSchema[],

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    switch (toolName) {
      case 'notion_search':
        return notionSearch(args.query as string)
      case 'notion_get_page':
        return notionGetPage(args.page_id as string)
      case 'notion_create_page':
        return notionCreatePage(args.database_id as string, args.title as string, args.content as string | undefined)
      default:
        return { toolCallId: toolName, content: `Unknown Notion tool: ${toolName}`, isError: true }
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      await $fetch(`${NOTION_API}/users/me`, { headers: headers() })
      return true
    } catch {
      return false
    }
  }
}
