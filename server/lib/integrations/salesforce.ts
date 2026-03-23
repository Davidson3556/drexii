import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

interface SalesforceAuth {
  accessToken: string
  instanceUrl: string
  expiresAt: number
}

interface SalesforceCreds {
  loginUrl: string
  clientId: string
  clientSecret: string
}

const authCache = new Map<string, SalesforceAuth>()

async function authenticate(creds: SalesforceCreds): Promise<SalesforceAuth> {
  const cacheKey = `${creds.clientId}`
  const cached = authCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return cached
  }

  const data = await $fetch<{ access_token: string, instance_url: string }>(`${creds.loginUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: creds.clientId,
      client_secret: creds.clientSecret
    }).toString()
  })

  const auth: SalesforceAuth = {
    accessToken: data.access_token,
    instanceUrl: data.instance_url,
    expiresAt: Date.now() + 7200_000
  }

  authCache.set(cacheKey, auth)
  return auth
}

async function sfSearch(creds: SalesforceCreds, query: string): Promise<ToolResult> {
  try {
    const auth = await authenticate(creds)
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

async function sfGetRecord(creds: SalesforceCreds, objectType: string, recordId: string): Promise<ToolResult> {
  try {
    const auth = await authenticate(creds)
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

async function sfCreateRecord(creds: SalesforceCreds, objectType: string, fields: Record<string, unknown>): Promise<ToolResult> {
  try {
    const auth = await authenticate(creds)
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

const salesforceTools: ToolSchema[] = [
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
]

export function createSalesforceAdapter(creds: SalesforceCreds): IntegrationAdapter {
  return {
    name: 'salesforce',
    isConfigured: () => true,
    tools: salesforceTools,

    async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
      switch (toolName) {
        case 'salesforce_search':
          return sfSearch(creds, args.query as string)
        case 'salesforce_get_record':
          return sfGetRecord(creds, args.object_type as string, args.record_id as string)
        case 'salesforce_create_record':
          return sfCreateRecord(creds, args.object_type as string, args.fields as Record<string, unknown>)
        default:
          return { toolCallId: toolName, content: `Unknown Salesforce tool: ${toolName}`, isError: true }
      }
    },

    async healthCheck(): Promise<boolean> {
      try {
        await authenticate(creds)
        return true
      } catch {
        return false
      }
    }
  }
}

// Default adapter using env vars (backward compatible)
function getEnvConfig(): SalesforceCreds | undefined {
  const loginUrl = process.env.SALESFORCE_LOGIN_URL || useRuntimeConfig().salesforceLoginUrl as string | undefined
  const clientId = process.env.SALESFORCE_CLIENT_ID || useRuntimeConfig().salesforceClientId as string | undefined
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET || useRuntimeConfig().salesforceClientSecret as string | undefined
  if (!loginUrl || !clientId || !clientSecret) return undefined
  return { loginUrl, clientId, clientSecret }
}

export const salesforce: IntegrationAdapter = {
  name: 'salesforce',
  isConfigured: () => !!getEnvConfig(),
  tools: salesforceTools,

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    const config = getEnvConfig()
    if (!config) return { toolCallId: toolName, content: 'Salesforce is not configured', isError: true }
    return createSalesforceAdapter(config).execute(toolName, args)
  },

  async healthCheck(): Promise<boolean> {
    const config = getEnvConfig()
    if (!config) return false
    return createSalesforceAdapter(config).healthCheck()
  }
}
