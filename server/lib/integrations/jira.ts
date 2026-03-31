import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

interface JiraConfig {
  subdomain: string
  email: string
  token: string
}

function authHeader(config: JiraConfig) {
  const encoded = Buffer.from(`${config.email}:${config.token}`).toString('base64')
  return { Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json', Accept: 'application/json' }
}

function base(config: JiraConfig) {
  return `https://${config.subdomain}.atlassian.net/rest/api/3`
}

async function searchIssues(config: JiraConfig, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const query = args.query as string
    if (!query) return { toolCallId: 'jira_search', content: 'query is required', isError: true }
    const maxResults = Math.min(Number(args.max_results) || 10, 25)

    const jql = `text ~ "${query.replace(/"/g, '\\"')}" ORDER BY updated DESC`
    const data = await $fetch<{ issues?: Array<Record<string, unknown>> }>(`${base(config)}/search`, {
      headers: authHeader(config),
      query: { jql, maxResults, fields: 'summary,status,assignee,priority,issuetype' }
    })

    if (!data.issues?.length) return { toolCallId: 'jira_search', content: `No issues found for "${query}".` }

    const lines = data.issues.map((i) => {
      const f = i.fields as Record<string, Record<string, string>>
      return `- [${i.key}] ${f.summary} | Status: ${f.status?.name} | Assignee: ${f.assignee?.displayName || 'Unassigned'}`
    }).join('\n')

    return { toolCallId: 'jira_search', content: `Jira issues:\n${lines}` }
  } catch (e) {
    return { toolCallId: 'jira_search', content: `Search failed: ${(e as Error).message}`, isError: true }
  }
}

async function getIssue(config: JiraConfig, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const key = args.issue_key as string
    if (!key) return { toolCallId: 'jira_get_issue', content: 'issue_key is required', isError: true }

    const issue = await $fetch<Record<string, unknown>>(`${base(config)}/issue/${key}`, { headers: authHeader(config) })
    const f = issue.fields as Record<string, Record<string, string>>

    return {
      toolCallId: 'jira_get_issue',
      content: `Issue: ${issue.key} — ${f.summary}\nStatus: ${f.status?.name}\nPriority: ${f.priority?.name}\nAssignee: ${f.assignee?.displayName || 'Unassigned'}\nDescription: ${(f.description as unknown as { content?: unknown[] })?.content ? '[rich content]' : 'None'}`
    }
  } catch (e) {
    return { toolCallId: 'jira_get_issue', content: `Failed to get issue: ${(e as Error).message}`, isError: true }
  }
}

async function createIssue(config: JiraConfig, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { project_key, summary, description, issue_type, priority } = args as Record<string, string>
    if (!project_key || !summary) return { toolCallId: 'jira_create_issue', content: 'project_key and summary are required', isError: true }

    const body: Record<string, unknown> = {
      fields: {
        project: { key: project_key },
        summary,
        issuetype: { name: issue_type || 'Task' },
        ...(description && {
          description: {
            type: 'doc', version: 1,
            content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }]
          }
        }),
        ...(priority && { priority: { name: priority } })
      }
    }

    const result = await $fetch<{ key: string, self: string }>(`${base(config)}/issue`, {
      method: 'POST', headers: authHeader(config), body
    })

    return { toolCallId: 'jira_create_issue', content: `Issue created: ${result.key} — https://${config.subdomain}.atlassian.net/browse/${result.key}` }
  } catch (e) {
    return { toolCallId: 'jira_create_issue', content: `Failed to create issue: ${(e as Error).message}`, isError: true }
  }
}

async function addComment(config: JiraConfig, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { issue_key, comment } = args as Record<string, string>
    if (!issue_key || !comment) return { toolCallId: 'jira_add_comment', content: 'issue_key and comment are required', isError: true }

    await $fetch(`${base(config)}/issue/${issue_key}/comment`, {
      method: 'POST',
      headers: authHeader(config),
      body: {
        body: {
          type: 'doc', version: 1,
          content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }]
        }
      }
    })

    return { toolCallId: 'jira_add_comment', content: `Comment added to ${issue_key}.` }
  } catch (e) {
    return { toolCallId: 'jira_add_comment', content: `Failed to add comment: ${(e as Error).message}`, isError: true }
  }
}

const tools: ToolSchema[] = [
  {
    name: 'jira_search',
    description: 'Search Jira issues by keyword',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keyword or phrase' },
        max_results: { type: 'number', description: 'Max results (default 10)' }
      },
      required: ['query']
    }
  },
  {
    name: 'jira_get_issue',
    description: 'Get full details of a Jira issue',
    parameters: {
      type: 'object',
      properties: { issue_key: { type: 'string', description: 'Issue key e.g. PROJ-123' } },
      required: ['issue_key']
    }
  },
  {
    name: 'jira_create_issue',
    description: 'Create a new Jira issue',
    parameters: {
      type: 'object',
      properties: {
        project_key: { type: 'string', description: 'Jira project key e.g. PROJ' },
        summary: { type: 'string', description: 'Issue title/summary' },
        description: { type: 'string', description: 'Issue description (optional)' },
        issue_type: { type: 'string', description: 'Type: Task, Bug, Story (default: Task)' },
        priority: { type: 'string', description: 'Priority: Highest, High, Medium, Low (optional)' }
      },
      required: ['project_key', 'summary']
    }
  },
  {
    name: 'jira_add_comment',
    description: 'Add a comment to a Jira issue',
    parameters: {
      type: 'object',
      properties: {
        issue_key: { type: 'string', description: 'Issue key e.g. PROJ-123' },
        comment: { type: 'string', description: 'Comment text' }
      },
      required: ['issue_key', 'comment']
    }
  }
]

export const JIRA_WRITE_TOOLS = new Set(['jira_create_issue', 'jira_add_comment'])

export function createJiraAdapter(config: JiraConfig): IntegrationAdapter {
  return {
    name: 'jira',
    isConfigured: () => !!(config.subdomain && config.email && config.token),
    tools,
    async execute(toolName, args) {
      switch (toolName) {
        case 'jira_search': return searchIssues(config, args)
        case 'jira_get_issue': return getIssue(config, args)
        case 'jira_create_issue': return createIssue(config, args)
        case 'jira_add_comment': return addComment(config, args)
        default: return { toolCallId: toolName, content: `Unknown tool: ${toolName}`, isError: true }
      }
    },
    async healthCheck() {
      try {
        await $fetch(`${base(config)}/myself`, { headers: authHeader(config) })
        return true
      } catch (e) {
        console.error('[Jira] Health check failed:', (e as Error).message)
        return false
      }
    }
  }
}
