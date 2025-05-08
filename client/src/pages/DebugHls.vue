<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';
import Hls from 'hls.js'
const url = "http://localhost:5173/api/session/883c2938-b8fc-4765-add6-9189e03f5f9c/pull/index.m3u8"
const videoTemp = useTemplateRef('video')

onMounted(() => {
  if (videoTemp.value) {
    if (Hls.isSupported()) {
      const hls = new Hls()

      const laod = () => hls.loadSource(url)

      hls.attachMedia(videoTemp.value)

      laod()

      setInterval(laod, 10000)
    }
  }
})
</script>

<template>
  <video ref="video" width="800" height="600" autoplay controls></video>
</template>
