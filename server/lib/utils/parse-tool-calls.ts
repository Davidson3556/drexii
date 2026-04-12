/**
 * Parses [TOOL_CALL: name({...})] syntax from AI response text.
 * Tries JSON.parse first, then falls back to a simple key:value splitter.
 * Returns an empty array if no valid tool calls are found.
 */
export function parseToolCalls(text: string): Array<{ name: string, args: Record<string, unknown> }> {
  const regex = /\[TOOL_CALL:\s*(\w+)\(([\s\S]*?)\)\]/g
  const calls: Array<{ name: string, args: Record<string, unknown> }> = []
  let match = regex.exec(text)

  while (match) {
    try {
      const args = JSON.parse(match[2]!)
      calls.push({ name: match[1]!, args })
    } catch {
      try {
        const simpleArgs: Record<string, unknown> = {}
        match[2]!.split(',').forEach((pair) => {
          const [key, ...rest] = pair.split(':')
          if (key && rest.length) {
            simpleArgs[key.trim().replace(/"/g, '')] = rest.join(':').trim().replace(/^"|"$/g, '')
          }
        })
        calls.push({ name: match[1]!, args: simpleArgs })
      } catch {
        console.warn(`[ToolCall] Failed to parse args for tool "${match[1]}" — skipping`)
      }
    }
    match = regex.exec(text)
  }

  return calls
}
