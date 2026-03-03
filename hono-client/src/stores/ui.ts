import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Market status
  const marketStatus = ref<'open' | 'closed'>('open')
  const marketCloseTime = ref('16:00:00')

  // Game info
  const gameDay = ref(12)
  const season = ref(3)

  // Market indices (mock ticks — swap with real data later)
  const indices = ref({
    sp500:  { value: 5234.18, change: 0.42 },
    nasdaq: { value: 16821.55, change: -0.18 },
    dow:    { value: 39104.22, change: 0.31 },
  })

  // Countdown to market close (mock)
  const countdown = ref('03:41:22')

  const marketOpen = computed(() => marketStatus.value === 'open')

  return {
    marketStatus,
    marketOpen,
    marketCloseTime,
    countdown,
    gameDay,
    season,
    indices,
  }
})
