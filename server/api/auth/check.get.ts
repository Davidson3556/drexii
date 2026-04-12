// Auth session validation via InsForge SDK.
// Returns the current user if a valid session exists.
import { useInsforge } from '../../lib/insforge-client'

export default defineEventHandler(async () => {
  try {
    const insforge = useInsforge()
    const { data, error } = await insforge.auth.getCurrentUser()

    if (error || !data?.user) {
      return { authenticated: false, provider: 'insforge', user: null }
    }

    return { authenticated: true, provider: 'insforge', user: data.user }
  } catch {
    return { authenticated: false, provider: 'insforge', user: null }
  }
})
