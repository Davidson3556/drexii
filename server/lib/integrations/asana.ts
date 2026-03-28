import type { ToolSchema, ToolResult } from '../../../shared/types'
import type { IntegrationAdapter } from './index'

const ASANA_API = 'https://app.asana.com/api/1.0'

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' }
}

async function searchTasks(token: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const query = args.query as string
    if (!query) return { toolCallId: 'asana_search_tasks', content: 'query is required', isError: true }

    const data = await $fetch<{ data?: Array<Record<string, unknown>> }>(`${ASANA_API}/tasks`, {
      headers: authHeader(token),
      query: { opt_fields: 'name,completed,assignee.name,due_on,projects.name', limit: 10 }
    })

    if (!data.data?.length) return { toolCallId: 'asana_search_tasks', content: `No tasks found.` }

    const filtered = data.data.filter(t =>
      String(t.name).toLowerCase().includes(query.toLowerCase())
    )

    if (!filtered.length) return { toolCallId: 'asana_search_tasks', content: `No tasks matching "${query}".` }

    const lines = filtered.map((t) => {
      const assignee = (t.assignee as Record<string, string>)?.name || 'Unassigned'
      return `- ${t.name} | ${t.completed ? 'Done' : 'Open'} | Assignee: ${assignee} | Due: ${t.due_on || 'None'} | GID: ${t.gid}`
    }).join('\n')

    return { toolCallId: 'asana_search_tasks', content: `Tasks:\n${lines}` }
  } catch (e) {
    return { toolCallId: 'asana_search_tasks', content: `Search failed: ${(e as Error).message}`, isError: true }
  }
}

async function getTask(token: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const taskId = args.task_id as string
    if (!taskId) return { toolCallId: 'asana_get_task', content: 'task_id is required', isError: true }

    const data = await $fetch<{ data: Record<string, unknown> }>(`${ASANA_API}/tasks/${taskId}`, {
      headers: authHeader(token),
      query: { opt_fields: 'name,notes,completed,assignee.name,due_on,projects.name,memberships.section.name' }
    })

    const t = data.data
    const assignee = (t.assignee as Record<string, string>)?.name || 'Unassigned'
    const projects = (t.projects as Array<Record<string, string>>)?.map(p => p.name).join(', ') || 'None'

    return {
      toolCallId: 'asana_get_task',
      content: `Task: ${t.name}\nStatus: ${t.completed ? 'Completed' : 'Open'}\nAssignee: ${assignee}\nDue: ${t.due_on || 'None'}\nProjects: ${projects}\nNotes: ${t.notes || 'None'}`
    }
  } catch (e) {
    return { toolCallId: 'asana_get_task', content: `Failed to get task: ${(e as Error).message}`, isError: true }
  }
}

async function createTask(token: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { name, notes, project_id, due_on, assignee_email } = args as Record<string, string>
    if (!name || !project_id) return { toolCallId: 'asana_create_task', content: 'name and project_id are required', isError: true }

    const body: Record<string, unknown> = {
      data: {
        name,
        projects: [project_id],
        ...(notes && { notes }),
        ...(due_on && { due_on }),
        ...(assignee_email && { assignee: assignee_email })
      }
    }

    const data = await $fetch<{ data: { gid: string, name: string, permalink_url: string } }>(`${ASANA_API}/tasks`, {
      method: 'POST',
      headers: authHeader(token),
      body
    })

    return {
      toolCallId: 'asana_create_task',
      content: `Task created: "${data.data.name}" — ${data.data.permalink_url}`
    }
  } catch (e) {
    return { toolCallId: 'asana_create_task', content: `Failed to create task: ${(e as Error).message}`, isError: true }
  }
}

async function updateTask(token: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { task_id, name, notes, due_on } = args as Record<string, string>
    if (!task_id) return { toolCallId: 'asana_update_task', content: 'task_id is required', isError: true }

    const updates: Record<string, unknown> = {}
    if (name) updates.name = name
    if (notes) updates.notes = notes
    if (due_on) updates.due_on = due_on

    await $fetch(`${ASANA_API}/tasks/${task_id}`, {
      method: 'PUT',
      headers: authHeader(token),
      body: { data: updates }
    })

    return { toolCallId: 'asana_update_task', content: `Task ${task_id} updated.` }
  } catch (e) {
    return { toolCallId: 'asana_update_task', content: `Failed to update task: ${(e as Error).message}`, isError: true }
  }
}

async function completeTask(token: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const taskId = args.task_id as string
    if (!taskId) return { toolCallId: 'asana_complete_task', content: 'task_id is required', isError: true }

    await $fetch(`${ASANA_API}/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeader(token),
      body: { data: { completed: true } }
    })

    return { toolCallId: 'asana_complete_task', content: `Task ${taskId} marked as complete.` }
  } catch (e) {
    return { toolCallId: 'asana_complete_task', content: `Failed to complete task: ${(e as Error).message}`, isError: true }
  }
}

const tools: ToolSchema[] = [
  {
    name: 'asana_search_tasks',
    description: 'Search Asana tasks by keyword',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search term' } },
      required: ['query']
    }
  },
  {
    name: 'asana_get_task',
    description: 'Get full details of an Asana task',
    parameters: {
      type: 'object',
      properties: { task_id: { type: 'string', description: 'Asana task GID' } },
      required: ['task_id']
    }
  },
  {
    name: 'asana_create_task',
    description: 'Create a new Asana task in a project',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Task name' },
        project_id: { type: 'string', description: 'Project GID to add the task to' },
        notes: { type: 'string', description: 'Task description (optional)' },
        due_on: { type: 'string', description: 'Due date YYYY-MM-DD (optional)' },
        assignee_email: { type: 'string', description: 'Assignee email address (optional)' }
      },
      required: ['name', 'project_id']
    }
  },
  {
    name: 'asana_update_task',
    description: 'Update an existing Asana task',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task GID' },
        name: { type: 'string', description: 'New name (optional)' },
        notes: { type: 'string', description: 'New description (optional)' },
        due_on: { type: 'string', description: 'New due date YYYY-MM-DD (optional)' }
      },
      required: ['task_id']
    }
  },
  {
    name: 'asana_complete_task',
    description: 'Mark an Asana task as complete',
    parameters: {
      type: 'object',
      properties: { task_id: { type: 'string', description: 'Task GID to complete' } },
      required: ['task_id']
    }
  }
]

export const ASANA_WRITE_TOOLS = new Set(['asana_create_task', 'asana_update_task', 'asana_complete_task'])

export function createAsanaAdapter(token: string): IntegrationAdapter {
  return {
    name: 'asana',
    isConfigured: () => !!token,
    tools,
    async execute(toolName, args) {
      switch (toolName) {
        case 'asana_search_tasks': return searchTasks(token, args)
        case 'asana_get_task': return getTask(token, args)
        case 'asana_create_task': return createTask(token, args)
        case 'asana_update_task': return updateTask(token, args)
        case 'asana_complete_task': return completeTask(token, args)
        default: return { toolCallId: toolName, content: `Unknown tool: ${toolName}`, isError: true }
      }
    },
    async healthCheck() {
      try {
        await $fetch(`${ASANA_API}/users/me`, { headers: authHeader(token) })
        return true
      } catch { return false }
    }
  }
}
