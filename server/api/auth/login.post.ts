// Auth sign-in is now handled client-side via InsForge SDK.
// This endpoint is kept as a no-op stub for backward compatibility.
export default defineEventHandler(() => {
  return { success: true, provider: 'insforge' }
})
