import { createGlobalState } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref } from 'vue'

export type LayoutStatus =
  | 'pending'
  | 'actived'

export const useLayoutStore = createGlobalState(() => {
  const layoutTitle = ref('共享屏幕')
  const layoutStatus = ref<LayoutStatus>('pending')

  return {
    layoutTitle,
    layoutStatus
  }
})

export type LayoutStore = ReturnType<typeof useLayoutStore>

export function useLayoutState<K extends keyof LayoutStore>(
  key: K,
  value: LayoutStore[K]['value']
) {
  const current = useLayoutStore()[key]
  const defaultValue = current.value
  const last = ref(defaultValue)

  onMounted(() => {
    last.value = current.value
    current.value = value
  })

  onBeforeUnmount(() => {
    current.value = last.value
    last.value = defaultValue
  })

  return current
}

export function useLayoutTitle(title: string) {
  return useLayoutState('layoutTitle', title)
}

export function useLayoutStatus(status: LayoutStatus) {
  return useLayoutState('layoutStatus', status)
}
