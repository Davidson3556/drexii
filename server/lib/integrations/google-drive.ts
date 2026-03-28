import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DOCS_API = 'https://docs.googleapis.com/v1'

interface GoogleTokens {
  clientId: string
  clientSecret: string
  refreshToken: string
  accessToken?: string
  expiresAt?: number
}

async function getAccessToken(tokens: GoogleTokens): Promise<string> {
  if (tokens.accessToken && tokens.expiresAt && Date.now() < tokens.expiresAt) {
    return tokens.accessToken
  }
  const response = await $fetch<{ access_token: string, expires_in: number }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: {
      client_id: tokens.clientId,
      client_secret: tokens.clientSecret,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token'
    }
  })
  tokens.accessToken = response.access_token
  tokens.expiresAt = Date.now() + (response.expires_in * 1000) - 60_000
  return response.access_token
}

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` }
}

// ── Drive tools ────────────────────────────────────────────────────

async function searchFiles(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const query = args.query as string
    if (!query) return { toolCallId: 'drive_search', content: 'query is required', isError: true }

    const maxResults = Math.min(Number(args.max_results) || 10, 20)
    const mimeFilter = args.file_type as string

    let q = `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`
    if (mimeFilter === 'doc') q += ` and mimeType = 'application/vnd.google-apps.document'`
    else if (mimeFilter === 'sheet') q += ` and mimeType = 'application/vnd.google-apps.spreadsheet'`
    else if (mimeFilter === 'pdf') q += ` and mimeType = 'application/pdf'`

    const data = await $fetch<{ files?: Array<{ id: string, name: string, mimeType: string, modifiedTime: string, webViewLink: string }> }>(
      `${DRIVE_API}/files`,
      {
        headers: authHeader(accessToken),
        query: { q, pageSize: maxResults, fields: 'files(id,name,mimeType,modifiedTime,webViewLink)', orderBy: 'modifiedTime desc' }
      }
    )

    if (!data.files || data.files.length === 0) {
      return { toolCallId: 'drive_search', content: `No files found matching "${query}".` }
    }

    const formatted = data.files.map(f =>
      `- ${f.name} | ${f.mimeType.split('.').pop()} | Modified: ${new Date(f.modifiedTime).toLocaleDateString()} | ID: ${f.id} | ${f.webViewLink}`
    ).join('\n')

    return { toolCallId: 'drive_search', content: `Files matching "${query}":\n${formatted}` }
  } catch (error) {
    return { toolCallId: 'drive_search', content: `Drive search failed: ${(error as Error).message}`, isError: true }
  }
}

async function getFileContent(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const fileId = args.file_id as string
    if (!fileId) return { toolCallId: 'drive_get_file', content: 'file_id is required', isError: true }

    // Get file metadata first
    const meta = await $fetch<{ name: string, mimeType: string }>(
      `${DRIVE_API}/files/${fileId}`,
      { headers: authHeader(accessToken), query: { fields: 'name,mimeType' } }
    )

    // Export Google Docs as plain text
    if (meta.mimeType === 'application/vnd.google-apps.document') {
      const content = await $fetch<string>(
        `${DRIVE_API}/files/${fileId}/export`,
        { headers: authHeader(accessToken), query: { mimeType: 'text/plain' }, responseType: 'text' }
      )
      const truncated = typeof content === 'string' && content.length > 8000
        ? content.slice(0, 8000) + '\n\n[Content truncated...]'
        : content
      return { toolCallId: 'drive_get_file', content: `File: ${meta.name}\n\n${truncated}` }
    }

    // Export Google Sheets as CSV
    if (meta.mimeType === 'application/vnd.google-apps.spreadsheet') {
      const content = await $fetch<string>(
        `${DRIVE_API}/files/${fileId}/export`,
        { headers: authHeader(accessToken), query: { mimeType: 'text/csv' }, responseType: 'text' }
      )
      const truncated = typeof content === 'string' && content.length > 8000
        ? content.slice(0, 8000) + '\n[Content truncated...]'
        : content
      return { toolCallId: 'drive_get_file', content: `File: ${meta.name} (Spreadsheet)\n\n${truncated}` }
    }

    return {
      toolCallId: 'drive_get_file',
      content: `File "${meta.name}" (${meta.mimeType}) found but cannot be read as text. Use drive_search to find the link and open it directly.`
    }
  } catch (error) {
    return { toolCallId: 'drive_get_file', content: `Failed to read file: ${(error as Error).message}`, isError: true }
  }
}

async function listRecentFiles(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const maxResults = Math.min(Number(args.max_results) || 10, 20)

    const data = await $fetch<{ files?: Array<{ id: string, name: string, mimeType: string, modifiedTime: string, webViewLink: string }> }>(
      `${DRIVE_API}/files`,
      {
        headers: authHeader(accessToken),
        query: {
          q: 'trashed = false',
          pageSize: maxResults,
          fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
          orderBy: 'modifiedTime desc'
        }
      }
    )

    if (!data.files || data.files.length === 0) {
      return { toolCallId: 'drive_list_recent', content: 'No recent files found.' }
    }

    const formatted = data.files.map(f =>
      `- ${f.name} | Modified: ${new Date(f.modifiedTime).toLocaleDateString()} | ${f.webViewLink}`
    ).join('\n')

    return { toolCallId: 'drive_list_recent', content: `Recent files:\n${formatted}` }
  } catch (error) {
    return { toolCallId: 'drive_list_recent', content: `Failed to list files: ${(error as Error).message}`, isError: true }
  }
}

async function createDoc(tokens: GoogleTokens, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const accessToken = await getAccessToken(tokens)
    const { title, content } = args as Record<string, string>
    if (!title) return { toolCallId: 'drive_create_doc', content: 'title is required', isError: true }

    // Create the doc via Docs API
    const doc = await $fetch<{ documentId: string }>(
      `${DOCS_API}/documents`,
      {
        method: 'POST',
        headers: authHeader(accessToken),
        body: { title }
      }
    )

    // Insert content if provided
    if (content && doc.documentId) {
      await $fetch(`${DOCS_API}/documents/${doc.documentId}:batchUpdate`, {
        method: 'POST',
        headers: authHeader(accessToken),
        body: {
          requests: [{
            insertText: {
              location: { index: 1 },
              text: content
            }
          }]
        }
      })
    }

    return {
      toolCallId: 'drive_create_doc',
      content: `Document "${title}" created: https://docs.google.com/document/d/${doc.documentId}/edit`
    }
  } catch (error) {
    return { toolCallId: 'drive_create_doc', content: `Failed to create document: ${(error as Error).message}`, isError: true }
  }
}

