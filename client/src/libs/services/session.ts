import { toast } from "@steveyuowo/vue-hot-toast";
import { createFetch } from "ofetch";
import { entities, response } from 'types'

const ofetch = createFetch({
  defaults: {
    baseURL: '/api',
    async onResponse(ctx) {
      if (ctx.error) {
        toast.error(ctx.error.message)
        return
      }

      const json = await ctx.response._data as response.Response

      if (!json.ok) {
        toast.error(json.error ?? '请求失败')
        return
      }
    },
    onResponseError(ctx) {
      if (ctx.error) {
        toast.error(ctx.error.message)
      }
    }
  },
  fetch
})

export function postSession() {
  return ofetch<response.Response<entities.PostSessionResponse>>('/session', {
    method: 'post'
  })
}

export function deleteSession(id: string) {
  return ofetch<response.Response>(`/session/${id}/delete`, {
    method: 'post'
  })
}

export function leaveSession(id?: string) {
  return ofetch<response.Response>(`/session/${id}/leave`, {
    method: 'post',
    body: id ? undefined : id
  })
}

export function pushSession(id: string, slice: Uint8Array, filename: string) {
  return ofetch(`/session/${id}/push`, {
    method: 'post',
    body: slice,
    headers: {
      'x-filename': filename
    }
  })
}

export function push2Session(id: string, seg: Uint8Array, filename: string, options?: {
  videoCodec?: string
  audioCodec?: string
  segDuration?: number
}) {
  const headers = new Headers({
    'x-filename': filename
  })

  if (options?.videoCodec) {
    headers.append('x-ffcv', options.videoCodec)
  }

  if (options?.audioCodec) {
    headers.append('x-ffca', options.audioCodec)
  }

  if (options?.segDuration) {
    headers.append('x-segd', options.segDuration.toString())
  }

  return ofetch<response.Response<entities.Push2SessionResponse>>(`/session/${id}/push2`, {
    method: 'post',
    body: seg,
    headers: headers
  })
}

export function validSession(id: string) {
  return ofetch<response.Response>(`/session/${id}/valid`)
}

export function joinSession(id: string) {
  return ofetch<response.Response<entities.PostJoinResponse>>(
    `/session/${id}/join`,
    {
      method: 'post'
    }
  )
}

export function pullSession(id: string) {

}
