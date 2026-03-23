const PROTECTED_ROUTES = ['/chat', '/workflows', '/integrations']

export default defineNuxtRouteMiddleware(async (to) => {
  // InsForge SDK is client-only — skip auth check on server side
  if (import.meta.server) return

  if (!PROTECTED_ROUTES.some(r => to.path.startsWith(r))) return

  const { isAuthenticated, isLoading, checkSession } = useAuth()

  if (isLoading.value) {
    await checkSession()
  }

  if (!isAuthenticated.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
