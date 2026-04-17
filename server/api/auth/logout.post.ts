// Sign-out is handled client-side via InsForge SDK (insforge.auth.signOut()).
// This endpoint clears the session cookie and returns ok for API clients.
export default defineEventHandler((event) => {
  deleteCookie(event, 'drexii_session', { path: '/' })
  return { ok: true }
})
