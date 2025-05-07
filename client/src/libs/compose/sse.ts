import { toRef, useEventSource } from "@vueuse/core";
import { watch, type MaybeRefOrGetter } from "vue";

export interface SessionEvent {
  users: number
  close: undefined
}

export type OnSessionEvents = {
  [K in keyof SessionEvent]?:
  SessionEvent[K] extends undefined ? () => void : (data: SessionEvent[K]) => void
}

export function useSessionEvents(
  inputSessionId: MaybeRefOrGetter<string>,
  events?: OnSessionEvents
) {
  const sessionId = toRef(inputSessionId)

  const eventSource = useEventSource(
    () => `/api/session/${sessionId.value}/events`,
    [
      'close', 'users'
    ] as const,
    { immediate: false }
  )

  watch(sessionId, (sessionId) => {
    if (sessionId.length > 0) {
      eventSource.open()
    }
  })

  watch([eventSource.event, eventSource.data], ([event, data]) => {
    if (!event) {
      return
    }
    if (event === 'users') {
      events?.users?.(parseInt(data))
    }

    events?.close?.()
  })

  return eventSource
}
