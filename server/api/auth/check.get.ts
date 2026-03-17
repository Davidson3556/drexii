const SESSION_TOKEN = 'drexii_admin_v1'

export default defineEventHandler((event) => {
  const session = getCookie(event, 'drexii_session')
  return { authenticated: session === SESSION_TOKEN }
})
