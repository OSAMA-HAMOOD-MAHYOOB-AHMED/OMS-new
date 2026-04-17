<template>
  <div class="card">
    <h2>Admin Login</h2>
    <p class="muted">Sign in with an Admin account.</p>

    <form class="form" @submit.prevent="submit">
      <label>
        <span>Email</span>
        <input v-model.trim="email" type="email" required />
      </label>
      <label>
        <span>Password</span>
        <input v-model="password" type="password" required />
      </label>

      <button class="btn" :disabled="auth.loading">
        {{ auth.loading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <p v-if="auth.error" class="error">{{ auth.error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')

async function submit() {
  const ok = await auth.login({ email: email.value, password: password.value })
  if (!ok) return
  if (auth.role !== 'Admin') {
    auth.logout()
    return
  }
  router.push({ name: 'adminDashboard' })
}
</script>

<style scoped>
.card {
  max-width: 440px;
  margin: 10px auto;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
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
  background: #111827;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
}
.muted {
  margin-top: 8px;
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

