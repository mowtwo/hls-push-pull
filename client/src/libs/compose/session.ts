import { onMounted, ref } from "vue";
import { postSession } from "../services/session";

export function useSessionId(mountReady: boolean = false) {
  const sessionId = ref('')

  const syncSessionId = async () => {
    const resp = await postSession()

    if (resp.ok) {
      console.log(resp)
      sessionId.value = resp.sessionId
    }
  }

  onMounted(() => {
    if (mountReady) {
      syncSessionId()
    }

    window.addEventListener('beforeunload', () => {
      if (sessionId.value) {
        const id = sessionId.value
        navigator.sendBeacon(`/api/session/${id}/delete`, id)
      }
    })
  })

  return {
    sessionId,
    syncSessionId
  }
}
