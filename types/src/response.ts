export type IResponse<T extends {}> = {
  ok: true
} & T

export interface IResponseError {
  ok: false
  error?: string
}

export type Response<T extends {}> =
  IResponse<T> | IResponseError

export function response<T extends {} = {}>(ok: true, data?: T): IResponse<T>
export function response(ok: false, error?: string): IResponseError
export function response<T extends {} = {}>(ok: boolean, data?: T | string | undefined): Response<T> {
  if (ok) {
    return {
      ok: true,
      ...(data ?? {}) as T
    }
  }

  return {
    ok: false,
    error: typeof data === 'undefined' ? undefined : String(data)
  }
}

export function ok<T extends {} = {}>(data?: T) {
  return response(true, data)
}

export function error(message: string) {
  return response(false, message)
}
