const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /disregard\s+(all\s+)?(prior|previous|above)/gi,
  /you\s+are\s+now\s+(a|an)\s+/gi,
  /system\s*:\s*/gi,
  /\[TOOL_CALL:/gi,
  /\[MEMORY:/gi,
  /override\s+(your|the)\s+(system|base)\s+prompt/gi,
  /pretend\s+(you\s+are|to\s+be)/gi
]

export function sanitizeToolOutput(content: string): string {
  let sanitized = content
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[FILTERED]')
  }
  return sanitized
}

export function wrapToolContext(toolName: string, content: string): string {
  const sanitized = sanitizeToolOutput(content)
  return `<tool_context source="${toolName}">\n${sanitized}\n</tool_context>`
}
