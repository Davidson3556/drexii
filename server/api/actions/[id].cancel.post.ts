import { defineEventHandler, createError } from 'h3'
import { cancelAction } from '../../lib/actions'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Action ID is required' })
  }

  await cancelAction(id)
  return { success: true }
})
