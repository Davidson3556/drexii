import { defineEventHandler, readBody, createError, setResponseHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { useDB, schema } from '../../../db'
import * as modelRouter from '../../../lib/models/model-router'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Thread ID is required' })
  }

  const body = await readBody<{ content: string }>(event)
  if (!body?.content?.trim()) {
    throw createError({ statusCode: 400, message: 'Message content is required' })
  }

  const db = useDB()

  const [thread] = await db.select()
    .from(schema.threads)
    .where(eq(schema.threads.id, id))
    .limit(1)

  if (!thread) {
    throw createError({ statusCode: 404, message: 'Thread not found' })
  }

  await db.insert(schema.messages).values({
    threadId: id,
    role: 'user',
    content: body.content
  })

  const existingMessages = await db.select()
    .from(schema.messages)
    .where(eq(schema.messages.threadId, id))
    .orderBy(schema.messages.createdAt)

  const messagePayloads = existingMessages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  }))

  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  const encoder = new TextEncoder()
  const activeProvider = modelRouter.getActiveProvider()

  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = ''

      try {
        controller.enqueue(encoder.encode(`event: model_info\ndata: ${JSON.stringify({ provider: activeProvider })}\n\n`))

        const chatStream = modelRouter.streamChat(messagePayloads, {
          maxTokens: 1024,
          temperature: 0.3
        })

        for await (const chunk of chatStream) {
          fullContent += chunk
          controller.enqueue(encoder.encode(`event: text\ndata: ${JSON.stringify({ text: chunk })}\n\n`))
        }

        const usedProvider = modelRouter.getActiveProvider()

        await db.insert(schema.messages).values({
          threadId: id,
          role: 'assistant',
          content: fullContent,
          modelUsed: usedProvider
        })

        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ modelUsed: usedProvider })}\n\n`))
        controller.close()
      }
      catch (error: unknown) {
        const errorMessage = (error as Error).message || 'Stream error'
        console.error('[SSE] Stream error:', errorMessage)
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`))

        if (fullContent) {
          await db.insert(schema.messages).values({
            threadId: id,
            role: 'assistant',
            content: fullContent + '\n\n[Response interrupted by error]',
            modelUsed: modelRouter.getActiveProvider()
          })
        }

        controller.close()
      }
    }
  })

  return stream
})
