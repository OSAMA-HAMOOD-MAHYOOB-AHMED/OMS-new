<template>
  <div class="card">
    <h2>Create Account</h2>
    <p class="muted">Register and choose your role for the demo.</p>

    <form class="form" @submit.prevent="submit">
      <label>
        <span>Name</span>
        <input v-model.trim="name" required />
      </label>
      <label>
        <span>Email</span>
        <input v-model.trim="email" type="email" required />
      </label>
      <label>
        <span>Phone</span>
        <input v-model.trim="phone" required />
      </label>
      <label>
        <span>Address</span>
        <input v-model.trim="address" required />
      </label>
      <label>
        <span>Role</span>
        <select v-model="role" required>
          <option>Customer</option>
          <option>Retail Salesperson</option>
          <option>Warehouse Manager</option>
        </select>
      </label>
      <label>
        <span>Password</span>
        <input v-model="password" type="password" required />
      </label>

      <button class="btn" :disabled="auth.loading">
        {{ auth.loading ? 'Creating...' : 'Sign Up' }}
      </button>
    </form>

    <p v-if="auth.error" class="error">{{ auth.error }}</p>

    <p class="muted">
      Already have an account?
      <RouterLink to="/login">Sign In</RouterLink>
    </p>
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
.card {
  max-width: 520px;
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
input,
select {
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

