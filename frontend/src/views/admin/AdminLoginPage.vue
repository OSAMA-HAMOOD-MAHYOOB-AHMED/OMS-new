<template>
  <div class="wrap">
    <div class="card">
      <div class="avatar" aria-hidden="true">AW</div>
      <h2 class="h2">Admin Login</h2>
      <p class="sub">Sign in with an Admin account</p>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span class="lbl">Email Address</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">✉</span>
            <input v-model.trim="email" type="email" autocomplete="username" required />
          </div>
        </label>
        <label class="field">
          <span class="lbl">Password</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">🔒</span>
            <input v-model="password" type="password" autocomplete="current-password" required />
          </div>
        </label>

        <button class="btn" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p v-if="auth.error" class="error">{{ auth.error }}</p>
    </div>
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
  border-radius: 999px;
  margin: 0 auto 10px;
  display: grid;
  place-items: center;
  font-weight: 950;
  letter-spacing: 0.6px;
  color: #fff;
  background: linear-gradient(135deg, #0f172a, var(--brand-blue));
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
  background: #0f172a;
  color: white;
  padding: 12px 14px;
  border-radius: 12px;
  font-weight: 950;
  margin-top: 4px;
  box-shadow: var(--shadow-sm);
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
</style>

