import { onMounted, ref, shallowRef } from "vue";
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from "@ffmpeg/util";

export function useFFmpeg(mountReady: boolean = false) {
  const ffmpeg = shallowRef<FFmpeg>()
  const loading = ref(false)
  const error = ref('')
  const logs = ref<string[]>([])

  const loadFfmpeg = async () => {
    loading.value = true
    error.value = ''
    logs.value = []
    try {
      const ff = ffmpeg.value = new FFmpeg()

      logs.value.push('开始下载FFmpeg')

      ff.on('log', log => {
        logs.value.push(log.message)
      })

      const baseUrl = 'http://localhost:5556/wasm'

      await ff.load({
        coreURL: await toBlobURL(baseUrl + '/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL(baseUrl + '/ffmpeg-core.wasm', 'application/wasm'),
        workerURL: await toBlobURL(baseUrl + '/ffmpeg-core.worker.js', 'text/javascript'),
      })

      logs.value.push('FFmpeg组件全部加载完成')
    } catch (e) {
      if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = String(e)
      }
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    if (mountReady) {
      loadFfmpeg()
    }
  })

  return {
    loadFfmpeg,
    ffmpeg,
    loading,
    error,
    logs
  }
}
