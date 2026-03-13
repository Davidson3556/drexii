import { defineEventHandler } from 'h3'
import { getPendingActions } from '../../lib/actions'

export default defineEventHandler(async () => {
  const pending = await getPendingActions()
  return { actions: pending }
})
