<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const ui     = useUiStore()
const auth   = useAuthStore()

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <header class="flex items-center h-16 shrink-0 bg-bg-1 border-b border-border px-5 gap-4">

    <!-- Search -->
    <div class="relative flex items-center" style="margin-left: 8px;">
      <input
        style="padding-left: 10px;"
        type="text"  
        placeholder="Search stocks, users…"
        class="h-10 w-56 pl-12 pr-10 rounded-xl bg-panel border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors"
      />
      <kbd class="absolute right-3 text-[12px] text-muted font-mono bg-panel-2 border border-border px-1.5 py-0.5 rounded" style="padding-right: 2px; padding-left: 2px">⌘K</kbd>
    </div>

    <!-- Center: market status + countdown + game day -->
    <div class="flex items-center gap-3 flex-1 justify-center">
      <span
        class="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold transition-colors"
        :class="ui.marketOpen ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'"
        style="padding-left: 8px; padding-right: 8px;"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="ui.marketOpen ? 'bg-success' : 'bg-danger'"/>
        {{ ui.marketOpen ? 'MARKET OPEN' : 'MARKET CLOSED' }}
      </span>

      <span class="text-xs text-muted">
        {{ ui.marketOpen ? 'closes in' : 'opens in' }}
      </span>
      <span class="text-sm font-mono text-text tabular-nums">{{ ui.countdown }}</span>

      <span class="w-px h-4 bg-border"/>

      <span class="text-sm text-muted">
        Day <span class="text-text font-semibold">{{ ui.gameDay }}</span>
        · Season <span class="text-text font-semibold">{{ ui.season }}</span>
      </span>
    </div>

    <!-- Right: notifications + profile -->
    <div class="flex items-center gap-2 shrink-0" style="margin-right: 8px;">
      <button class="relative flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-text hover:bg-panel-2 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full ring-1 ring-bg-1"/>
      </button>

      <button
        class="flex items-center gap-2 h-9 pl-1 pr-3 rounded-xl bg-panel border border-border hover:bg-panel-2 transition-colors"
        @click="navigate('/profile')"
      >
        <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/20 text-accent text-xs font-bold" style="margin-left: 4px; margin-right: 0;">
          {{ auth.user?.username?.charAt(0)?.toUpperCase() ?? '?' }}
        </span>
        <span class="text-sm font-medium text-text">{{ auth.user?.username ?? 'Guest' }}</span>
        <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent" style="padding-right: 6px; padding-left: 6px; margin-right: 4px;">
          Trader
        </span>
      </button>
    </div>
  </header>
</template>
