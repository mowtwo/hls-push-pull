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
