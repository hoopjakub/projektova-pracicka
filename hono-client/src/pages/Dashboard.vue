<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const BASE = 'http://localhost:3000'

interface PortfolioSummary {
  net_worth: number
  cash_balance: number
  total_pnl: number
  total_pnl_pct: number
  pending_orders_count: number
}

const data    = ref<PortfolioSummary | null>(null)
const loading = ref(true)

async function fetchDashboard() {
  try {
    const res = await fetch(`${BASE}/portfolio`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    if (res.ok) data.value = await res.json()
  } catch { /* server offline */ }
  finally { loading.value = false }
}

onMounted(fetchDashboard)

function fmtUsd(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-text mb-1">Dashboard</h1>
    <p class="text-sm text-muted mb-6">Your portfolio overview</p>

    <div v-if="loading" class="text-muted text-sm animate-pulse mb-6">Loading…</div>

    <div v-else class="grid grid-cols-4 gap-5 mb-6">

      <div class="bg-panel border border-border rounded-2xl p-5" style="box-shadow:var(--shadow-card)">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Net Worth</p>
        <p class="text-3xl font-semibold text-text font-mono mb-1">{{ data ? fmtUsd(data.net_worth) : '—' }}</p>
        <p class="text-xs" :class="(data?.total_pnl_pct ?? 0) >= 0 ? 'text-success' : 'text-danger'">
          {{ (data?.total_pnl_pct ?? 0) >= 0 ? '▲' : '▼' }}
          {{ Math.abs(data?.total_pnl_pct ?? 0).toFixed(2) }}% all-time
        </p>
      </div>

      <div class="bg-panel border border-border rounded-2xl p-5" style="box-shadow:var(--shadow-card)">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Cash Balance</p>
        <p class="text-3xl font-semibold text-text font-mono mb-1">{{ data ? fmtUsd(data.cash_balance) : '—' }}</p>
        <p class="text-xs text-muted">available to trade</p>
      </div>

      <div class="bg-panel border border-border rounded-2xl p-5" style="box-shadow:var(--shadow-card)">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Unrealised P&amp;L</p>
        <p class="text-3xl font-semibold font-mono mb-1" :class="(data?.total_pnl ?? 0) >= 0 ? 'text-success' : 'text-danger'">
          {{ (data?.total_pnl ?? 0) >= 0 ? '+' : '' }}{{ data ? fmtUsd(data.total_pnl) : '—' }}
        </p>
        <p class="text-xs" :class="(data?.total_pnl_pct ?? 0) >= 0 ? 'text-success' : 'text-danger'">
          {{ (data?.total_pnl_pct ?? 0) >= 0 ? '▲' : '▼' }}
          {{ Math.abs(data?.total_pnl_pct ?? 0).toFixed(2) }}%
        </p>
      </div>

      <div class="bg-panel border border-border rounded-2xl p-5" style="box-shadow:var(--shadow-card)">
        <p class="text-xs text-muted uppercase tracking-wide mb-1">Open Orders</p>
        <p class="text-3xl font-semibold text-text font-mono mb-1">{{ data?.pending_orders_count ?? '—' }}</p>
        <p class="text-xs text-muted">pending / partially filled</p>
      </div>

    </div>

    <!-- chart placeholders -->
    <div class="grid grid-cols-12 gap-5" style="margin-top: 12px;">
      <div class="col-span-7 bg-panel border border-border rounded-2xl p-5 flex items-center justify-center h-64" style="box-shadow:var(--shadow-card)">
        <p class="text-muted text-sm">Portfolio chart — implementation coming</p>
      </div>
      <div class="col-span-5 bg-panel border border-border rounded-2xl p-5 flex items-center justify-center h-64" style="box-shadow:var(--shadow-card)">
        <p class="text-muted text-sm">Allocation donut — coming</p>
      </div>
    </div>
  </div>
</template>
