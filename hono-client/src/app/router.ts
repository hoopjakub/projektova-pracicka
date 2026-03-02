import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // App routes — wrapped in AppShell
    {
      path: '/',
      component: AppShell,
      redirect: '/dashboard',
      children: [
        { path: 'dashboard',  component: () => import('@/pages/Dashboard.vue'),   name: 'Dashboard' },
        { path: 'market',     component: () => import('@/pages/Market.vue'),       name: 'Market' },
        { path: 'market/:symbol', component: () => import('@/pages/StockDetail.vue'), name: 'StockDetail' },
        { path: 'portfolio',  component: () => import('@/pages/Portfolio.vue'),    name: 'Portfolio' },
        { path: 'orders',     component: () => import('@/pages/Orders.vue'),       name: 'Orders' },
        { path: 'leaderboard',component: () => import('@/pages/Leaderboard.vue'), name: 'Leaderboard' },
        { path: 'news',       component: () => import('@/pages/News.vue'),         name: 'News' },
        { path: 'analytics',  component: () => import('@/pages/Analytics.vue'),    name: 'Analytics' },
        { path: 'profile',    component: () => import('@/pages/Profile.vue'),      name: 'Profile' },
        { path: 'admin',      component: () => import('@/pages/Admin.vue'),        name: 'Admin' },
      ],
    },
    // Auth routes — wrapped in AuthLayout
    {
      path: '/auth',
      component: AuthLayout,
      children: [
        { path: '',       component: () => import('@/pages/Login.vue'),    name: 'Login' },
        { path: 'register', component: () => import('@/pages/Register.vue'), name: 'Register' },
      ],
    },
    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

export default router
