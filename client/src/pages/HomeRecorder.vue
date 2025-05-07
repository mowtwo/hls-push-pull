<script lang="ts" setup>
import { onMounted, ref, useTemplateRef } from 'vue';
import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { useLayoutStatus, useLayoutTitle } from '../libs/compose/layout';
import { pushSession } from '../libs/services/session'
import { toast } from '@steveyuowo/vue-hot-toast'

const props = defineProps<{
  stream: MediaStream
  ffmpeg: FFmpeg
  userCount: number
  sessionId: string
}>()

const emits = defineEmits<{
  stop: []
  push: [buffer: ArrayBuffer]
}>()

const videoTemp = useTemplateRef('video')
const mediaRecord = ref<MediaRecorder>()

const logs = ref<string[]>([])

const handleLogs = () => {
  const showLogs = logs.value.slice(-5)

  for (const log of showLogs) {
    toast.success(log)
  }
}

useLayoutTitle('共享屏幕：正在共享中')

useLayoutStatus('actived')

onMounted(() => {
  if (props.stream) {

    if (videoTemp.value) {
      videoTemp.value.srcObject = props.stream
    }

    const record = mediaRecord.value = new MediaRecorder(
      props.stream,
      {
        mimeType: 'video/webm;codecs=vp8'
      }
    )

    record.addEventListener('dataavailable', async (e) => {
      if (props.userCount <= 1) {
        logs.value.push('当前没有观看用户暂不推流')
        return
      }

      logs.value.push('开始生成index.m3u8')
      const data = new Uint8Array(await e.data.arrayBuffer())
      await props.ffmpeg.writeFile('input.webm', data)
      await props.ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency',
        '-f', 'hls', '-hls_time', '1', '-hls_list_size', '5', '-hls_flags', 'delete_segments',
        'index.m3u8'
      ])

      const file = await props.ffmpeg.readFile('index.m3u8') as Uint8Array
      logs.value.push('生成index.m3u8完成')

      await pushSession(
        props.sessionId,
        file,
        'index.m3u8'
      )
      logs.value.push('上传index.m3u8完成')

      logs.value.push('开始推送视频流')

      for (let i = 0; ; i++) {
        const name = `segment${i.toString().padStart(3, '0')}.ts`
        try {
          const seg = await props.ffmpeg.readFile(name) as Uint8Array
          logs.value.push('开始推送切片' + name)
          await pushSession(
            props.sessionId,
            seg,
            name
          )

          logs.value.push('推送切片' + name + '完成')
        } catch {
          logs.value.push('推送切片' + name + '错误')
          break
        }
      }
      logs.value.push('当前切片全部推送完毕')
    })

    record.start(1000)
  }
})

const toolsExpand = ref(true)

</script>

<template>
  <div class="of-hidden relative flex h-full">
    <div class="relative bg-black w-full h-full">
      <video class="w-full h-full object-scale-down" ref="video" autoplay playsinline="true"></video>
      <div class="absolute inset-0"></div>
    </div>
    <div class="top-0 right-0 absolute bg-blue px-3 py-2 text-white">
      当前共享人数：{{ userCount }}
    </div>
    <div class="right-0 bottom-0 absolute flex items-center bg-white h-12">
      <div @click="toolsExpand = !toolsExpand"
        class="flex justify-center items-center bg-blue w-10 h-full text-10 text-white cursor-pointer">
        <div class="i-mdi:chevron-right" v-if="toolsExpand"></div>
        <div class="i-mdi:chevron-left" v-else></div>
      </div>
      <div v-if="toolsExpand" class="of-hidden flex items-center gap-4 mx-2">
        <div class="bg-amber px-2 py-1 h-full text-white cursor-pointer" @click="handleLogs">查看推流日志</div>
        <div class="bg-red px-2 py-1 h-full text-white cursor-pointer" @click="emits('stop')">停止共享</div>
      </div>
    </div>
  </div>
</template>
