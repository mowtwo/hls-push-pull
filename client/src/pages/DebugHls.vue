<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';
import Hls from 'hls.js'
const id = 'fd7f73c7-6253-433a-ae57-40928f45c739'
const url = `http://localhost:5173/api/session/${id}/pull/index.m3u8`
const videoTemp = useTemplateRef('video')

onMounted(() => {
  if (videoTemp.value) {
    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDuration:10
      })

      hls.loadSource(url)
      hls.attachMedia(videoTemp.value)
    }
  }
})
</script>

<template>
  <video ref="video" width="800" height="600" controls autoplay></video>
</template>
