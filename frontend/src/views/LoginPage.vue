<template>
  <div class="card">
    <h2>Welcome Back</h2>
    <p class="muted">Sign in to your account</p>

    <form class="form" @submit.prevent="submit">
      <label>
        <span>Email</span>
        <input v-model.trim="email" type="email" placeholder="you@example.com" required />
      </label>
      <label>
        <span>Password</span>
        <input v-model="password" type="password" placeholder="••••••••" required />
      </label>

      <button class="btn" :disabled="auth.loading">
        {{ auth.loading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <p v-if="auth.error" class="error">{{ auth.error }}</p>

    <p class="muted">
      Don't have an account?
      <RouterLink to="/register">Sign Up</RouterLink>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

function roleHome(role) {
  if (role === 'Customer') return { name: 'products' }
  if (role === 'Retail Salesperson') return { name: 'salesDashboard' }
  if (role === 'Warehouse Manager') return { name: 'warehouseDashboard' }
  return { name: 'home' }
}

async function submit() {
  const ok = await auth.login({ email: email.value, password: password.value })
  if (!ok) return

  const next = route.query.next
  if (typeof next === 'string' && next.startsWith('/')) return router.push(next)
  return router.push(roleHome(auth.role))
}
</script>

<style scoped>
.card {
  max-width: 440px;
  margin: 10px auto;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px 18px 16px;
  background: rgba(255, 255, 255, 0.4);
  text-align: left;
}
.form {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}
label span {
  display: block;
  font-size: 14px;
  color: var(--text);
  margin-bottom: 6px;
}
input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
  color: var(--text-h);
  box-sizing: border-box;
}
.btn {
  border: 0;
  cursor: pointer;
  background: #007aff;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 700;
}
.muted {
  margin-top: 12px;
  color: var(--text);
  font-size: 14px;
}
.error {
  margin-top: 10px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}
</style>

