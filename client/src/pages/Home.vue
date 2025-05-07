<script lang="ts" setup>
import { ref } from 'vue';
import { useSessionId } from '../libs/compose/session';
import { useSessionEvents } from '../libs/compose/sse'
import HomePending from './HomePending.vue';
import { deleteSession } from '../libs/services/session';
import { useDisplayMedia } from '@vueuse/core'
import { useFFmpeg } from '../libs/compose/ffmpeg'
import HomeLoading from './HomeLoading.vue'
import HomeRecorder from './HomeRecorder.vue';

const { ffmpeg, loading: ffmpegLoading, error: ffmpegError, logs: ffmpegLogs } = useFFmpeg(true)

const {
  sessionId, syncSessionId
} = useSessionId()

const userCount = ref(0)

const {
  enabled: isRecording,
  start: recordingStart,
  stop: recordingStop,
  stream: recordingStream
} = useDisplayMedia({
  audio: true,
  video: true
})


const eventSource = useSessionEvents(
  sessionId,
  {
    users(data) {
      userCount.value = data
    },
  }
)

const handleSyncUrl = async (refresh?: boolean) => {
  if (!refresh) {
    await syncSessionId()
  } else {
    await deleteSession(sessionId.value)
    await syncSessionId()
  }
  eventSource.open()
}

const handleRecording = async () => {
  await recordingStart()
}

</script>

<template>
  <template v-if="!ffmpeg || ffmpegLoading || ffmpegError">
    <HomeLoading :error="ffmpegError" :logs="ffmpegLogs" />
  </template>
  <template v-else>
    <HomePending v-if="!isRecording || !recordingStream" :session-id="sessionId" :user-count="userCount"
      @start="handleRecording" @sync-url="handleSyncUrl" />
    <HomeRecorder v-else @stop="recordingStop" :ffmpeg="ffmpeg" :stream="recordingStream" :user-count="userCount"
      :session-id="sessionId" />
  </template>
</template>
