<template>
  <div class="auth-bg">
    <div class="auth-glow" />

    <div class="auth-panel" :class="{ 'auth-panel--wide': mode === 'signup' }">
      <!-- Single form wraps everything so all fields submit together -->
      <form class="auth-inner" @submit.prevent="submit" novalidate>

        <!-- ══ LEFT side panel — identity fields ══ -->
        <div class="auth-side auth-side--left" :class="{ 'auth-side--visible': mode === 'signup' }">
          <p class="auth-side-label">Account</p>

          <div class="auth-field">
            <label class="auth-label">Username</label>
            <input v-model="form.username" type="text" autocomplete="username"
              placeholder="tradername" class="auth-input"
              :class="{ 'auth-input--error': fe.username }" />
            <span v-if="fe.username" class="auth-field-error">{{ fe.username }}</span>
          </div>

          <div class="auth-field">
            <label class="auth-label">Full Legal Name</label>
            <input v-model="form.full_name" type="text" autocomplete="name"
              placeholder="John Doe" class="auth-input"
              :class="{ 'auth-input--error': fe.full_name }" />
            <span v-if="fe.full_name" class="auth-field-error">{{ fe.full_name }}</span>
          </div>

          <div class="auth-field">
            <label class="auth-label">Country</label>
            <select v-model="form.country" class="auth-input auth-select">
              <option value="">— Select —</option>
              <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <!-- ══ CENTER — core credentials (always the same) ══ -->
        <div class="auth-form-wrap">
          <Transition name="title-fade" mode="out-in">
            <h1 :key="mode" class="auth-title">{{ mode === 'signin' ? 'SIGN IN' : 'SIGN UP' }}</h1>
          </Transition>

          <Transition name="slide-down">
            <div v-if="error" class="auth-error">{{ error }}</div>
          </Transition>

          <div class="auth-fields">
            <!-- Email -->
            <div class="auth-field">
              <label class="auth-label">Email</label>
              <input v-model="form.email" type="email" autocomplete="email"
                placeholder="you@example.com" class="auth-input"
                :class="{ 'auth-input--error': fe.email }" />
              <span v-if="fe.email" class="auth-field-error">{{ fe.email }}</span>
            </div>

            <!-- Password -->
            <div class="auth-field">
              <label class="auth-label">Password</label>
              <div class="auth-input-wrap">
                <input v-model="form.password" :type="showPass ? 'text' : 'password'"
                  autocomplete="current-password" placeholder="••••••••" class="auth-input"
                  :class="{ 'auth-input--error': fe.password }" />
                <button type="button" class="auth-eye" @click="showPass = !showPass" tabindex="-1">
                  {{ showPass ? '🙈' : '👁' }}
                </button>
              </div>
              <span v-if="fe.password" class="auth-field-error">{{ fe.password }}</span>
            </div>
          </div>

          <button type="submit" class="auth-btn" :disabled="loading">
            <span v-if="!loading">{{ mode === 'signin' ? 'Sign In' : 'Create Account' }}</span>
            <span v-else class="auth-spinner" />
          </button>

          <p class="auth-switch">
            <template v-if="mode === 'signin'">
              No account? <button type="button" class="auth-switch-btn" @click="switchMode('signup')">Create one</button>
            </template>
            <template v-else>
              Already registered? <button type="button" class="auth-switch-btn" @click="switchMode('signin')">Sign in</button>
            </template>
          </p>
        </div>

        <!-- ══ RIGHT side panel — extra profile fields ══ -->
        <div class="auth-side auth-side--right" :class="{ 'auth-side--visible': mode === 'signup' }">
          <p class="auth-side-label">Profile</p>

          <div class="auth-field">
            <label class="auth-label">Confirm Password</label>
            <input v-model="form.confirm" :type="showPass ? 'text' : 'password'"
              autocomplete="new-password" placeholder="••••••••" class="auth-input"
              :class="{ 'auth-input--error': fe.confirm }" />
            <span v-if="fe.confirm" class="auth-field-error">{{ fe.confirm }}</span>
          </div>

          <div class="auth-field">
            <label class="auth-label">Profession</label>
            <input v-model="form.profession" type="text"
              placeholder="e.g. Software Engineer" class="auth-input" />
          </div>

          <div class="auth-field">
            <label class="auth-label">Date of Birth</label>
            <input v-model="form.date_of_birth" type="date" class="auth-input auth-date" />
          </div>

          <div class="auth-field">
            <label class="auth-label">Bio <span class="auth-label-opt">(optional)</span></label>
            <textarea v-model="form.bio" rows="2" maxlength="300"
              placeholder="Short intro…" class="auth-input auth-textarea" />
          </div>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth   = useAuthStore()

