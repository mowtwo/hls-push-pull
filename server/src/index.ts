import { Hono } from "hono";
import fs from 'fs-extra'
import { v4 } from "uuid";
import { serve } from "@hono/node-server";
import { getCookie, setCookie } from "hono/cookie";
import { streamSSE } from "hono/streaming";
import { response, entities } from "types";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { mimes } from "hono/utils/mime";
import { extname } from 'node:path'

const sessionsBase = './sessions'

const sessionLivings = new Map<string, Set<string>>()

await fs.ensureDir(sessionsBase)

const app = new Hono()

app.use(logger())

const api = app.basePath('/api')

setInterval(async () => {
  console.log('开始定时清理无用的session文件')
  await fs.ensureDir(sessionsBase)

  const files = await fs.readdir(sessionsBase)

  for (const file of files) {
    if (!sessionLivings.has(file)) {
      console.log('删除无用的session', file)
      await fs.remove(file)
    }
    const users = sessionLivings.get(file)

    if (!users || users.size === 0 || !users.has('0')) {
      console.log('删除无用的session', file)
      await fs.remove(file)
    }
  }

}, 600_000)


api.post('session', async (ctx) => {
  let sessionId = getCookie(ctx, 'sessionId') ?? v4()

  let users = sessionLivings.get(sessionId)

  if (!users) {
    sessionId = v4()
    users = new Set(['0'])
    sessionLivings.set(sessionId, users)
  }

  await fs.ensureDir(`${sessionsBase}/${sessionId}`)

  if (!users.has('0')) {
    users.add('0')
  }

  sessionLivings.set(sessionId, users)

  setCookie(ctx, 'sessionId', sessionId, { httpOnly: true })

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

api.get('session/:id/:file/pull', async (ctx) => {
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
      if (!users || !users.has('0')) {
        await stream.writeSSE({
          data: '',
          event: 'close',
          id: Date.now().toString()
        })
        await stream.close()
        return
      }

      await stream.writeSSE({
        data: users.size.toString(),
        event: 'users',
        id: Date.now().toString()
      })

      await stream.sleep(500)
    }
  })
})

const wasmBase = './wasm'

const wasm = app.basePath('/wasm')

await fs.ensureDir(wasmBase)

wasm.use(cors())

wasm.get('/', async (ctx) => {
  const files = await fs.readdir(wasmBase)
  const baseUrl = new URL('', ctx.req.url).origin

  console.log(baseUrl)

  return ctx.html(`
    <ul>
      ${files.map(file => `<li>
        <a href="${baseUrl}/wasm/${file}">${file}</a>
        </li>`).join('')}
    </ul>
    `)
})

wasm.get('/:file', async (ctx) => {
  const file = ctx.req.param('file')
  const path = `${wasmBase}/${file}`

  if (!await fs.pathExists(path)) {
    return ctx.json(
      response.error('文件不存在'),
      404
    )
  }

  return ctx.body(
    await fs.readFile(path),
    200,
    {
      "Content-Type": mimes[extname(path).slice(1)]
    }
  )
})

serve({
  fetch: app.fetch,
  port: 5556
}).once('listening', () => {
  console.log(`server starting at http://localhost:5556/api`)
}).once('close', () => {
  console.log('server terminate')
})
