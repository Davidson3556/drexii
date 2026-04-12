# Drexii — Product Requirements Document

## Overview

Drexii is a live AI agent platform that connects Gmail, Slack, Notion, Jira, Linear, Asana, Google Calendar, Google Drive, Discord, Zendesk, and Salesforce into a single chat interface. It uses multi-model AI routing (Claude, DeepSeek, Gemini via InsForge), chained automations, persistent memory, voice I/O, and a confirm-before-act safety layer. Built with Nuxt 4 / Node.js.

---

## Core Logic Modules to Test

### 1. Prompt Injection Sanitizer (`server/lib/sanitize.ts`)

**`sanitizeToolOutput(content: string): string`**
- Scans external tool output for 9 known prompt injection patterns
- Replaces matches with `[FILTERED]`
- Patterns include: "ignore previous instructions", "you are now a", "system:", "[TOOL_CALL:", "[MEMORY:", "override your system prompt", "pretend you are", etc.
- Must be case-insensitive
- Must handle empty strings, null-like inputs, and multiple patterns in one string

**`wrapToolContext(toolName: string, content: string): string`**
- Sanitizes content first, then wraps in `<tool_context source="toolName">` XML tags
- The toolName is used as an XML attribute value

---

### 2. AI Task Classifier (`server/lib/models/model-router.ts`)

**`classifyTask(messages: MessagePayload[]): TaskComplexity`**

Returns one of: `'lite' | 'standard' | 'heavy' | 'code'`

Rules (in priority order):
1. If last message is missing or not from user → return `'heavy'`
2. If word count > 80 → return `'heavy'`
3. If thread depth (message count) > 14 → return `'heavy'`
4. If text contains code keywords (`code`, `script`, `function`, `debug`, `sql`, `typescript`, etc.) → return `'code'`
5. If text contains heavy keywords (`analyze`, `compare`, `research`, `architecture`, `strategy`, etc.) → return `'heavy'`
6. If text contains standard keywords (`write`, `draft`, `plan`, `create`, `email`, `document`, etc.) → return `'standard'`
7. If text starts with lite starters (`what is`, `hi`, `hello`, `yes`, `ok`, etc.) AND word count ≤ 25 → return `'lite'`
8. If word count ≤ 10 → return `'lite'`
9. Default → return `'standard'`

---

### 3. Tool Schema Translator (`server/lib/models/schema-translator.ts`)

**`toAnthropicTools(schemas: ToolSchema[]): AnthropicTool[]`**
- Converts internal ToolSchema format to Anthropic SDK format
- Output must have: `name`, `description`, `input_schema.type = 'object'`, `input_schema.properties`, `input_schema.required`

**`toGeminiTools(schemas: ToolSchema[]): { functionDeclarations: GeminiToolDeclaration[] }`**
- Converts internal ToolSchema format to Google Generative AI format
- Output must have `functionDeclarations` array with: `name`, `description`, `parameters.type = 'object'`, `parameters.properties`, `parameters.required`

---

### 4. Tool Call Parser (`server/lib/utils/parse-tool-calls.ts`)

**`parseToolCalls(text: string): Array<{ name: string, args: Record<string, unknown> }>`**
- Extracts `[TOOL_CALL: toolName({"key": "value"})]` patterns from AI response text
- Primary parser: JSON.parse on the args string
- Fallback parser: splits on commas and colons for simple `key: value` pairs
- Skips and warns on completely unparseable tool calls
- Handles multiple tool calls in one string
- Handles tool calls embedded in surrounding text

---

### 5. Chain Condition Evaluator (`server/lib/agent-runner.ts`)

**`evaluateChainCondition(condition: string | null, output: string, status: 'success' | 'error'): boolean`**

Evaluates plain-English automation chain conditions:
- `null` or `'always'` → always returns `true`
- `'success'` → returns `true` only if status === 'success'
- `'failure'` or `'error'` → returns `true` only if status === 'error'
- `'output contains X'` → returns `true` if output includes X (case-insensitive)
- `'output includes X'` → same as above
- Unknown conditions → returns `true` (default)

---

### 6. Memory Prompt Formatter (`server/lib/memory.ts`)

**`formatMemoriesForPrompt(mems: Array<{ category: string, content: string }>): string`**
- Empty array → returns empty string `''`
- Non-empty array → returns string wrapped in `<memory_context>` XML tags
- Each memory formatted as `- [category] content`
- Result includes instruction text warning that content inside tags is untrusted
- Categories include: `fact`, `preference`, `context`

---

## Expected Behaviors & Edge Cases

- All sanitizer functions must handle empty strings without throwing
- classifyTask must handle empty message arrays
- parseToolCalls must handle text with no tool calls (returns empty array)
- parseToolCalls must handle malformed JSON args gracefully (no throw)
- Schema translators must handle empty arrays
- Schema translators must handle schemas with no `required` field
- formatMemoriesForPrompt must handle memories with special characters in content
- evaluateChainCondition must be case-insensitive for condition strings
