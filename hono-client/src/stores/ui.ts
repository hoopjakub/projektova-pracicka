import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const BASE = 'http://localhost:3000'

export const useUiStore = defineStore('ui', () => {
  // Game clock — driven by server, ticked locally
  const dayLengthSeconds  = ref(1200)
  const marketOpenSecond  = ref(0)
  const marketCloseSecond = ref(840)
  const gameDay   = ref(1)
  const season    = ref(1)
  const daySecond = ref(0)
  const isRunning = ref(true)

  let tickInterval: ReturnType<typeof setInterval> | null = null

  const marketStatus = computed<'open' | 'closed'>(() =>
    daySecond.value >= marketOpenSecond.value &&
    daySecond.value <  marketCloseSecond.value
      ? 'open' : 'closed'
  )
  const marketOpen = computed(() => marketStatus.value === 'open')

  const countdown = computed(() => {
    const ds = daySecond.value
    let remaining: number
    if (marketStatus.value === 'open') {
      remaining = marketCloseSecond.value - ds
    } else if (ds < marketOpenSecond.value) {
      remaining = marketOpenSecond.value - ds
    } else {
      remaining = marketOpenSecond.value + dayLengthSeconds.value - ds
    }
    remaining = Math.max(0, remaining)
    const h = Math.floor(remaining / 3600)
    const m = Math.floor((remaining % 3600) / 60)
    const s = remaining % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  // Market indices — computed from stock_price_points vs initial_price
  const indices = ref({
    tech:   { label: 'TECH-7',  change: 0 },
    fin:    { label: 'FIN-3',   change: 0 },
    allMkt: { label: 'ALL-MKT', change: 0 },
  })

  async function fetchIndices() {
    try {
      const res = await fetch(`${BASE}/indices`)
      if (!res.ok) return
      const d = await res.json()
      indices.value.tech.change   = d.tech?.change   ?? 0
      indices.value.fin.change    = d.fin?.change    ?? 0
      indices.value.allMkt.change = d.allMkt?.change ?? 0
    } catch { /* keep previous values */ }
  }

  async function fetchGameClock() {
    try {
      const res = await fetch(`${BASE}/game-clock`)
      if (!res.ok) return
      const d = await res.json()
      dayLengthSeconds.value  = d.day_length_seconds
      marketOpenSecond.value  = d.market_open_second
      marketCloseSecond.value = d.market_close_second
      gameDay.value   = d.current_day
      daySecond.value = d.day_second
      isRunning.value = d.is_running
      season.value    = d.season ?? 1
    } catch { /* server offline — keep current values */ }
  }

  function startTicking() {
    fetchGameClock()
    fetchIndices()
    if (tickInterval) clearInterval(tickInterval)
    tickInterval = setInterval(() => {
      if (!isRunning.value) return
      const next = daySecond.value + 1
      if (next >= dayLengthSeconds.value) {
        gameDay.value++
        daySecond.value = 0
      } else {
        daySecond.value = next
      }
      if (daySecond.value % 30 === 0) fetchGameClock()
      if (daySecond.value % 60 === 0) fetchIndices()
    }, 1000)
  }

  function stopTicking() {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null }
  }

  return {
    marketStatus,
    marketOpen,
    countdown,
    gameDay,
    season,
    daySecond,
    indices,
    fetchGameClock,
    fetchIndices,
    startTicking,
    stopTicking,
  }
})
