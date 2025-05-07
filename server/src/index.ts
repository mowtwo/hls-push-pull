import { Hono } from "hono";
import fs from 'fs-extra'
import { v4 } from "uuid";
import { serve } from "@hono/node-server";
import { getCookie, setCookie } from "hono/cookie";
import { streamSSE } from "hono/streaming";
import { response, entities } from "types";

const sessionsBase = './sessions'

const sessionLivings = new Map<string, Set<string>>()

const app = new Hono()

const api = app.basePath('/api')

await fs.ensureDir(sessionsBase)

api.post('session', async (ctx) => {
  const sessionId = v4()

  await fs.ensureDir(`${sessionsBase}/${sessionId}`)

  const users = new Set(['0'])

  sessionLivings.set(sessionId, users)

  return ctx.json(response.ok<entities.PostSessionResponse>(
    {
      sessionId
    }
  ))
})

api.post('session/:id/push', async (ctx) => {
  const id = ctx.req.param('id')
  const filename = ctx.req.header('x-filename')
  const data = await ctx.req.arrayBuffer()
  await fs.writeFile(`${sessionsBase}/${id}/${filename}`, Buffer.from(data))
  return ctx.json(response.ok())
})

api.post('/session/:id/join', async (ctx) => {
  const id = ctx.req.param('id')

  const users = sessionLivings.get(id)

  if (!users) {
    return ctx.json(response.error('会话不存在'), 404)
  }

  const cookieUserId = getCookie(ctx, 'userId')

  if (cookieUserId) {
    users.add(cookieUserId)


    return ctx.json(
      response.ok<entities.PostJoinResponse>({
        userId: cookieUserId
      })
    )
  }

  const userId = v4()

  users.add(userId)

  setCookie(ctx, 'userId', userId, { httpOnly: true })

  return ctx.json(response.ok({
    userId
  }))
})

api.post('/session/:id/leave', async (ctx) => {
  const id = ctx.req.param('id')

  const users = sessionLivings.get(id)

  if (!users) {
    return ctx.json(response.error('会话不存在'), 404)
  }

  const userId = getCookie(ctx, 'userId') ??
    await ctx.req.text()

  if (!users.has(userId)) {
    return ctx.json(response.error('用户不存在'), 404)
  }

  users.delete(userId)

  return ctx.json(response.ok())
})

api.post('session/:id/delete', async (ctx) => {
  const id = ctx.req.param('id')
  sessionLivings.delete(id)
  await fs.remove(`${sessionsBase}/${id}`)

  return ctx.json(response.ok())
})

api.get('session/:id/:file', async (ctx) => {
  const id = ctx.req.param('id')
  const file = ctx.req.param('file')
  const path = `${sessionsBase}/${id}/${file}`
  if (await fs.pathExists(path)) {
    return ctx.body(
      await fs.readFile(path),
      200,
      {
        'Content-Type': file.endsWith('.m3u8')
          ? 'application/vnd.apple.mpegurl'
          : 'video/MP2T'
      }
    )
  }

  return ctx.json(response.error('文件不存在'), 404)
})

api.get('session/:id/events', async (ctx) => {
  const id = ctx.req.param('id')
  return streamSSE(ctx, async (stream) => {
    for (; ;) {
      const users = sessionLivings.get(id)
      if (!users) {
        await stream.close()
        return
      }

      await stream.writeSSE({
        data: users.size.toString(),
        event: 'users',
        id: Date.now().toString()
      })

      await stream.sleep(100)
    }
  })
})

serve({
  fetch: app.fetch,
  port: 5556
}).once('listening', () => {
  console.log(`server starting at http://localhost:5556/api`)
}).once('close', () => {
  console.log('server terminate')
})
