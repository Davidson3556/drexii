const PROTECTED_ROUTES = ['/chat', '/workflows']

export default defineNuxtRouteMiddleware(async (to) => {
  if (!PROTECTED_ROUTES.some(r => to.path.startsWith(r))) return

  try {
    const { authenticated } = await $fetch<{ authenticated: boolean }>('/api/auth/check')
    if (!authenticated) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
  } catch {
    return navigateTo('/login')
  }
})
