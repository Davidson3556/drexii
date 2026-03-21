// Auth check is now handled client-side via InsForge SDK.
// This endpoint is kept as a lightweight server-side fallback
// for any API routes that need to verify the session exists.
export default defineEventHandler(() => {
  return { authenticated: true, provider: 'insforge' }
})
