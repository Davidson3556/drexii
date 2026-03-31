import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

function createHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json'
  }
}

async function notionSearch(apiKey: string, query: string, filterType?: string): Promise<ToolResult> {
  try {
    const body: Record<string, unknown> = { query, page_size: 10 }
    if (filterType === 'database' || filterType === 'page') {
      body.filter = { value: filterType, property: 'object' }
    }

    const data = await $fetch<{ results: Array<{ id: string, object: string, url?: string, properties?: Record<string, unknown>, title?: Array<{ plain_text: string }> }> }>(`${NOTION_API}/search`, {
      method: 'POST',
      headers: createHeaders(apiKey),
      body
    })

    const results = data.results.map((r) => {
      // Databases have a top-level title array, pages use properties
      const title = r.object === 'database'
        ? (r.title?.map(t => t.plain_text).join('') || 'Untitled')
        : extractTitle(r.properties)
      return {
        id: r.id,
        type: r.object,
        url: r.url || '',
        title
      }
    })

    const formatted = results.map(r => `- [${r.type}] "${r.title}" | ID: ${r.id} | ${r.url}`).join('\n')

    return {
      toolCallId: 'notion_search',
      content: results.length > 0
        ? `Found ${results.length} results:\n${formatted}\n\nUse the exact ID above when creating pages.`
        : `No results found for "${query}".`
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'notion_search',
      content: `Error searching Notion: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function notionGetPage(apiKey: string, pageId: string): Promise<ToolResult> {
  try {
    const hdrs = createHeaders(apiKey)
    const page = await $fetch<{ id: string, url: string, properties: Record<string, unknown> }>(`${NOTION_API}/pages/${pageId}`, {
      headers: hdrs
    })

    const blocks = await $fetch<{ results: Array<{ type: string, [key: string]: unknown }> }>(`${NOTION_API}/blocks/${pageId}/children`, {
      headers: hdrs
    })

    const content = blocks.results.map(b => extractBlockText(b)).filter(Boolean).join('\n')

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

async function notionCreatePage(apiKey: string, args: { database_id?: string, page_id?: string, title: string, content?: string }): Promise<ToolResult> {
  try {
    const { database_id, page_id, title, content } = args

    if (!database_id && !page_id) {
      return { toolCallId: 'notion_create_page', content: 'Either database_id or page_id is required. Use notion_search to find the correct ID first.', isError: true }
    }

    const body: Record<string, unknown> = {}

    if (database_id) {
      body.parent = { database_id }
      body.properties = {
        Name: { title: [{ text: { content: title } }] }
      }
    } else {
      body.parent = { page_id }
      body.properties = {
        title: { title: [{ text: { content: title } }] }
      }
    }

    if (content) {
      // Split content into blocks (Notion has a 2000 char limit per block)
      const chunks = content.match(/[\s\S]{1,2000}/g) || [content]
      body.children = chunks.map(chunk => ({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: chunk } }]
        }
      }))
    }

    const page = await $fetch<{ id: string, url: string }>(`${NOTION_API}/pages`, {
      method: 'POST',
      headers: createHeaders(apiKey),
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

const notionTools: ToolSchema[] = [
  {
    name: 'notion_search',
    description: 'Search Notion workspace for pages and databases by keyword. Returns IDs you must use for other Notion tools.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query text' },
        filter_type: { type: 'string', description: 'Filter by "database" or "page" (optional)' }
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
    description: 'Create a new page in Notion. Use notion_search first to get a real ID — never guess IDs. Provide either database_id (to add a row to a database) or page_id (to create a subpage under an existing page).',
    parameters: {
      type: 'object',
      properties: {
        database_id: { type: 'string', description: 'Target database ID (from notion_search). Use this to add a row to a database.' },
        page_id: { type: 'string', description: 'Target page ID (from notion_search). Use this to create a subpage under an existing page.' },
        title: { type: 'string', description: 'Page title' },
        content: { type: 'string', description: 'Optional page body text' }
      },
      required: ['title']
    }
  }
]

export function createNotionAdapter(apiKey: string): IntegrationAdapter {
  return {
    name: 'notion',
    isConfigured: () => true,
    tools: notionTools,

    async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
      switch (toolName) {
        case 'notion_search':
          return notionSearch(apiKey, args.query as string, args.filter_type as string | undefined)
        case 'notion_get_page':
          return notionGetPage(apiKey, args.page_id as string)
        case 'notion_create_page':
          return notionCreatePage(apiKey, args as { database_id?: string, page_id?: string, title: string, content?: string })
        default:
          return { toolCallId: toolName, content: `Unknown Notion tool: ${toolName}`, isError: true }
      }
    },

    async healthCheck(): Promise<boolean> {
      try {
        await $fetch(`${NOTION_API}/users/me`, { headers: createHeaders(apiKey) })
        return true
      } catch (e) {
        console.error('[Notion] Health check failed:', (e as Error).message)
        return false
      }
    }
  }
}

// Default adapter using env vars (backward compatible)
function getEnvKey(): string | undefined {
  return process.env.NOTION_API_KEY || useRuntimeConfig().notionApiKey as string | undefined
}

export const notion: IntegrationAdapter = {
  name: 'notion',
  isConfigured: () => !!getEnvKey(),
  tools: notionTools,

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    const key = getEnvKey()
    if (!key) return { toolCallId: toolName, content: 'NOTION_API_KEY is not configured', isError: true }
    return createNotionAdapter(key).execute(toolName, args)
  },

  async healthCheck(): Promise<boolean> {
    const key = getEnvKey()
    if (!key) return false
    return createNotionAdapter(key).healthCheck()
  }
}
