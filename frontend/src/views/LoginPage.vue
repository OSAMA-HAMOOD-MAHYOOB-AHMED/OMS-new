<template>
  <div class="wrap">
    <div class="card">
      <img class="avatar" :src="siteLogoUrl" alt="Al-Wakeel Al-Shamel" />
      <h2 class="h2">Welcome Back</h2>
      <p class="sub">Sign in to your account</p>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span class="lbl">Email Address</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">✉</span>
            <input v-model.trim="email" type="email" placeholder="you@example.com" autocomplete="email" required />
          </div>
        </label>

        <label class="field">
          <span class="lbl">Password</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">🔒</span>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>
        </label>

        <button class="btn" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p v-if="sessionExpired" class="notice">Your session expired. Sign in again to continue.</p>
      <p v-if="auth.error" class="error">{{ auth.error }}</p>
      <p v-if="unverifiedEmail" class="notice">
        Your account is not verified yet.
        <RouterLink class="link" :to="{ name: 'verifyEmailPending', query: { email: unverifiedEmail } }">
          Resend verification email
        </RouterLink>
      </p>

      <p class="muted center">
        Don't have an account?
        <RouterLink class="link" to="/register">Sign Up</RouterLink>
      </p>

      <div class="divider" />

      <RouterLink class="adminLink" to="/admin/login">Admin Login →</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { siteLogoUrl } from '../utils/images'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const unverifiedEmail = ref('')
const sessionExpired = computed(() => route.query.reason === 'session-expired')

function roleHome(role) {
  if (role === 'Customer') return { name: 'products' }
  if (role === 'Retail Salesperson') return { name: 'salesDashboard' }
  if (role === 'Warehouse Manager') return { name: 'warehouseDashboard' }
  return { name: 'home' }
}

async function submit() {
  unverifiedEmail.value = ''
  const result = await auth.login({ email: email.value, password: password.value })
  if (result === 'unverified') {
    unverifiedEmail.value = email.value.trim().toLowerCase()
    return
  }
  if (result !== 'ok') return

  const next = route.query.next
  if (typeof next === 'string' && next.startsWith('/')) return router.push(next)
  return router.push(roleHome(auth.role))
}
</script>

<style scoped>
.wrap {
  min-height: calc(100svh - 140px);
  display: grid;
  place-items: center;
  padding: 18px 0;
}
.card {
  width: min(520px, 100%);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 22px 22px 18px;
  background: #ffffff;
  box-shadow: var(--shadow-md);
  text-align: center;
}
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  margin: 0 auto 10px;
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}
.h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 950;
  letter-spacing: -0.6px;
  color: var(--text-h);
}
.sub {
  margin: 8px 0 0;
  color: var(--muted);
  font-weight: 650;
}
.form {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  text-align: left;
}
.field {
  display: grid;
  gap: 8px;
}
.lbl {
  font-size: 12px;
  font-weight: 900;
  color: #334155;
}
.input {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
}
.glyph {
  color: var(--muted);
  width: 18px;
  display: grid;
  place-items: center;
}
input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-h);
  font-weight: 650;
}
.btn {
  border: 0;
  cursor: pointer;
  background: var(--brand-blue);
  color: white;
  padding: 12px 14px;
  border-radius: 12px;
  font-weight: 950;
  margin-top: 4px;
  box-shadow: var(--shadow-sm);
}
.muted {
  margin-top: 14px;
  color: var(--text);
  font-size: 14px;
}
.center {
  text-align: center;
}
.link {
  font-weight: 900;
}
.error {
  margin-top: 10px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
  text-align: left;
}
.notice {
  margin-top: 10px;
  color: #175cd3;
  background: rgba(23, 92, 211, 0.08);
  border: 1px solid rgba(23, 92, 211, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
  text-align: left;
  font-size: 14px;
}
.divider {
  height: 1px;
  background: var(--border);
  margin: 16px 0 12px;
}
.adminLink {
  display: inline-block;
  color: #334155;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
}
.adminLink:hover {
  color: var(--brand-blue);
}
</style>

