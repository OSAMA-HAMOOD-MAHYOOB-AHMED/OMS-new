<template>
  <div class="layout" :class="{ admin: isAdminShell }">
    <header v-if="isAdminShell" class="adminTopbar">
      <div class="adminBrand" @click="$router.push({ name: 'adminDashboard' })">
        <span class="adminLogo">AW</span>
        <div class="adminBrandText">
          <div class="adminBrandTitle">Admin Panel</div>
          <div class="adminBrandSub">Al-Wakeel Al-Shamel</div>
        </div>
      </div>

      <nav class="adminNav">
        <RouterLink class="adminLink" :class="{ active: isActive('adminDashboard') }" to="/admin/dashboard">
          Dashboard
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminProducts') }" to="/admin/products">
          Products
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminOrders') }" to="/admin/orders"> Orders </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminCustomers') }" to="/admin/customers">
          Customers
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminReports') }" to="/admin/reports"> Reports </RouterLink>
      </nav>

      <div class="adminActions">
        <div v-if="isAuthed" class="adminEmail">{{ auth.email }}</div>
        <button v-if="isAuthed" class="adminLogout" type="button" @click="logout">Logout</button>
        <RouterLink v-else class="adminLogout" to="/admin/login">Login</RouterLink>
      </div>
    </header>

    <header v-else class="topbar">
      <div class="brand" @click="$router.push({ name: 'home' })">
        <span class="logo">AW</span>
        <div class="brandText">
          <div class="title">Al-Wakeel Al-Shamel</div>
          <div class="subtitle">Order Management</div>
        </div>
      </div>

      <nav class="nav">
        <RouterLink class="link" to="/">Home</RouterLink>

        <template v-if="isAuthed && role === 'Customer'">
          <RouterLink class="link" to="/products">Products</RouterLink>
          <RouterLink class="link" to="/customer/orders">Orders</RouterLink>
          <RouterLink class="link" to="/profile">Profile</RouterLink>
        </template>

        <template v-else-if="isAuthed && role === 'Retail Salesperson'">
          <RouterLink class="link" to="/dashboard/sales">Sales</RouterLink>
          <RouterLink class="link" to="/sales/orders">Orders</RouterLink>
        </template>

        <template v-else-if="isAuthed && role === 'Warehouse Manager'">
          <RouterLink class="link" to="/products">Products</RouterLink>
          <RouterLink class="link" to="/warehouse/inventory">Inventory</RouterLink>
          <RouterLink class="link" to="/dashboard/warehouse">Dashboard</RouterLink>
        </template>
      </nav>

      <div class="actions">
        <RouterLink v-if="isAuthed && role === 'Customer'" class="iconBtn" to="/cart" aria-label="Cart">
          <span class="cartIcon" aria-hidden="true">🛒</span>
          <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
        </RouterLink>

        <template v-if="!isAuthed">
          <RouterLink class="btn btnGhost" to="/register">Sign Up</RouterLink>
          <RouterLink class="btn btnPrimary" to="/login">
            <span class="loginGlyph" aria-hidden="true">👤</span>
            Login
          </RouterLink>
        </template>
        <button v-else class="btn btnGhost" type="button" @click="logout">
          <span class="loginGlyph" aria-hidden="true">⎋</span>
          Logout
        </button>
      </div>
    </header>

    <main class="content" :class="{ wide: isAdminShell }">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'

const auth = useAuthStore()
auth.hydrate()

const cart = useCartStore()
cart.hydrate()

const route = useRoute()
const router = useRouter()

const isAuthed = computed(() => !!auth.token)
const role = computed(() => auth.role)

const isAdminShell = computed(() => {
  if (!isAuthed.value) return false
  if (role.value !== 'Admin') return false
  // Keep admin login page on the public shell (matches mock)
  return route.name !== 'adminLogin'
})

const cartCount = computed(() => cart.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0))

function isActive(name) {
  return route.name === name
}

watch(
  () => auth.token,
  (token, prevToken) => {
    if (!prevToken || token) return

    const isAdminArea = String(route.path || '').startsWith('/admin')
    if (isAdminArea) {
      router.replace({ name: 'adminLogin' }).catch(() => {})
      return
    }

    if (route.name === 'login' || route.name === 'register' || route.name === 'adminLogin') return
    router.replace({ name: 'login', query: { next: route.fullPath } }).catch(() => {})
  },
  { flush: 'post' },
)

async function logout() {
  const wasAdmin = role.value === 'Admin'
  const current = route.fullPath

  auth.logout()

  // After logout, don't leave the user on an authenticated-only screen.
  if (wasAdmin) {
    await router.replace({ name: 'adminLogin' }).catch(() => {})
    return
  }

  if (route.name === 'login' || route.name === 'register' || route.name === 'adminLogin') return

  await router.replace({ name: 'login', query: { next: current } }).catch(() => {})
}
</script>

<style scoped>
.layout {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}

.layout.admin {
  background: #f8fafc;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  min-width: 220px;
}
.logo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: white;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, var(--brand-teal), var(--brand-blue));
  box-shadow: var(--shadow-sm);
}
.brandText {
  display: grid;
  gap: 2px;
}
.title {
  color: var(--text-h);
  font-weight: 800;
  letter-spacing: -0.2px;
  line-height: 1.1;
}
.subtitle {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}
.link {
  color: #334155;
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 650;
}
.link.router-link-active {
  border-color: rgba(37, 99, 235, 0.22);
  background: rgba(37, 99, 235, 0.08);
  color: var(--brand-blue-2);
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  min-width: 220px;
}

.btn {
  border: 0;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btnPrimary {
  background: var(--brand-blue);
  color: white;
  box-shadow: var(--shadow-sm);
}
.btnGhost {
  background: #ffffff;
  color: var(--text-h);
  border: 1px solid var(--border);
}

.loginGlyph {
  font-size: 14px;
  line-height: 1;
}

.iconBtn {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--text-h);
}
.cartIcon {
  font-size: 18px;
  line-height: 1;
}
.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 900;
  display: grid;
  place-items: center;
}

.content {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 22px 0 44px;
  flex: 1;
}
.content.wide {
  width: min(1280px, calc(100% - 40px));
}

/* Admin shell */
.adminTopbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: var(--admin-bg);
  color: var(--admin-text);
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}
.adminBrand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  min-width: 240px;
}
.adminLogo {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-weight: 900;
  color: white;
  background: linear-gradient(135deg, var(--brand-teal), var(--brand-blue));
}
.adminBrandTitle {
  font-weight: 900;
  letter-spacing: -0.2px;
}
.adminBrandSub {
  font-size: 12px;
  color: var(--admin-muted);
  font-weight: 650;
}
.adminNav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}
.adminLink {
  text-decoration: none;
  color: var(--admin-muted);
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 800;
  border: 1px solid transparent;
}
.adminLink:hover {
  color: #e2e8f0;
}
.adminLink.active {
  color: #ffffff;
  background: rgba(37, 99, 235, 0.95);
  border-color: rgba(37, 99, 235, 0.35);
}
.adminActions {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
  min-width: 260px;
}
.adminEmail {
  font-size: 12px;
  color: var(--admin-muted);
  font-weight: 700;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.adminLogout {
  border: 0;
  cursor: pointer;
  text-decoration: none;
  background: rgba(148, 163, 184, 0.12);
  color: #e2e8f0;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  border: 1px solid rgba(148, 163, 184, 0.18);
}
</style>
