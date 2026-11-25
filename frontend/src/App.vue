<template>
  <div class="layout" :class="{ admin: isAdminShell }">
    <header v-if="isAdminShell" class="adminTopbar">
      <div class="adminBrand" @click="$router.push({ name: 'adminDashboard' })">
        <img class="adminLogo" :src="siteLogoUrl" :alt="t('shell.name')" />
        <div class="adminBrandText">
          <div class="adminBrandTitle">{{ t('shell.adminPanel') }}</div>
          <div class="adminBrandSub">{{ t('shell.name') }}</div>
        </div>
      </div>

      <button
        class="menuBtn adminMenuBtn"
        type="button"
        :aria-expanded="adminNavOpen ? 'true' : 'false'"
        aria-controls="adminDrawer"
        :aria-label="t('shell.menu')"
        @click="adminNavOpen = !adminNavOpen"
      >
        <AppIcon name="menu" />
      </button>

      <div v-if="adminNavOpen" class="drawerBackdrop" aria-hidden="true" @click="closeNav" />
      <nav id="adminDrawer" class="adminNav" :class="{ open: adminNavOpen }" :aria-label="t('shell.menu')">
        <div class="drawerHead dark">
          <span class="drawerTitle">{{ t('shell.adminPanel') }}</span>
          <button class="drawerClose" type="button" :aria-label="t('shell.closeMenu')" @click="closeNav">
            <AppIcon name="close" />
          </button>
        </div>
        <RouterLink class="adminLink" :class="{ active: isActive('adminDashboard') }" to="/admin/dashboard" @click="closeNav">
          {{ t('shell.adminDashboard') }}
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminProducts') }" to="/admin/products" @click="closeNav">
          {{ t('shell.adminProducts') }}
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminOrders') }" to="/admin/orders" @click="closeNav">
          {{ t('shell.adminOrders') }}
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminCustomers') }" to="/admin/customers" @click="closeNav">
          {{ t('shell.adminCustomers') }}
        </RouterLink>
        <RouterLink class="adminLink" :class="{ active: isActive('adminReports') }" to="/admin/reports" @click="closeNav">
          {{ t('shell.adminReports') }}
        </RouterLink>
      </nav>

      <div class="adminActions">
        <button class="adminLang" type="button" :aria-label="t('shell.switchLanguage')" @click="toggleLocale">
          <AppIcon name="globe" :size="18" />
          {{ t('shell.otherLanguage') }}
        </button>
        <div v-if="isAuthed" class="adminEmail">{{ auth.email }}</div>
        <button v-if="isAuthed" class="adminLogout" type="button" @click="logout">{{ t('shell.logout') }}</button>
        <RouterLink v-else class="adminLogout" to="/admin/login">{{ t('shell.login') }}</RouterLink>
      </div>
    </header>

    <template v-else>
      <div v-if="showShopChrome" class="promo">{{ t('shell.promo') }}</div>

      <header class="topbar">
        <div class="topRow">
          <RouterLink class="brand" :to="{ name: 'home' }">
            <img class="logo" :src="siteLogoUrl" :alt="t('shell.name')" />
            <span class="brandText">
              <span class="title">{{ t('shell.name') }}</span>
              <span class="subtitle">{{ t('shell.tagline') }}</span>
            </span>
          </RouterLink>

          <form v-if="showShopChrome" class="search" role="search" @submit.prevent="submitSearch">
            <label class="srOnly" for="siteSearch">{{ t('shell.searchLabel') }}</label>
            <input id="siteSearch" v-model.trim="searchText" type="search" :placeholder="t('shell.searchPlaceholder')" />
            <button type="submit" class="searchBtn" :aria-label="t('shell.search')">
              <AppIcon name="search" />
            </button>
          </form>

          <div class="actions">
            <button class="ghostLink" type="button" :aria-label="t('shell.switchLanguage')" @click="toggleLocale">
              <AppIcon name="globe" />
              <span class="hideSm">{{ t('shell.otherLanguage') }}</span>
            </button>

            <template v-if="!isAuthed">
              <RouterLink class="ghostLink hideSm" to="/register">{{ t('shell.signup') }}</RouterLink>
              <RouterLink class="darkBtn" to="/login">
                <AppIcon name="user" />
                {{ t('shell.login') }}
              </RouterLink>
            </template>

            <template v-else>
              <RouterLink v-if="role === 'Customer'" class="ghostLink" to="/profile" :aria-label="t('shell.account')">
                <AppIcon name="user" />
                <span class="hideSm">{{ t('shell.account') }}</span>
              </RouterLink>
              <RouterLink v-if="role === 'Customer'" class="darkBtn" to="/cart" :aria-label="t('shell.cartLabel', { n: cartCount })">
                <AppIcon name="cart" />
                <span class="hideSm">{{ t('shell.cart') }}</span>
                <span class="badge">{{ cartCount }}</span>
              </RouterLink>
              <button class="ghostLink" type="button" :aria-label="t('shell.logout')" @click="logout">
                <AppIcon name="logout" />
                <span class="hideSm">{{ t('shell.logout') }}</span>
              </button>
            </template>

            <button
              class="menuBtn"
              type="button"
              :aria-expanded="navOpen ? 'true' : 'false'"
              aria-controls="siteDrawer"
              :aria-label="t('shell.menu')"
              @click="navOpen = !navOpen"
            >
              <AppIcon name="menu" />
            </button>
          </div>
        </div>

        <div v-if="navOpen" class="drawerBackdrop" aria-hidden="true" @click="closeNav" />
        <nav id="siteDrawer" class="nav" :class="{ open: navOpen }" :aria-label="t('shell.menu')">
          <div class="drawerHead">
            <img class="drawerLogo" :src="siteLogoUrl" alt="" />
            <span class="drawerTitle">{{ t('shell.name') }}</span>
            <button class="drawerClose" type="button" :aria-label="t('shell.closeMenu')" @click="closeNav">
              <AppIcon name="close" />
            </button>
          </div>
          <RouterLink class="pill" :class="{ on: route.name === 'home' }" to="/" @click="closeNav">{{ t('shell.home') }}</RouterLink>

          <template v-if="showShopChrome">
            <RouterLink class="pill" :class="{ on: route.name === 'products' && !route.query.cat }" to="/products" @click="closeNav">
              {{ t('cats.all') }}
            </RouterLink>
            <RouterLink
              v-for="c in shopCats"
              :key="c"
              class="pill"
              :class="{ on: route.name === 'products' && route.query.cat === c }"
              :to="{ name: 'products', query: { cat: c } }"
              @click="closeNav"
            >
              {{ t(`cats.${c}`) }}
            </RouterLink>
          </template>

          <template v-if="isAuthed && role === 'Customer'">
            <RouterLink class="pill" to="/customer/orders" @click="closeNav">{{ t('shell.orders') }}</RouterLink>
          </template>

          <template v-else-if="isAuthed && role === 'Retail Salesperson'">
            <RouterLink class="pill" to="/dashboard/sales" @click="closeNav">{{ t('shell.sales') }}</RouterLink>
            <RouterLink class="pill" to="/sales/orders" @click="closeNav">{{ t('shell.salesOrders') }}</RouterLink>
            <RouterLink class="pill" to="/profile" @click="closeNav">{{ t('shell.profile') }}</RouterLink>
          </template>

          <template v-else-if="isAuthed && role === 'Warehouse Manager'">
            <RouterLink class="pill" to="/dashboard/warehouse" @click="closeNav">{{ t('shell.dashboard') }}</RouterLink>
            <RouterLink class="pill" to="/warehouse/inventory" @click="closeNav">{{ t('shell.inventory') }}</RouterLink>
            <RouterLink class="pill" to="/products" @click="closeNav">{{ t('shell.products') }}</RouterLink>
            <RouterLink class="pill" to="/profile" @click="closeNav">{{ t('shell.profile') }}</RouterLink>
          </template>

          <div class="drawerFoot">
            <RouterLink v-if="isAuthed && role === 'Customer'" class="pill drawerOnly" to="/profile" @click="closeNav">
              <AppIcon name="user" :size="18" />{{ t('shell.account') }}
            </RouterLink>
            <RouterLink v-if="!isAuthed" class="pill drawerOnly" to="/register" @click="closeNav">
              <AppIcon name="user" :size="18" />{{ t('shell.signup') }}
            </RouterLink>
            <button class="pill drawerOnly" type="button" @click="toggleLocale">
              <AppIcon name="globe" :size="18" />{{ t('shell.otherLanguage') }}
            </button>
          </div>
        </nav>
      </header>
    </template>

    <main class="content" :class="{ wide: isAdminShell || route.name === 'home' }">
      <RouterView />
    </main>

    <footer v-if="!isAdminShell" class="footer">
      <div class="footerInner">
        <div class="footerCol">
          <img class="footerLogo" :src="siteLogoUrl" :alt="t('shell.name')" />
          <p class="footerAbout">{{ t('shell.footerAbout') }}</p>
        </div>
        <nav class="footerCol" :aria-label="t('shell.footerShop')">
          <span class="footerHead">{{ t('shell.footerShop') }}</span>
          <RouterLink v-for="c in shopCats" :key="c" :to="{ name: 'products', query: { cat: c } }">{{ t(`cats.${c}`) }}</RouterLink>
        </nav>
        <nav class="footerCol" :aria-label="t('shell.footerAccount')">
          <span class="footerHead">{{ t('shell.footerAccount') }}</span>
          <template v-if="isAuthed && role === 'Customer'">
            <RouterLink to="/customer/orders">{{ t('shell.orders') }}</RouterLink>
            <RouterLink to="/cart">{{ t('shell.cart') }}</RouterLink>
            <RouterLink to="/profile">{{ t('shell.profile') }}</RouterLink>
          </template>
          <template v-else-if="!isAuthed">
            <RouterLink to="/login">{{ t('shell.login') }}</RouterLink>
            <RouterLink to="/register">{{ t('shell.signup') }}</RouterLink>
          </template>
          <RouterLink v-else to="/profile">{{ t('shell.profile') }}</RouterLink>
        </nav>
      </div>
      <div class="footerBottom">
        <span>{{ t('shell.rights', { year: new Date().getFullYear() }) }}</span>
        <span>{{ t('shell.developedBy') }}</span>
      </div>
    </footer>

    <ChatBot v-if="!isAdminShell && !navOpen && route.name !== 'login' && route.name !== 'register' && route.name !== 'adminLogin'" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'
