import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface AuthUser {
  id: number
  username: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user  = ref<AuthUser | null>(
    (() => { try { return JSON.parse(localStorage.getItem('user') ?? 'null') } catch { return null } })()
  )

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  function setAuth(t: string, u: AuthUser) {
    token.value = t
    user.value  = u
    localStorage.setItem('token', t)
    localStorage.setItem('user',  JSON.stringify(u))
  }

  async function logout() {
    try {
      if (token.value) {
        await fetch('http://localhost:3000/auth/logout', {
          method:  'POST',
          headers: { Authorization: `Bearer ${token.value}` },
        })
      }
    } catch { /* server may be unreachable — still clear local state */ }

    token.value = null
    user.value  = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // navigate outside the store so we import router lazily
    const { default: router } = await import('../app/router.ts')
    router.push('/auth')
  }

  return { token, user, isLoggedIn, setAuth, logout }
})