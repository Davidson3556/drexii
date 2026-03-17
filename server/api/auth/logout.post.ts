export default defineEventHandler((event) => {
  deleteCookie(event, 'drexii_session', { path: '/' })
  return { success: true }
})