type Mode = 'signin' | 'signup'

const mode     = ref<Mode>('signin')
const loading  = ref(false)
const error    = ref('')
const showPass = ref(false)

const form = reactive({
  username:      '',
  full_name:     '',
  country:       '',
  email:         '',
  password:      '',
  confirm:       '',
  profession:    '',
  date_of_birth: '',
  bio:           '',
})

const fe = reactive({
  username: '', full_name: '', email: '', password: '', confirm: '',
})

const countries = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Belgium',
  'Bolivia','Brazil','Canada','Chile','China','Colombia','Croatia','Czech Republic',
  'Denmark','Ecuador','Egypt','Finland','France','Germany','Ghana','Greece',
  'Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
  'Japan','Jordan','Kazakhstan','Kenya','South Korea','Malaysia','Mexico',
  'Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru',
  'Philippines','Poland','Portugal','Romania','Russia','Saudi Arabia',
  'Serbia','Singapore','Slovakia','South Africa','Spain','Sri Lanka','Sweden',
  'Switzerland','Thailand','Turkey','Uganda','Ukraine','United Kingdom',
  'United States','Venezuela','Vietnam','Zimbabwe',
]

function validate(): boolean {
  Object.assign(fe, { username: '', full_name: '', email: '', password: '', confirm: '' })
  error.value = ''
  let ok = true

  if (mode.value === 'signup') {
    if (form.username.trim().length < 3)               { fe.username  = 'At least 3 characters'; ok = false }
    if (form.full_name.trim().length < 2)              { fe.full_name = 'Required'; ok = false }
    if (form.password !== form.confirm)                { fe.confirm   = 'Passwords do not match'; ok = false }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { fe.email    = 'Invalid email'; ok = false }
  if (form.password.length < 8)                        { fe.password  = 'At least 8 characters'; ok = false }

  return ok
}

const API = 'http://localhost:3000'

async function submit() {
  if (!validate()) return
  loading.value = true
  error.value   = ''

  try {
    const endpoint = mode.value === 'signin' ? '/auth/login' : '/auth/register'
    const body: Record<string, string> = { email: form.email, password: form.password }

    if (mode.value === 'signup') {
      body.username  = form.username
      body.full_name = form.full_name
      if (form.country)       body.country       = form.country
      if (form.profession)    body.profession    = form.profession
      if (form.date_of_birth) body.date_of_birth = form.date_of_birth
      if (form.bio)           body.bio           = form.bio
    }

    const res  = await fetch(`${API}${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok) { error.value = data.error ?? 'Something went wrong'; return }

    auth.setAuth(data.token, data.user)
    router.push('/dashboard')
  } catch {
    error.value = 'Network error — is the server running?'
  } finally {
    loading.value = false
  }
}

function switchMode(next: Mode) {
  mode.value = next
  error.value = ''
  Object.assign(fe,   { username: '', full_name: '', email: '', password: '', confirm: '' })
  Object.assign(form, { username: '', full_name: '', country: '', email: '',
                        password: '', confirm: '', profession: '', date_of_birth: '', bio: '' })
}
</script>

<style scoped>
.auth-bg {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-0);
  overflow-y: auto;
  padding: 40px 20px;
  z-index: 10;
}
.auth-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 50% at 50% 45%,
    hsl(157 78% 42% / 0.07) 0%, transparent 70%);
  pointer-events: none;
}

/* ── panel ── */
.auth-panel {
  position: relative;
  width: 440px;
  min-height: 520px;
  border-radius: 18px;
  background: hsl(222 24% 12% / 0.88);
  border: 1px solid var(--color-border);
  box-shadow: 0 24px 64px rgba(0,0,0,0.55);
  backdrop-filter: blur(12px);
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.auth-panel--wide { width: 950px; }

/* ── flex row ── */
.auth-inner {
  display: flex;
  align-items: stretch;
  min-height: 520px;
}

/* ── side panels ── */
.auth-side {
  width: 0;
  overflow: hidden;
  opacity: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex-shrink: 0;
  transition:
    width   0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.28s ease 0.12s,
    padding 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.auth-side--visible {
  width: 235px;
  opacity: 1;
  padding: 36px 22px;
}
.auth-side--left  { border-right: 1px solid var(--color-border); }
.auth-side--right { border-left:  1px solid var(--color-border); }

.auth-side-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
  margin-bottom: 4px;
  white-space: nowrap;
}

/* ── center ── */
.auth-form-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 40px 36px;
}
.auth-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-text);
  margin-bottom: 20px;
}

.auth-error {
  background: hsl(0 72% 55% / 0.15);
  border: 1px solid hsl(0 72% 55% / 0.45);
  color: var(--color-danger);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  margin-bottom: 14px;
}

.auth-fields { display: flex; flex-direction: column; gap: 14px; flex: 1; }

/* ── shared field ── */
.auth-field { display: flex; flex-direction: column; gap: 5px; }
.auth-label {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.05em; text-transform: uppercase;
  color: var(--color-muted);
}
.auth-label-opt { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 10px; }

.auth-input-wrap { position: relative; display: flex; align-items: center; }
.auth-input {
  width: 100%;
  background: hsl(222 32% 9%);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 8px 11px;
  font-size: 13px;
  color: var(--color-text);
  outline: none;
  font-family: var(--font-sans);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.auth-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px hsl(157 78% 42% / 0.15);
}
.auth-input--error { border-color: var(--color-danger) !important; }
.auth-input-wrap .auth-input { padding-right: 34px; }

.auth-select {
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
}
.auth-select option { background: hsl(222 32% 9%); }

.auth-date::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }

.auth-textarea {
  resize: none;
  line-height: 1.5;
}

.auth-eye {
  position: absolute; right: 10px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; color: var(--color-muted); padding: 0; line-height: 1;
}
.auth-field-error { font-size: 11px; color: var(--color-danger); }

/* ── button ── */
.auth-btn {
  display: flex; align-items: center; justify-content: center;
  background: var(--color-accent);
  color: hsl(222 38% 7%);
  font-weight: 700; font-size: 14px; letter-spacing: 0.03em;
  border: none; border-radius: 10px;
  padding: 11px; margin-top: 18px;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease;
}
.auth-btn:hover:not(:disabled) {
  background: hsl(157 78% 36%);
  box-shadow: 0 0 18px hsl(157 78% 42% / 0.4);
}
.auth-btn:active:not(:disabled) { transform: scale(0.97); }
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.auth-spinner {
  width: 16px; height: 16px;
  border: 2px solid hsl(222 38% 7% / 0.3);
  border-top-color: hsl(222 38% 7%);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.auth-switch { margin-top: 16px; font-size: 12px; color: var(--color-muted); text-align: center; }
.auth-switch-btn {
  background: none; border: none; color: var(--color-accent);
  cursor: pointer; font-size: 12px; font-weight: 600;
  padding: 0 0 0 4px;
  text-decoration: underline; text-underline-offset: 2px;
}
.auth-switch-btn:hover { color: hsl(157 78% 55%); }

/* ── transitions ── */
.title-fade-enter-active,
.title-fade-leave-active { transition: opacity 0.16s ease, transform 0.16s ease; }
.title-fade-enter-from   { opacity: 0; transform: translateY(-5px); }
.title-fade-leave-to     { opacity: 0; transform: translateY(5px); }

.slide-down-enter-active,
.slide-down-leave-active { transition: opacity 0.22s ease, max-height 0.22s ease; overflow: hidden; }
.slide-down-enter-from   { opacity: 0; max-height: 0; }
.slide-down-enter-to     { max-height: 80px; }
.slide-down-leave-to     { opacity: 0; max-height: 0; }
</style>