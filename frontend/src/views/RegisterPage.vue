<template>
  <div class="wrap">
    <div class="card">
      <h2 class="h2">Create Account</h2>
      <p class="sub">Sign up to start shopping</p>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span class="lbl">Full Name</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">👤</span>
            <input v-model.trim="name" placeholder="Ahmed Ali" autocomplete="name" required />
          </div>
        </label>

        <label class="field">
          <span class="lbl">Phone</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">📞</span>
            <input v-model.trim="phone" placeholder="+966 50 123 4567" autocomplete="tel" required />
          </div>
        </label>

        <label class="field">
          <span class="lbl">Email Address</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">✉</span>
            <input v-model.trim="email" type="email" placeholder="you@example.com" autocomplete="email" required />
          </div>
        </label>

        <label class="field">
          <span class="lbl">Address</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">📍</span>
            <input v-model.trim="address" placeholder="Riyadh, Saudi Arabia" autocomplete="street-address" required />
          </div>
        </label>

        <label class="field">
          <span class="lbl">Demo Role</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">🏷</span>
            <select v-model="role" class="select" required>
              <option>Customer</option>
              <option>Retail Salesperson</option>
              <option>Warehouse Manager</option>
            </select>
          </div>
        </label>

        <label class="field">
          <span class="lbl">Password</span>
          <div class="input">
            <span class="glyph" aria-hidden="true">🔒</span>
            <input v-model="password" type="password" placeholder="••••••••" autocomplete="new-password" required />
          </div>
        </label>

        <button class="btn" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Creating...' : 'Create Account' }}
        </button>
      </form>

      <p v-if="auth.error" class="error">{{ auth.error }}</p>

      <p class="muted center">
        Already have an account?
        <RouterLink class="link" to="/login">Sign In</RouterLink>
      </p>

      <div class="divider" />

      <RouterLink class="adminLink" to="/admin/login">Admin Login →</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const phone = ref('')
const address = ref('')
const role = ref('Customer')
const password = ref('')

function roleHome(r) {
  if (r === 'Customer') return { name: 'products' }
  if (r === 'Retail Salesperson') return { name: 'salesDashboard' }
  if (r === 'Warehouse Manager') return { name: 'warehouseDashboard' }
  return { name: 'home' }
}

async function submit() {
  const ok = await auth.register({
    name: name.value,
    email: email.value,
    phone: phone.value,
    address: address.value,
    role: role.value,
    password: password.value,
  })
  if (!ok) return
  router.push(roleHome(auth.role))
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
  width: min(560px, 100%);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 22px 22px 18px;
  background: #ffffff;
  box-shadow: var(--shadow-md);
  text-align: center;
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
.select {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-h);
  font-weight: 800;
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

