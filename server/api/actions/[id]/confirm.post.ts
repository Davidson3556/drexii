import { defineEventHandler, createError } from 'h3'
import { confirmAction } from '../../../lib/actions'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Action ID is required' })
  }

  const result = await confirmAction(id)

  if (result.isError) {
    throw createError({ statusCode: 400, message: result.content })
  }

  return { success: true, result: result.content }
})
