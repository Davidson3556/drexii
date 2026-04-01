import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

const LINEAR_API = 'https://api.linear.app/graphql'

function authHeader(apiKey: string) {
  return { 'Authorization': apiKey, 'Content-Type': 'application/json' }
}

async function gql<T>(apiKey: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const data = await $fetch<{ data: T, errors?: Array<{ message: string }> }>(LINEAR_API, {
    method: 'POST',
    headers: authHeader(apiKey),
    body: { query, variables }
  })
  if (data.errors?.length) throw new Error(data.errors[0]?.message ?? 'GraphQL error')
  return data.data
}

async function searchIssues(apiKey: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const query = args.query as string
    if (!query) return { toolCallId: 'linear_search', content: 'query is required', isError: true }

    const data = await gql<{ issues: { nodes: Array<Record<string, unknown>> } }>(apiKey, `
      query($filter: IssueFilter) {
        issues(filter: $filter, first: 10, orderBy: updatedAt) {
          nodes { id identifier title state { name } assignee { name } priority labels { nodes { name } } }
        }
      }
    `, {
      filter: {
        or: [
          { title: { containsIgnoreCase: query } },
          { description: { containsIgnoreCase: query } }
        ]
      }
    })

    const issues = data.issues.nodes
    if (!issues.length) return { toolCallId: 'linear_search', content: `No Linear issues found for "${query}".` }

    const lines = issues.map((i) => {
      const state = (i.state as Record<string, string>)?.name
      const assignee = (i.assignee as Record<string, string>)?.name || 'Unassigned'
      const labels = (i.labels as { nodes: Array<{ name: string }> })?.nodes?.map(l => l.name).join(', ')
      return `- [${i.identifier}] ${i.title} | State: ${state} | Assignee: ${assignee}${labels ? ` | Labels: ${labels}` : ''} | ID: ${i.id}`
    }).join('\n')

    return { toolCallId: 'linear_search', content: `Linear issues:\n${lines}` }
  } catch (e) {
    return { toolCallId: 'linear_search', content: `Search failed: ${(e as Error).message}`, isError: true }
  }
}

async function getIssue(apiKey: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const issueId = args.issue_id as string
    if (!issueId) return { toolCallId: 'linear_get_issue', content: 'issue_id is required', isError: true }

    const data = await gql<{ issue: Record<string, unknown> }>(apiKey, `
      query($id: String!) {
        issue(id: $id) {
          identifier title description state { name } assignee { name } priority
          team { name } createdAt updatedAt url
        }
      }
    `, { id: issueId })

    const i = data.issue
    const state = (i.state as Record<string, string>)?.name
    const assignee = (i.assignee as Record<string, string>)?.name || 'Unassigned'
    const team = (i.team as Record<string, string>)?.name

    return {
      toolCallId: 'linear_get_issue',
      content: `Issue: [${i.identifier}] ${i.title}\nState: ${state}\nTeam: ${team}\nAssignee: ${assignee}\nPriority: ${i.priority}\nDescription: ${i.description || 'None'}\nURL: ${i.url}`
    }
  } catch (e) {
    return { toolCallId: 'linear_get_issue', content: `Failed to get issue: ${(e as Error).message}`, isError: true }
  }
}

async function createIssue(apiKey: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { title, description, team_id, priority } = args as Record<string, string>
    if (!title || !team_id) return { toolCallId: 'linear_create_issue', content: 'title and team_id are required', isError: true }

    const priorityMap: Record<string, number> = { urgent: 1, high: 2, medium: 3, low: 4 }
    const priorityNum = priority ? (priorityMap[priority.toLowerCase()] ?? 0) : 0

    const data = await gql<{ issueCreate: { issue: { identifier: string, url: string } } }>(apiKey, `
      mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          issue { identifier url }
        }
      }
    `, { input: { title, description, teamId: team_id, priority: priorityNum } })

    const issue = data.issueCreate.issue
    return { toolCallId: 'linear_create_issue', content: `Issue created: [${issue.identifier}] — ${issue.url}` }
  } catch (e) {
    return { toolCallId: 'linear_create_issue', content: `Failed to create issue: ${(e as Error).message}`, isError: true }
  }
}