import { siteLogoUrl } from './utils/images'
import { useI18n } from './i18n'
import ChatBot from './components/ChatBot.vue'
import AppIcon from './components/AppIcon.vue'

const { t, toggleLocale } = useI18n()

const auth = useAuthStore()
auth.hydrate()

const cart = useCartStore()
cart.hydrate()

const route = useRoute()
const router = useRouter()

const isAuthed = computed(() => !!auth.token)
const role = computed(() => auth.role)

const shopCats = ['chargers', 'powerbanks', 'earphones', 'cases']

const isAdminShell = computed(() => {
  if (!isAuthed.value) return false
  if (role.value !== 'Admin') return false
  // Keep admin login page on the public shell (matches mock)
  return route.name !== 'adminLogin'
})

// Search bar, category pills and the promo strip are for shoppers (guests and customers).
const showShopChrome = computed(() => !isAuthed.value || role.value === 'Customer')

const cartCount = computed(() => cart.items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0))

const navOpen = ref(false)
const adminNavOpen = ref(false)
const searchText = ref('')

function closeNav() {
  navOpen.value = false
  adminNavOpen.value = false
}

// While a drawer is open: stop the page behind it from scrolling, and let Escape close it.
watch([navOpen, adminNavOpen], ([a, b]) => {
  document.body.style.overflow = a || b ? 'hidden' : ''
})

