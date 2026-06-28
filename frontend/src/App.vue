<template>
  <div class="layout" :class="{ admin: isAdminShell }">
    <header v-if="isAdminShell" class="adminTopbar">
      <div class="adminBrand" @click="$router.push({ name: 'adminDashboard' })">
        <img class="adminLogo" :src="siteLogoUrl" alt="Al-Wakeel Al-Shamel" />
        <div class="adminBrandText">
          <div class="adminBrandTitle">Admin Panel</div>
          <div class="adminBrandSub">Al-Wakeel Al-Shamel</div>
        </div>
      </div>

      <button
        class="menuBtn adminMenuBtn"
        type="button"
        :aria-expanded="adminNavOpen ? 'true' : 'false'"
        aria-label="Toggle admin menu"
        @click="adminNavOpen = !adminNavOpen"
      >
        {{ adminNavOpen ? '✕' : '☰' }}
      </button>

      <nav class="adminNav" :class="{ open: adminNavOpen }">
        <RouterLink class="adminLink" :class="{ active: isActive('adminDashboard') }" to="/admin/dashboard" @click="closeNav">
          Dashboard
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminProducts') }" to="/admin/products" @click="closeNav">
          Products
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminOrders') }" to="/admin/orders" @click="closeNav"> Orders </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminCustomers') }" to="/admin/customers" @click="closeNav">
          Customers
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminReports') }" to="/admin/reports" @click="closeNav"> Reports </RouterLink>
      </nav>

      <div class="adminActions">
        <div v-if="isAuthed" class="adminEmail">{{ auth.email }}</div>
        <button v-if="isAuthed" class="adminLogout" type="button" @click="logout">Logout</button>
        <RouterLink v-else class="adminLogout" to="/admin/login">Login</RouterLink>
      </div>
    </header>

    <header v-else class="topbar">
      <div class="brand" @click="$router.push({ name: 'home' })">
        <img class="logo" :src="siteLogoUrl" alt="Al-Wakeel Al-Shamel" />
        <div class="brandText">
          <div class="title">Al-Wakeel Al-Shamel</div>
        </div>
      </div>

      <button
        class="menuBtn"
        type="button"
        :aria-expanded="navOpen ? 'true' : 'false'"
        aria-label="Toggle menu"
        @click="navOpen = !navOpen"
      >
        {{ navOpen ? '✕' : '☰' }}
      </button>

      <nav class="nav" :class="{ open: navOpen }">
        <RouterLink class="link" to="/" @click="closeNav">Home</RouterLink>

        <template v-if="isAuthed && role === 'Customer'">
          <RouterLink class="link" to="/products" @click="closeNav">Products</RouterLink>
          <RouterLink class="link" to="/customer/orders" @click="closeNav">Orders</RouterLink>
          <RouterLink class="link" to="/profile" @click="closeNav">Profile</RouterLink>
        </template>

        <template v-else-if="isAuthed && role === 'Retail Salesperson'">
          <RouterLink class="link" to="/dashboard/sales" @click="closeNav">Sales</RouterLink>
          <RouterLink class="link" to="/sales/orders" @click="closeNav">Orders</RouterLink>
        </template>

        <template v-else-if="isAuthed && role === 'Warehouse Manager'">
          <RouterLink class="link" to="/products" @click="closeNav">Products</RouterLink>
          <RouterLink class="link" to="/warehouse/inventory" @click="closeNav">Inventory</RouterLink>
          <RouterLink class="link" to="/dashboard/warehouse" @click="closeNav">Dashboard</RouterLink>
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

    <ChatBot v-if="!isAdminShell" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'
import { siteLogoUrl } from './utils/images'
import ChatBot from './components/ChatBot.vue'

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

const navOpen = ref(false)
const adminNavOpen = ref(false)

function closeNav() {
  navOpen.value = false
  adminNavOpen.value = false
}

function isActive(name) {
  return route.name === name
}

watch(
  () => route.fullPath,
  () => closeNav(),
)

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
  object-fit: cover;
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
  object-fit: cover;
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

.menuBtn {
  display: none;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-h);
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.adminMenuBtn {
  border-color: rgba(148, 163, 184, 0.25);
  background: rgba(148, 163, 184, 0.1);
  color: #e2e8f0;
}

@media (max-width: 768px) {
  .topbar,
  .adminTopbar {
    flex-wrap: wrap;
    padding: 10px 12px;
    gap: 10px;
  }

  .brand,
  .adminBrand {
    min-width: 0;
    flex: 1 1 auto;
  }

  .subtitle,
  .adminBrandSub {
    display: none;
  }

  .title,
  .adminBrandTitle {
    font-size: 15px;
  }

  .actions,
  .adminActions {
    min-width: 0;
    gap: 8px;
  }

  .adminEmail {
    display: none;
  }

  .menuBtn {
    display: inline-flex;
  }

  .nav,
  .adminNav {
    display: none;
    flex-basis: 100%;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    padding-top: 6px;
    border-top: 1px solid var(--border);
  }

  .adminNav {
    border-top-color: rgba(148, 163, 184, 0.2);
  }

  .nav.open,
  .adminNav.open {
    display: flex;
  }

  .link,
  .adminLink {
    text-align: center;
    border-radius: 12px;
    padding: 12px;
  }

  .btn {
    padding: 9px 11px;
    font-size: 14px;
  }

  .content,
  .content.wide {
    width: calc(100% - 24px);
    padding: 16px 0 32px;
  }
}

@media (max-width: 420px) {
  .actions .btnGhost:not(.iconBtn) {
    padding: 9px 10px;
  }
}
</style>