async function addComment(apiKey: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { issue_id, comment } = args as Record<string, string>
    if (!issue_id || !comment) return { toolCallId: 'linear_add_comment', content: 'issue_id and comment are required', isError: true }

    await gql(apiKey, `
      mutation($input: CommentCreateInput!) {
        commentCreate(input: $input) { comment { id } }
      }
    `, { input: { issueId: issue_id, body: comment } })

    return { toolCallId: 'linear_add_comment', content: `Comment added to issue ${issue_id}.` }
  } catch (e) {
    return { toolCallId: 'linear_add_comment', content: `Failed to add comment: ${(e as Error).message}`, isError: true }
  }
}

async function listMyIssues(apiKey: string): Promise<ToolResult> {
  try {
    const data = await gql<{ viewer: { assignedIssues: { nodes: Array<Record<string, unknown>> } } }>(apiKey, `
      query {
        viewer {
          assignedIssues(first: 15, filter: { state: { type: { nin: ["completed", "cancelled"] } } }) {
            nodes { identifier title state { name } priority team { name } url }
          }
        }
      }
    `)

    const issues = data.viewer.assignedIssues.nodes
    if (!issues.length) return { toolCallId: 'linear_my_issues', content: 'No open issues assigned to you.' }

    const lines = issues.map((i) => {
      const state = (i.state as Record<string, string>)?.name
      const team = (i.team as Record<string, string>)?.name
      return `- [${i.identifier}] ${i.title} | ${state} | ${team}`
    }).join('\n')

    return { toolCallId: 'linear_my_issues', content: `Your open issues:\n${lines}` }
  } catch (e) {
    return { toolCallId: 'linear_my_issues', content: `Failed to list issues: ${(e as Error).message}`, isError: true }
  }
}

const tools: ToolSchema[] = [
  {
    name: 'linear_search',
    description: 'Search Linear issues by keyword',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search term' } },
      required: ['query']
    }
  },
  {
    name: 'linear_get_issue',
    description: 'Get full details of a Linear issue',
    parameters: {
      type: 'object',
      properties: { issue_id: { type: 'string', description: 'Linear issue ID or identifier e.g. ENG-123' } },
      required: ['issue_id']
    }
  },
  {
    name: 'linear_create_issue',
    description: 'Create a new Linear issue',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Issue title' },
        team_id: { type: 'string', description: 'Team ID to create the issue in' },
        description: { type: 'string', description: 'Issue description (optional)' },
        priority: { type: 'string', description: 'urgent, high, medium, or low (optional)' }
      },
      required: ['title', 'team_id']
    }
  },
  {
    name: 'linear_add_comment',
    description: 'Add a comment to a Linear issue',
    parameters: {
      type: 'object',
      properties: {
        issue_id: { type: 'string', description: 'Linear issue ID' },
        comment: { type: 'string', description: 'Comment text' }
      },
      required: ['issue_id', 'comment']
    }
  },
  {
    name: 'linear_my_issues',
    description: 'List all open Linear issues assigned to the current user',
    parameters: { type: 'object', properties: {} }
  }
]

export const LINEAR_WRITE_TOOLS = new Set(['linear_create_issue', 'linear_add_comment'])

export function createLinearAdapter(apiKey: string): IntegrationAdapter {
  return {
    name: 'linear',
    isConfigured: () => !!apiKey,
    tools,
    async execute(toolName, args) {
      switch (toolName) {
        case 'linear_search': return searchIssues(apiKey, args)
        case 'linear_get_issue': return getIssue(apiKey, args)
        case 'linear_create_issue': return createIssue(apiKey, args)
        case 'linear_add_comment': return addComment(apiKey, args)
        case 'linear_my_issues': return listMyIssues(apiKey)
        default: return { toolCallId: toolName, content: `Unknown tool: ${toolName}`, isError: true }
      }
    },
    async healthCheck() {
      try {
        await gql(apiKey, `query { viewer { id } }`)
        return true
      } catch (e) {
        console.error('[Linear] Health check failed:', (e as Error).message)
        return false
      }
    }
  }
}
