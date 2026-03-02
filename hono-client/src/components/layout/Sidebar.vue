<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const route  = useRoute()
const router = useRouter()
const ui     = useUiStore()

interface NavItem { label: string; path: string; icon: string }

const mainNav: NavItem[] = [
  { label: 'Dashboard',   path: '/dashboard',  icon: 'dashboard'   },
  { label: 'Market',      path: '/market',      icon: 'market'      },
  { label: 'Portfolio',   path: '/portfolio',   icon: 'portfolio'   },
  { label: 'Orders',      path: '/orders',      icon: 'orders'      },
  { label: 'Leaderboard', path: '/leaderboard', icon: 'leaderboard' },
  { label: 'News',        path: '/news',        icon: 'news'        },
  { label: 'Analytics',   path: '/analytics',   icon: 'analytics'   },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <aside class="flex flex-col w-[164px] shrink-0 bg-bg-1 border-r border-border overflow-hidden left-px-5">
    <!-- Brand -->
    <div class="flex items-center h-16 px-5 shrink-0 border-b border-border">
      <button class="flex items-center gap-3 w-full h-full min-w-0">
        <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/15 text-accent shrink-0" style="margin-left: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            <polyline points="16 7 22 7 22 13"/>
          </svg>
        </span>
        <span class="text-sm font-semibold text-text leading-tight text-left whitespace-nowrap overflow-hidden">
          StockMarket<br/><span class="text-muted font-normal text-xs">Simulator</span>
        </span>
      </button>
    </div>

    <!-- Main nav -->
    <nav class="flex-1 pt-0 pb-3 px-2 overflow-y-auto overflow-x-hidden">
      <ul class="flex flex-col gap-0">
        <li v-for="(item, idx) in mainNav" :key="item.path">
          <button
            class="group relative flex items-center gap-3 w-full h-11 px-3 transition-colors duration-150"
            :class="isActive(item.path)
              ? 'bg-accent/12 text-accent'
              : 'text-muted hover:text-text hover:bg-panel-2'"
            @click="navigate(item.path)"
          >
            <span v-if="isActive(item.path)" class="absolute left-0 top-2 bottom-2 w-[3px] bg-accent rounded-r"/>
            <span class="shrink-0 flex items-center justify-center w-5 h-5" style="margin-left: 8px;">
              <svg v-if="item.icon === 'dashboard'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
              <svg v-else-if="item.icon === 'market'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
              <svg v-else-if="item.icon === 'portfolio'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="9"/><path d="M12 3v9l5 3"/>
              </svg>
              <svg v-else-if="item.icon === 'orders'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
              <svg v-else-if="item.icon === 'leaderboard'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
              <svg v-else-if="item.icon === 'news'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/>
                <polyline points="14 2 14 8 20 8"/><path d="M2 15h10M2 19h7"/>
              </svg>
              <svg v-else-if="item.icon === 'analytics'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6"  y1="20" x2="6"  y2="14"/>
              </svg>
            </span>
            <span class="text-sm font-medium whitespace-nowrap overflow-hidden">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>

    <!-- Bottom strip: admin + settings + logout -->
    <div class="py-3 px-2 border-t border-border shrink-0">
      <ul class="flex flex-col gap-0.5">
        <!-- Admin — only if user is admin -->
        <li v-if="ui.user.isAdmin">
          <button
            class="group relative flex items-center gap-3 w-full h-11 px-3 transition-colors duration-150"
            :class="isActive('/admin') ? 'bg-accent/12 text-accent' : 'text-muted hover:text-text hover:bg-panel-2'"
            @click="navigate('/admin')"
          >
            <span v-if="isActive('/admin')" class="absolute left-0 top-2 bottom-2 w-[3px] bg-accent rounded-r" />
            <span class="shrink-0 flex items-center justify-center w-5 h-5" style="margin-left: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </span>
            <span class="text-sm font-medium">Admin</span>
          </button>
        </li>

        <!-- Settings -->
        <li>
          <button
            class="group relative flex items-center gap-3 w-full h-11 px-3 transition-colors duration-150"
            :class="isActive('/profile') ? 'bg-accent/12 text-accent' : 'text-muted hover:text-text hover:bg-panel-2'"
            @click="navigate('/profile')"
          >
            <span v-if="isActive('/profile')" class="absolute left-0 top-2 bottom-2 w-[3px] bg-accent rounded-r" />
            <span class="shrink-0 flex items-center justify-center w-5 h-5" style="margin-left: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              >
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </span>
            <span class="text-sm font-medium">Settings</span>
          </button>
        </li>

        <!-- Log Out -->
        <li>
          <button
            class="group relative flex items-center gap-3 w-full h-11 px-3 text-muted hover:text-danger hover:bg-danger/8 transition-colors duration-150"
          >
            <span class="absolute left-0 top-2 bottom-2 w-[3px] bg-danger rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-150"/>
            <span class="shrink-0 flex items-center justify-center w-5 h-5" style="margin-left: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span class="text-sm font-medium">Log Out</span>
          </button>
        </li>
      </ul>

      <!-- Game Day footer -->
      <div class="mt-3 px-3 py-2 bg-panel border border-border">
        <p class="text-[10px] text-muted uppercase tracking-widest font-medium mb-0.5" style="margin-left: 8px;">Season {{ ui.season }}</p>
        <p class="text-xs text-text font-semibold" style="margin-left: 8px;">Day {{ ui.gameDay }}</p>
      </div>
    </div>
  </aside>
</template>