function onKey(e) {
  if (e.key === 'Escape' && (navOpen.value || adminNavOpen.value)) closeNav()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

function isActive(name) {
  return route.name === name
}

function submitSearch() {
  const q = searchText.value
  router.push({ name: 'products', query: q ? { q } : {} }).catch(() => {})
}

watch(
  () => route.fullPath,
  () => {
    closeNav()
    if (route.name === 'products') searchText.value = String(route.query.q || '')
  },
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

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.promo {
  background: var(--ink);
  color: #e9d9b8;
  font-size: 13px;
  text-align: center;
  padding: 8px 16px;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.topRow {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 14px 0 10px;
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--ink);
  flex-shrink: 0;
}
.logo {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: contain;
  background: #fff;
  border: 1px solid var(--border);
}
.brandText {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.title {
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 19px;
  color: var(--ink);
}
.subtitle {
  font-size: 12px;
  color: var(--text);
}

.search {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  background: var(--sand-2);
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  overflow: hidden;
}
.search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  height: 46px;
  padding: 0 16px;
  font-size: 15px;
  color: var(--ink);
  outline: none;
}
.searchBtn {
  width: 50px;
  height: 46px;
  border: 0;
  background: var(--gold);
  color: var(--ink);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-inline-start: auto;
}
.ghostLink {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  border: 0;
  background: transparent;
  color: var(--ink);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.ghostLink:hover {
  background: var(--sand-2);
}
.darkBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  background: var(--ink);
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.darkBtn:hover {
  background: #2a2620;
}
.badge {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: var(--gold);
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.nav {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 0 0 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  padding: 7px 16px;
  border-radius: 999px;
  background: var(--sand-2);
  color: var(--ink);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}
.pill:hover {
  background: var(--sand);
}
.pill.on,
.pill.router-link-exact-active:not([href='/products']) {
  background: var(--ink);
  color: #fff;
}

.content {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 48px;
  flex: 1;
}
.content.wide {
  width: min(1280px, calc(100% - 32px));
}

/* Drawer pieces only show on phones */
.drawerHead,
.drawerFoot,
.drawerBackdrop {
  display: none;
}

/* Footer */
.footer {
  background: var(--ink);
  color: #cfc7b8;
  margin-top: 24px;
}
.footerInner {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 44px 0 28px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 28px;
}
.footerCol {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}
.footerCol a {
  color: #cfc7b8;
  text-decoration: none;
}
.footerCol a:hover {
  color: var(--gold-light);
}
.footerLogo {
  width: 68px;
  height: 68px;
  border-radius: 16px;
  object-fit: contain;
  background: #fff;
}
.footerAbout {
  margin: 0;
  line-height: 1.8;
  max-width: 320px;
}
.footerHead {
  color: #fff;
  font-weight: 600;
  font-size: 15px;
}
.footerBottom {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 16px 0 26px;
  border-top: 1px solid #2e2a24;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: #a39a8a;
}

/* Admin shell */
.layout.admin {
  background: var(--bg);
}
.adminTopbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 18px;
  background: var(--admin-bg);
  color: var(--admin-text);
  border-bottom: 1px solid #2e2a24;
}
.adminBrand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  min-width: 220px;
}
.adminLogo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: contain;
  background: #fff;
}
.adminBrandTitle {
  font-family: var(--font-head);
  font-weight: 800;
  color: #fff;
}
.adminBrandSub {
  font-size: 12px;
  color: var(--admin-muted);
}
.adminNav {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}
.adminLink {
  text-decoration: none;
  color: var(--admin-muted);
  padding: 9px 14px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
}
.adminLink:hover {
  color: #fff;
}
.adminLink.active {
  color: var(--ink);
  background: var(--gold);
}
.adminActions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  min-width: 240px;
}
.adminEmail {
  font-size: 12px;
  color: var(--admin-muted);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.adminLang,
.adminLogout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  text-decoration: none;
  background: #26221c;
  color: var(--admin-text);
  padding: 9px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
  border: 1px solid #3a342b;
}

