import { confirmAction } from '../../../lib/actions'
import { getUserAdapters } from '../../../lib/user-integrations'
import { getConfiguredAdapters } from '../../../lib/integrations'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Action ID is required' })
  }

  const userId = getHeader(event, 'x-user-id')
  let adapters = userId ? await getUserAdapters(userId) : []
  if (adapters.length === 0) adapters = getConfiguredAdapters()

  const result = await confirmAction(id, adapters)

  return { success: !result.isError, result: result.content }
})
