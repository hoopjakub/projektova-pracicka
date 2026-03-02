<script setup lang="ts">
import Sidebar   from '@/components/layout/Sidebar.vue'
import Topbar    from '@/components/layout/Topbar.vue'
import Bottombar from '@/components/layout/Bottombar.vue'
</script>

<template>
  <div class="flex flex-col h-screen w-screen overflow-hidden bg-bg-0 text-text">

    <!-- Top section: sidebar + main (fills all space above bottombar) -->
    <div class="flex flex-1 min-h-0">
      <Sidebar />

      <div class="flex flex-col flex-1 min-w-0">
        <Topbar />

        <main class="flex-1 overflow-y-auto p-6 bg-bg-0" style="margin-left: 8px; margin-right: 8px;">
          <RouterView />
        </main>
      </div>
    </div>

    <!-- Bottombar: always full width, always at the bottom -->
    <Bottombar />

  </div>
</template>
