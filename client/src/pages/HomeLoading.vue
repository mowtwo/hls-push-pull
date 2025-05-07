<script lang="ts" setup>
import { useLayoutTitle } from '../libs/compose/layout';

defineProps<{
  logs: string[],
  error: string
}>()

useLayoutTitle('下载FFmpeg')
</script>

<template>
  <div class="px-10">
    <h3>运行日志</h3>
    <ul>
      <li v-for="log, index of logs" :key="index">
        {{ log }}
      </li>
    </ul>
  </div>
  <div v-if="error" class="px-10 text-red">
    <h3>错误报告</h3>
    <div>{{ error }}</div>
  </div>
</template>
