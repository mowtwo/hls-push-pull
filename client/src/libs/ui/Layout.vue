<script setup lang="ts">
import { useLayoutStatus, useLayoutTitle } from '../compose/layout';

const layoutTitle = useLayoutTitle('共享屏幕')
const layoutStatus = useLayoutStatus('pending')
</script>

<template>
  <div class="of-hidden fixed inset-0 flex flex-col select-none">
    <div
      class="fixed inset-0 flex justify-center items-center text-30 text-black text-op-2 rotate-30 pointer-events-none">
      Mowtwo Build
    </div>
    <div class="flex justify-center items-center h-20 text-center" :class="{
      'bg-blueGray': layoutStatus === 'pending',
      'bg-blue': layoutStatus === 'actived'
    }">
      <div class="text-10 text-white">
        {{ layoutTitle }}
      </div>
    </div>
    <div class="of-hidden flex-1 w-full">
      <RouterView />
    </div>
  </div>
</template>
