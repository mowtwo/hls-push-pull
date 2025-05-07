<script lang="ts" setup>
import { computed } from 'vue';
import { useLayoutStatus } from '../libs/compose/layout';
import { toast } from '@steveyuowo/vue-hot-toast'

const emits = defineEmits<{
  start: []
  syncUrl: [refresh?: boolean]
}>()

const props = defineProps<{
  sessionId: string
  userCount: number
}>()



const joinUrl = computed(() => {
  if (!props.sessionId) {
    return ''
  }

  const url = new URL(`/join/${props.sessionId}`, location.href)

  return url.toString()
})

useLayoutStatus('pending')

const handleCopyUrl = async () => {
  try {
    await navigator.clipboard.writeText(joinUrl.value)
    toast.success('已复制共享地址')
  } catch {
    toast.error('复制未正确完成')
  }
}
</script>

<template>
  <div class="flex justify-center items-center h-full">
    <div class="flex flex-col bg-coolGray bg-op-20 shadow-xl w-200 h-120">
      <div class="flex items-center bg-blueGray px-5 h-15 text-6 text-white">
        当前未开启共享
      </div>
      <div class="flex flex-col flex-1 gap-10 px-5 py-10" v-if="!sessionId">
        <div class="flex flex-col flex-1 bg-white">
          <div class="flex px-5 py-3 text-4 text-coolGray">
            还没有创建共享，暂无共享链接，点击下面按钮创建
          </div>
        </div>
        <div
          class="flex justify-center items-center gap-2 bg-none mx-20 mt-a h-15 text-4 text-blue cursor-pointer rd-2 b-blue b-solid b-2"
          @click="emits('syncUrl')">
          点击创建共享
        </div>
      </div>
      <div class="flex flex-col flex-1 gap-10 px-5 py-10" v-else>
        <div class="relative flex flex-col flex-1 bg-white">
          <div class="flex px-5 py-3 text-4 hover:text-blue cursor-pointer" @click="handleCopyUrl">
            {{ joinUrl }}
          </div>
          <div class="right-0 bottom-0 absolute bg-blue px-2 py-1 text-white">
            当前共享人数：{{ userCount }} <span class="text-3">(点击链接进行复制)</span>
          </div>
        </div>
        <div class="flex items-center gap-10 mt-a">
          <div
            class="flex flex-1 justify-center items-center gap-2 bg-none h-15 text-4 text-blue cursor-pointer rd-2 b-blue b-solid b-2"
            @click="emits('syncUrl', true)">
            刷新共享链接
          </div>
          <div
            class="flex flex-1 justify-center items-center gap-2 bg-blue bg-none h-15 text-4 text-white cursor-pointer rd-2 b-blue b-solid b-2"
            @click="emits('start')">
            点击开始推流
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