.menuBtn {
  display: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.adminMenuBtn {
  border-color: #3a342b;
  background: #26221c;
  color: #fff;
}

@media (max-width: 900px) {
  .topRow {
    flex-wrap: wrap;
  }
  .search {
    order: 3;
    flex-basis: 100%;
  }
}

@media (max-width: 768px) {
  .hideSm {
    display: none;
  }
  /* backdrop-filter would trap the fixed sidebar inside the header, so drop the blur on phones. */
  .topbar {
    backdrop-filter: none;
    background: #fff;
  }
  .adminTopbar {
    flex-wrap: wrap;
    padding: 10px 12px;
    gap: 10px;
  }
  .adminBrand {
    min-width: 0;
    flex: 1 1 auto;
  }
  .adminBrandSub,
  .adminEmail {
    display: none;
  }
  .adminActions {
    min-width: 0;
    gap: 6px;
  }
  .menuBtn {
    display: inline-flex;
  }
  /* Phone menu: a sidebar that slides in from the start side (right in Arabic, left in English). */
  .nav,
  .adminNav {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 60;
    width: min(300px, 84vw);
    margin: 0;
    padding: 0 16px 24px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    overflow-y: auto;
    background: #fff;
    box-shadow: 0 0 40px rgba(20, 20, 20, 0.25);
    /* Parked just off-screen on the start side; inset-inline-start follows the text direction. */
    inset-inline-start: calc(-1 * min(300px, 84vw) - 48px);
    visibility: hidden;
    transition: inset-inline-start 0.25s ease, visibility 0.25s;
  }
  .adminNav {
    background: var(--admin-bg);
  }
  .nav.open,
  .adminNav.open {
    inset-inline-start: 0;
    visibility: visible;
  }
  .drawerHead {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 0 14px;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    background: inherit;
  }
  .drawerHead.dark {
    border-bottom-color: #2e2a24;
  }
  .drawerLogo {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    object-fit: contain;
    border: 1px solid var(--border);
    background: #fff;
  }
  .drawerTitle {
    flex: 1;
    font-family: var(--font-head);
    font-weight: 800;
    font-size: 17px;
    color: var(--ink);
  }
  .drawerHead.dark .drawerTitle {
    color: #fff;
  }
  .drawerClose {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: #fff;
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .drawerHead.dark .drawerClose {
    background: #26221c;
    border-color: #3a342b;
    color: #fff;
  }
  .drawerFoot {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .drawerBackdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(20, 20, 20, 0.45);
  }
  .pill,
  .adminLink {
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: start;
    border-radius: 12px;
    padding: 13px 14px;
    font-size: 15px;
    border: 0;
    cursor: pointer;
    font-family: inherit;
  }
  .logo {
    width: 44px;
    height: 44px;
  }
  .title {
    font-size: 16px;
  }
  .content,
  .content.wide {
    width: calc(100% - 24px);
    padding: 16px 0 32px;
  }
}
</style>
