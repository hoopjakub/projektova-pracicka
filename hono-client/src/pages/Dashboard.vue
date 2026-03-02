<template>
  <div>
    <h1 class="text-xl font-semibold text-text mb-1">Dashboard</h1>
    <p class="text-sm text-muted mb-6">Your portfolio overview — coming soon.</p>

    <!-- Placeholder metric row -->
    <div class="grid grid-cols-4 gap-5 mb-6">
      <div v-for="card in metricCards" :key="card.label"
        class="bg-panel border border-border rounded-2xl p-5
        "
        style="box-shadow: var(--shadow-card); padding: 5px;"
      >
        <p class="text-xs text-muted uppercase tracking-wide mb-3" style="margin-bottom: 4px;">{{ card.label }}</p>
        <p class="text-3xl font-semibold text-text font-mono" style="margin-bottom: 4px;">{{ card.value }}</p>
        <p class="text-xs mt-2" :class="card.change >= 0 ? 'text-success' : 'text-danger'">
          {{ card.change >= 0 ? '▲' : '▼' }} {{ Math.abs(card.change) }}% today
        </p>
      </div>
    </div>

    <!-- Placeholder chart area -->
    <div class="grid grid-cols-12 gap-5" style="margin-top: 12px;">
      <div class="col-span-7 bg-panel border border-border rounded-2xl p-5 flex items-center justify-center h-64" style="box-shadow: var(--shadow-card)">
        <p class="text-muted text-sm">Portfolio chart — implementation coming</p>
      </div>
      <div class="col-span-5 bg-panel border border-border rounded-2xl p-5 flex items-center justify-center h-64" style="box-shadow: var(--shadow-card)">
        <p class="text-muted text-sm">Allocation donut — coming</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const metricCards = [
  { label: 'Net Worth',    value: '$24,850', change: 2.3  },
  { label: 'Cash Balance', value: '$8,120',  change: 0    },
  { label: "Today's P/L",  value: '+$412',   change: 1.7  },
  { label: 'Open Orders',  value: '3',       change: 0    },
]
</script>
