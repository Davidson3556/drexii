import { defineEventHandler } from 'h3'
import { getIntegrationStatus, getAvailableTools } from '../lib/integrations'

export default defineEventHandler(() => {
  const integrations = getIntegrationStatus()
  const tools = getAvailableTools()

  return {
    integrations,
    connectedCount: integrations.filter(i => i.connected).length,
    totalTools: tools.length,
    tools: tools.map(t => ({ name: t.name, description: t.description }))
  }
})
