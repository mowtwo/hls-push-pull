<script lang="ts" setup>
import { onMounted, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router'
import { validSession, joinSession, pullSession } from '../libs/services/session'
import { leaveSession } from '../libs/services/session';

const router = useRouter()

const videoTemp = useTemplateRef('video')

onMounted(() => {
  const id = router.currentRoute.value.params.id as string
  if (!id) {
    router.replace('/join')
  } else {
    validSession(id)
      .then(() => {
        return joinSession(id)
      })
      .then(() => {

      })
      .catch(
        () => {
          router.replace('/join')
        }
      )

    window.addEventListener('beforeunload', () => {
      leaveSession(id)
    })
  }

})
</script>

<template>
  <div class="of-hidden relative flex h-full">
    <div class="relative bg-black w-full h-full">
      <video class="w-full h-full object-scale-down" ref="video" autoplay playsinline="true"></video>
      <div class="absolute inset-0"></div>
    </div>
  </div>
</template>
