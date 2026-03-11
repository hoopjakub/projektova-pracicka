<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const BASE = 'http://localhost:3000'

interface Holding {
  stock_id: number
  symbol: string
  name: string
  sector: string
  quantity: number
  avg_buy_price: number
  current_price: number
  total_cost: number
  market_value: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
}

interface PortfolioData {
  cash_balance: number
  holdings_value: number
  net_worth: number
  total_pnl: number
  total_pnl_pct: number
  holdings: Holding[]
}

const data    = ref<PortfolioData | null>(null)
const loading = ref(true)
const error   = ref<string | null>(null)

async function fetchPortfolio() {
  loading.value = true
  error.value   = null
  try {
    const res = await fetch(`${BASE}/portfolio`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    if (!res.ok) throw new Error(`${res.status}`)
    data.value = await res.json()
  } catch (e: any) {
    error.value = 'Could not load portfolio — is the server running?'
  } finally {
    loading.value = false
  }
}

onMounted(fetchPortfolio)

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
function fmtUsd(n: number) {
  return '$' + fmt(n)
}
function pnlClass(n: number) {
  return n > 0 ? 'text-success' : n < 0 ? 'text-danger' : 'text-muted'
}
</script>

<template>
  <!-- loading -->
  <div v-if="loading" class="flex items-center justify-center min-h-64">
    <span class="text-muted text-sm animate-pulse">Loading portfolio…</span>
  </div>

  <!-- error -->
  <div v-else-if="error" class="flex items-center justify-center min-h-64">
    <p class="text-danger text-sm">{{ error }}</p>
  </div>

  <div v-else-if="data" class="flex flex-col gap-5">

    <!-- summary cards -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">

      <div class="bg-panel border border-border rounded-2xl p-5" style="box-shadow:var(--shadow-card)">
        <p class="text-xs text-muted mb-1">Net Worth</p>
        <p class="text-2xl font-bold text-text">{{ fmtUsd(data.net_worth) }}</p>
      </div>

      <div class="bg-panel border border-border rounded-2xl p-5" style="box-shadow:var(--shadow-card)">
        <p class="text-xs text-muted mb-1">Cash Balance</p>
        <p class="text-2xl font-bold text-text">{{ fmtUsd(data.cash_balance) }}</p>
      </div>

      <div class="bg-panel border border-border rounded-2xl p-5" style="box-shadow:var(--shadow-card)">
        <p class="text-xs text-muted mb-1">Holdings Value</p>
        <p class="text-2xl font-bold text-text">{{ fmtUsd(data.holdings_value) }}</p>
      </div>

      <div class="bg-panel border border-border rounded-2xl p-5" style="box-shadow:var(--shadow-card)">
        <p class="text-xs text-muted mb-1">Unrealised P&amp;L</p>
        <p class="text-2xl font-bold" :class="pnlClass(data.total_pnl)">
          {{ data.total_pnl >= 0 ? '+' : '' }}{{ fmtUsd(data.total_pnl) }}
          <span class="text-sm font-semibold ml-1">
            ({{ data.total_pnl_pct >= 0 ? '+' : '' }}{{ fmt(data.total_pnl_pct) }}%)
          </span>
        </p>
      </div>

    </div>

    <!-- holdings table -->
    <div class="bg-panel border border-border rounded-2xl overflow-hidden" style="box-shadow:var(--shadow-card)">
      <div class="px-5 py-4 border-b border-border">
        <p class="font-semibold text-text">Holdings</p>
      </div>

      <!-- empty state -->
      <div v-if="data.holdings.length === 0" class="flex flex-col items-center justify-center py-16 gap-2">
        <p class="text-muted text-sm">No positions yet.</p>
        <p class="text-muted text-xs">Buy stocks on the Market page to start building your portfolio.</p>
      </div>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-xs text-muted">
            <th class="text-left px-5 py-3 font-medium">Symbol</th>
            <th class="text-left px-5 py-3 font-medium hidden sm:table-cell">Name</th>
            <th class="text-right px-5 py-3 font-medium">Qty</th>
            <th class="text-right px-5 py-3 font-medium">Avg Cost</th>
            <th class="text-right px-5 py-3 font-medium">Current</th>
            <th class="text-right px-5 py-3 font-medium">Market Value</th>
            <th class="text-right px-5 py-3 font-medium">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="h in data.holdings"
            :key="h.stock_id"
            class="border-b border-border last:border-0 hover:bg-panel-2 transition-colors"
          >
            <td class="px-5 py-3">
              <span class="font-mono font-semibold text-accent">{{ h.symbol }}</span>
              <span class="ml-2 text-xs text-muted hidden lg:inline">{{ h.sector }}</span>
            </td>
            <td class="px-5 py-3 text-muted hidden sm:table-cell">{{ h.name }}</td>
            <td class="px-5 py-3 text-right tabular-nums">{{ h.quantity }}</td>
            <td class="px-5 py-3 text-right tabular-nums text-muted">{{ fmtUsd(h.avg_buy_price) }}</td>
            <td class="px-5 py-3 text-right tabular-nums">{{ fmtUsd(h.current_price) }}</td>
            <td class="px-5 py-3 text-right tabular-nums font-medium">{{ fmtUsd(h.market_value) }}</td>
            <td class="px-5 py-3 text-right tabular-nums" :class="pnlClass(h.unrealized_pnl)">
              <span>{{ h.unrealized_pnl >= 0 ? '+' : '' }}{{ fmtUsd(h.unrealized_pnl) }}</span>
              <span class="block text-xs opacity-70">
                {{ h.unrealized_pnl_pct >= 0 ? '+' : '' }}{{ fmt(h.unrealized_pnl_pct) }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>