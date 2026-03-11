import type { ToolSchema } from '../../../shared/types'

export interface AnthropicTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface GeminiToolDeclaration {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export function toAnthropicTools(schemas: ToolSchema[]): AnthropicTool[] {
  return schemas.map(schema => ({
    name: schema.name,
    description: schema.description,
    input_schema: {
      type: 'object' as const,
      properties: schema.parameters,
      required: schema.required
    }
  }))
}

export function toGeminiTools(schemas: ToolSchema[]): { functionDeclarations: GeminiToolDeclaration[] } {
  return {
    functionDeclarations: schemas.map(schema => ({
      name: schema.name,
      description: schema.description,
      parameters: {
        type: 'object' as const,
        properties: schema.parameters,
        required: schema.required
      }
    }))
  }
}
