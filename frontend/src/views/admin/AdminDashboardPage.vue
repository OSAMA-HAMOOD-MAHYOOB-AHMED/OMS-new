<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">Dashboard Overview</h1>
        <p class="sub">Welcome to the admin panel</p>
      </div>
      <div class="headActions">
        <button class="btnGhost" type="button" :disabled="loading" @click="load">Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="stack">
      <div class="kpis">
        <div class="kpi">
          <div class="kTop">
            <div class="icon blue">📦</div>
            <div class="trend" aria-hidden="true">↗</div>
          </div>
          <div class="value">{{ data.totalOrders }}</div>
          <div class="label">Total Orders</div>
          <div v-if="pendingOrders > 0" class="subnote">> {{ pendingOrders }} pending</div>
        </div>

        <div class="kpi">
          <div class="kTop">
            <div class="icon green">🛍</div>
            <div class="trend" aria-hidden="true">↗</div>
          </div>
          <div class="value">{{ productCount }}</div>
          <div class="label">Products</div>
        </div>

        <div class="kpi">
          <div class="kTop">
            <div class="icon purple">👥</div>
            <div class="trend" aria-hidden="true">↗</div>
          </div>
          <div class="value">{{ customerCount }}</div>
          <div class="label">Customers</div>
        </div>

        <div class="kpi">
          <div class="kTop">
            <div class="icon orange">$</div>
            <div class="trend" aria-hidden="true">↗</div>
          </div>
          <div class="value">${{ Number(data.cashRevenue).toFixed(2) }}</div>
          <div class="label">Cash Revenue</div>
        </div>
      </div>

      <div class="cols">
        <div class="card">
          <div class="cardTitle">Recent Orders</div>
          <div class="rows">
            <div v-for="o in recent" :key="o.orderID" class="row">
              <div>
                <div class="strong mono">{{ o.orderID }}</div>
                <div class="muted">{{ o.email }}</div>
              </div>
              <div class="right">
                <div class="strong">${{ Number(o.totalPrice).toFixed(2) }}</div>
                <span class="badge" :class="badgeClass(o.orderStatus)">{{ o.orderStatus }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="cardTitle">Low Stock Alert</div>
          <div class="rows">
            <div v-for="p in lowStock" :key="p.productID" class="row">
              <div>
                <div class="strong">{{ p.name }}</div>
                <div class="muted">{{ p.category }}</div>
              </div>
              <div class="right">
                <span class="pill">{{ p.stockLevel }} left</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="quick">
        <button class="btnGhost" type="button" @click="$router.push({ name: 'adminProducts' })">Manage Products</button>
        <button class="btnGhost" type="button" @click="$router.push({ name: 'adminCustomers' })">Customers</button>
        <button class="btnGhost" type="button" @click="$router.push({ name: 'adminOrders' })">Orders</button>
        <button class="btnGhost" type="button" @click="$router.push({ name: 'adminReports' })">Reports</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../../api/client'

const data = ref({ totalOrders: 0, cashRevenue: 0, cashOrders: 0, recentOrders: [] })
const products = ref([])
const customers = ref([])
const loading = ref(false)
const error = ref(null)

const recent = computed(() => (Array.isArray(data.value.recentOrders) ? data.value.recentOrders : []).slice(0, 6))

const pendingOrders = computed(() => {
  const rows = Array.isArray(data.value.recentOrders) ? data.value.recentOrders : []
  return rows.filter((o) => String(o.orderStatus || '').toLowerCase().includes('pending')).length
})

const productCount = computed(() => products.value.length)
const customerCount = computed(() => customers.value.length)

const lowStock = computed(() => {
  const rows = Array.isArray(products.value) ? products.value : []
  return rows
    .filter((p) => Number(p.stockLevel) <= 25)
    .sort((a, b) => Number(a.stockLevel) - Number(b.stockLevel))
    .slice(0, 6)
})

function badgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('complete') || s.includes('deliver')) return 'bGreen'
  if (s.includes('confirm') || s.includes('placed') || s.includes('process') || s.includes('ship')) return 'bBlue'
  if (s.includes('pending') || s.includes('credit')) return 'bAmber'
  if (s.includes('cancel') || s.includes('reject')) return 'bRed'
  return 'bGray'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const [dash, prods, custs] = await Promise.all([
      api.get('/api/admin/dashboard'),
      api.get('/api/admin/products'),
      api.get('/api/admin/customers'),
    ])
    data.value = dash.data
    products.value = prods.data
    customers.value = custs.data
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load admin dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  display: grid;
  gap: 14px;
}
.head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.8px;
  color: var(--text-h);
}
.sub {
  margin: 6px 0 0;
  color: var(--text);
  font-weight: 650;
}
.headActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stack {
  display: grid;
  gap: 12px;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 980px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.kpi {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.kTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  background: #f8fafc;
}
.icon.blue {
  background: rgba(37, 99, 235, 0.10);
}
.icon.green {
  background: rgba(16, 185, 129, 0.10);
}
.icon.purple {
  background: rgba(139, 92, 246, 0.10);
}
.icon.orange {
  background: rgba(245, 158, 11, 0.14);
}
.trend {
  color: #047857;
  font-weight: 950;
}
.value {
  margin-top: 10px;
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.8px;
  color: var(--text-h);
}
.label {
  margin-top: 6px;
  color: var(--muted);
  font-weight: 850;
  font-size: 12px;
}
.subnote {
  margin-top: 8px;
  color: #b45309;
  font-weight: 900;
  font-size: 12px;
}

.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 980px) {
  .cols {
    grid-template-columns: 1fr;
  }
}
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.cardTitle {
  padding: 14px 14px 10px;
  font-weight: 950;
  color: var(--text-h);
}
.rows {
  padding: 0 6px 6px;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 10px;
  border-top: 1px solid #eef2f7;
}
.right {
  text-align: right;
  display: grid;
  justify-items: end;
  gap: 8px;
}
.strong {
  font-weight: 950;
  color: var(--text-h);
}
.muted {
  margin-top: 4px;
  color: var(--text);
  font-size: 12px;
  font-weight: 650;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 950;
  border: 1px solid transparent;
}
.bGreen {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  border-color: rgba(16, 185, 129, 0.22);
}
.bBlue {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  border-color: rgba(37, 99, 235, 0.22);
}
.bAmber {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.22);
}
.bRed {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.18);
}
.bGray {
  background: rgba(148, 163, 184, 0.14);
  color: #334155;
  border-color: rgba(148, 163, 184, 0.22);
}

.pill {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 950;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.22);
}

.quick {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.btnGhost {
  border: 1px solid var(--border);
  background: #fff;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 950;
  cursor: pointer;
  color: var(--text-h);
}

.error {
  margin-top: 12px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}
</style>

