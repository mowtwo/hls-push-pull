<script lang="ts" setup>
import { onMounted, onScopeDispose, ref, useTemplateRef } from 'vue';
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { useLayoutStatus, useLayoutTitle } from '../libs/compose/layout';
import { pushSession } from '../libs/services/session'
import { toast } from '@steveyuowo/vue-hot-toast'
import { buildFFHlsPusher } from '../libs/utils/ffmpeg'

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
const logs = ref<string[]>([])

const handleLogs = () => {
  const showLogs = logs.value.slice(-5)

  for (const log of showLogs) {
    toast.success(log)
  }
}

useLayoutTitle('共享屏幕：正在共享中')

useLayoutStatus('actived')

const ffPusher = buildFFHlsPusher(
  props.ffmpeg,
  new MediaRecorder(props.stream),
  props.stream,
  {
    segDuration: 1
  }
)

onMounted(() => {
  if (videoTemp.value) {
    videoTemp.value.srcObject = props.stream
  }

  ffPusher.start({
    pushPlayList(data, name) {
      pushSession(props.sessionId, data, name)
    },
    pushSeg(data, name) {
      pushSession(props.sessionId, data, name)
    },
  })
})

onScopeDispose(() => {
  ffPusher.stop()
})

const toolsExpand = ref(true)

const handleCopyUrl = async () => {
  const joinUrl = new URL(`/join/${props.sessionId}`, location.href)

  try {
    await navigator.clipboard.writeText(joinUrl.toString())
    toast.success('已复制共享地址')
  } catch {
    toast.error('复制未正确完成')
  }
}

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
        <div class="bg-blue px-2 py-1 h-full text-white cursor-pointer" @click="handleCopyUrl">分享地址</div>
        <div class="bg-amber px-2 py-1 h-full text-white cursor-pointer" @click="handleLogs">查看推流日志</div>
        <div class="bg-red px-2 py-1 h-full text-white cursor-pointer" @click="emits('stop')">停止共享</div>
      </div>
    </div>
  </div>
</template>
