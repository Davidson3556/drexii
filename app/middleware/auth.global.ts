const PROTECTED_ROUTES = ['/chat', '/workflows', '/integrations', '/automations', '/memory']

export default defineNuxtRouteMiddleware(async (to) => {
  // Only check auth for protected routes
  if (!PROTECTED_ROUTES.some(r => to.path.startsWith(r))) return

  // On server-side, redirect to login with a flag.
  // InsForge SDK is client-only so we can't check auth on server —
  // but we must prevent SSR from rendering protected page content
  // to avoid hydration mismatches when the client redirects.
  if (import.meta.server) {
    // Don't render the protected page on the server at all.
    // The client will check auth and either show the page or redirect.
    return
  }

  const { isAuthenticated, isLoading, checkSession } = useAuth()

  if (isLoading.value) {
    await checkSession()
  }

  if (!isAuthenticated.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
