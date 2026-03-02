<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

function formatChange(v: number) {
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
}
</script>

<template>
  <footer class="flex items-center h-10 shrink-0 bg-bg-1 border-t border-border px-5 gap-4">

    <!-- Left: game day indicator -->
    <div class="flex items-center gap-2 text-xs text-muted" style="margin-left: 8px;">
      <span class="w-1.5 h-1.5 rounded-full bg-accent shrink-0"/>
      <span>
        Game Day <strong class="text-text font-semibold">{{ ui.gameDay }}</strong>
        &nbsp;·&nbsp;
        Season <strong class="text-text font-semibold">{{ ui.season }}</strong>
      </span>
    </div>

    <div class="flex-1"/>

    <!-- Right: market indices -->
    <div class="flex items-center gap-5 text-xs font-mono" style="margin-right: 8px;">
      <span class="flex items-center gap-1.5">
        <span class="text-muted">S&amp;P 500</span>
        <span class="font-semibold" :class="ui.indices.sp500.change >= 0 ? 'text-success' : 'text-danger'">
          {{ formatChange(ui.indices.sp500.change) }}
        </span>
      </span>
      <span class="w-px h-3 bg-border"/>
      <span class="flex items-center gap-1.5">
        <span class="text-muted">NASDAQ</span>
        <span class="font-semibold" :class="ui.indices.nasdaq.change >= 0 ? 'text-success' : 'text-danger'">
          {{ formatChange(ui.indices.nasdaq.change) }}
        </span>
      </span>
      <span class="w-px h-3 bg-border"/>
      <span class="flex items-center gap-1.5">
        <span class="text-muted">DOW</span>
        <span class="font-semibold" :class="ui.indices.dow.change >= 0 ? 'text-success' : 'text-danger'">
          {{ formatChange(ui.indices.dow.change) }}
        </span>
      </span>
    </div>
  </footer>
</template>
