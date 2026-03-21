// Sign-out is now handled client-side via InsForge SDK (insforge.auth.signOut()).
// This endpoint is kept as a no-op stub for backward compatibility.
export default defineEventHandler(() => {
  return { success: true }
})
