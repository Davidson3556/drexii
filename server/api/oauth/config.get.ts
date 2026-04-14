/**
 * Returns which OAuth providers are configured on this server.
 * The frontend uses this to decide whether to show the OAuth button
 * or fall back to the manual credential form.
 */
export default defineEventHandler(() => {
  return {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    slack: !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET)
  }
})
