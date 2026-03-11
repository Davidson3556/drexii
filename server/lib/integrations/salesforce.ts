import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

interface SalesforceAuth {
  accessToken: string
  instanceUrl: string
  expiresAt: number
}

let cachedAuth: SalesforceAuth | null = null

function getConfig(): { loginUrl: string, clientId: string, clientSecret: string } | undefined {
  const loginUrl = process.env.SALESFORCE_LOGIN_URL || useRuntimeConfig().salesforceLoginUrl
  const clientId = process.env.SALESFORCE_CLIENT_ID || useRuntimeConfig().salesforceClientId
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET || useRuntimeConfig().salesforceClientSecret
  if (!loginUrl || !clientId || !clientSecret) return undefined
  return { loginUrl, clientId, clientSecret }
}

async function authenticate(): Promise<SalesforceAuth> {
  if (cachedAuth && Date.now() < cachedAuth.expiresAt) {
    return cachedAuth
  }

  const config = getConfig()
  if (!config) throw new Error('Salesforce is not configured')

  const data = await $fetch<{ access_token: string, instance_url: string }>(`${config.loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret
    }).toString()
  })

  cachedAuth = {
    accessToken: data.access_token,
    instanceUrl: data.instance_url,
    expiresAt: Date.now() + 7200_000
  }

  return cachedAuth
}

async function sfSearch(query: string): Promise<ToolResult> {
  try {
    const auth = await authenticate()
    const escapedQuery = query.replace(/[^a-zA-Z0-9 ]/g, '')

    const data = await $fetch<{ searchRecords: Array<{ Id: string, attributes: { type: string }, Name?: string }> }>(`${auth.instanceUrl}/services/data/v59.0/search/`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      params: { q: `FIND {${escapedQuery}} IN ALL FIELDS RETURNING Account(Id,Name), Contact(Id,Name,Email), Lead(Id,Name,Company), Opportunity(Id,Name,StageName,Amount)` }
    })

    const results = data.searchRecords.map(r => ({
      id: r.Id,
      type: r.attributes.type,
      name: r.Name || 'Unknown',
      ...r
    }))

    return {
      toolCallId: 'salesforce_search',
      content: JSON.stringify({ results: results.slice(0, 20), count: results.length })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'salesforce_search',
      content: `Error searching Salesforce: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function sfGetRecord(objectType: string, recordId: string): Promise<ToolResult> {
  try {
    const auth = await authenticate()
    const data = await $fetch<Record<string, unknown>>(`${auth.instanceUrl}/services/data/v59.0/sobjects/${objectType}/${recordId}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` }
    })

    return {
      toolCallId: 'salesforce_get_record',
      content: JSON.stringify(data)
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'salesforce_get_record',
      content: `Error fetching Salesforce record: ${(error as Error).message}`,
      isError: true
    }
  }
}

async function sfCreateRecord(objectType: string, fields: Record<string, unknown>): Promise<ToolResult> {
  try {
    const auth = await authenticate()
    const data = await $fetch<{ id: string, success: boolean }>(`${auth.instanceUrl}/services/data/v59.0/sobjects/${objectType}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: fields
    })

    return {
      toolCallId: 'salesforce_create_record',
      content: JSON.stringify({ id: data.id, success: data.success, objectType })
    }
  } catch (error: unknown) {
    return {
      toolCallId: 'salesforce_create_record',
      content: `Error creating Salesforce record: ${(error as Error).message}`,
      isError: true
    }
  }
}

export const salesforce: IntegrationAdapter = {
  name: 'salesforce',
  isConfigured: () => !!getConfig(),

  tools: [
    {
      name: 'salesforce_search',
      description: 'Search Salesforce across Accounts, Contacts, Leads, and Opportunities using a keyword query',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query text' }
        },
        required: ['query']
      }
    },
    {
      name: 'salesforce_get_record',
      description: 'Get a specific Salesforce record by object type and ID',
      parameters: {
        type: 'object',
        properties: {
          object_type: { type: 'string', description: 'Salesforce object type: Account, Contact, Lead, Opportunity, Case, etc.' },
          record_id: { type: 'string', description: 'The Salesforce record ID' }
        },
        required: ['object_type', 'record_id']
      }
    },
    {
      name: 'salesforce_create_record',
      description: 'Create a new Salesforce record (Account, Contact, Lead, Opportunity, etc.)',
      parameters: {
        type: 'object',
        properties: {
          object_type: { type: 'string', description: 'Salesforce object type to create' },
          fields: { type: 'object', description: 'Field values for the new record (e.g. { "Name": "Acme Corp", "Industry": "Tech" })' }
        },
        required: ['object_type', 'fields']
      }
    }
  ] as ToolSchema[],

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    switch (toolName) {
      case 'salesforce_search':
        return sfSearch(args.query as string)
      case 'salesforce_get_record':
        return sfGetRecord(args.object_type as string, args.record_id as string)
      case 'salesforce_create_record':
        return sfCreateRecord(args.object_type as string, args.fields as Record<string, unknown>)
      default:
        return { toolCallId: toolName, content: `Unknown Salesforce tool: ${toolName}`, isError: true }
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      await authenticate()
      return true
    } catch {
      return false
    }
  }
}