// ── Tool schemas ───────────────────────────────────────────────────

const tools: ToolSchema[] = [
  {
    name: 'drive_search',
    description: 'Search for files in Google Drive by name or content',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term to find files' },
        file_type: { type: 'string', description: 'Filter by type: doc, sheet, pdf (optional)' },
        max_results: { type: 'number', description: 'Max files to return (default 10, max 20)' }
      },
      required: ['query']
    }
  },
  {
    name: 'drive_get_file',
    description: 'Read the text content of a Google Doc or Spreadsheet',
    parameters: {
      type: 'object',
      properties: {
        file_id: { type: 'string', description: 'The file ID from drive_search' }
      },
      required: ['file_id']
    }
  },
  {
    name: 'drive_list_recent',
    description: 'List recently modified files in Google Drive',
    parameters: {
      type: 'object',
      properties: {
        max_results: { type: 'number', description: 'Max files to return (default 10)' }
      }
    }
  },
  {
    name: 'drive_create_doc',
    description: 'Create a new Google Doc with optional content',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Document title' },
        content: { type: 'string', description: 'Initial text content (optional)' }
      },
      required: ['title']
    }
  }
]

export const DRIVE_WRITE_TOOLS = new Set(['drive_create_doc'])

// ── Adapter factory ────────────────────────────────────────────────

export function createGoogleDriveAdapter(creds: {
  client_id: string
  client_secret: string
  refresh_token: string
}): IntegrationAdapter {
  const tokens: GoogleTokens = {
    clientId: creds.client_id,
    clientSecret: creds.client_secret,
    refreshToken: creds.refresh_token
  }

  return {
    name: 'google_drive',
    isConfigured: () => !!(creds.client_id && creds.client_secret && creds.refresh_token),
    tools,
    async execute(toolName, args) {
      switch (toolName) {
        case 'drive_search': return searchFiles(tokens, args)
        case 'drive_get_file': return getFileContent(tokens, args)
        case 'drive_list_recent': return listRecentFiles(tokens, args)
        case 'drive_create_doc': return createDoc(tokens, args)
        default: return { toolCallId: toolName, content: `Unknown tool: ${toolName}`, isError: true }
      }
    },
    async healthCheck() {
      try {
        const accessToken = await getAccessToken(tokens)
        await $fetch(`${DRIVE_API}/about`, { headers: authHeader(accessToken), query: { fields: 'user' } })
        return true
      } catch { return false }
    }
  }
}
