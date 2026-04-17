<template>
  <div class="layout">
    <header class="topbar">
      <div class="brand" @click="$router.push({ name: 'home' })">
        <span class="logo">AW</span>
        <span class="title">Al-Wakeel Al-Shamel OMS</span>
      </div>

      <nav class="nav">
        <RouterLink class="link" to="/">Home</RouterLink>
        <RouterLink v-if="isAuthed && role === 'Customer'" class="link" to="/products">Products</RouterLink>
        <RouterLink v-if="isAuthed && role === 'Customer'" class="link" to="/cart">Cart</RouterLink>
        <RouterLink v-if="isAuthed && role === 'Warehouse Manager'" class="link" to="/warehouse/inventory">Inventory</RouterLink>
        <RouterLink v-if="isAuthed && role === 'Retail Salesperson'" class="link" to="/dashboard/sales">Sales Dashboard</RouterLink>
        <RouterLink v-if="isAuthed && role === 'Warehouse Manager'" class="link" to="/dashboard/warehouse">Warehouse Dashboard</RouterLink>
      </nav>

      <div class="actions">
        <RouterLink v-if="!isAuthed" class="btn btn-secondary" to="/register">Sign Up</RouterLink>
        <RouterLink v-if="!isAuthed" class="btn" to="/login">Login</RouterLink>
        <button v-else class="btn" @click="logout">Logout</button>
      </div>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
auth.hydrate()

const isAuthed = computed(() => !!auth.token)
const role = computed(() => auth.role)

function logout() {
  auth.logout()
}
</script>

<style scoped>
.layout {
  min-height: 100svh;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(120deg, rgba(0, 122, 255, 0.12), rgba(0, 200, 150, 0.10));
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}
.logo {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  background: radial-gradient(circle at top left, #00c896, #007aff);
}
.title {
  color: var(--text-h);
  font-weight: 600;
  letter-spacing: -0.2px;
}
.nav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.link {
  color: var(--text-h);
  text-decoration: none;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
}
.link.router-link-active {
  border-color: var(--border);
  background: rgba(255, 255, 255, 0.35);
}
.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.btn {
  border: 0;
  cursor: pointer;
  background: #007aff;
  color: white;
  padding: 9px 12px;
  border-radius: 10px;
  font-weight: 600;
}
.btn-secondary {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-h);
}
.content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 60px;
}
</style>
