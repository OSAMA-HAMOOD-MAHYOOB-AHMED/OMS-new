<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">Order Management</h1>
        <p class="sub">View and manage customer orders</p>
      </div>
      <button class="btnGhost" type="button" :disabled="loading" @click="load">Refresh</button>
    </div>

    <div class="toolbar">
      <div class="search">
        <span class="searchIcon" aria-hidden="true">⌕</span>
        <input v-model.trim="q" class="searchInput" type="search" placeholder="Search by order ID or customer..." />
      </div>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="tableCard">
      <table class="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Shipping</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in filtered" :key="o.orderID">
            <td class="mono strong">{{ o.orderID }}</td>
            <td>
              <div class="custName">{{ customerName(o.email) }}</div>
              <div class="custId">{{ customerId(o.email) }}</div>
            </td>
            <td class="mutedTd">{{ formatDate(o.orderDate) }}</td>
            <td class="strong">${{ Number(o.totalPrice).toFixed(2) }}</td>
            <td class="mutedTd">{{ paymentLabel(o.paymentMethod) }}</td>
            <td>
              <select
                :value="o.orderStatus"
                class="statusSelect"
                :class="statusClass(o.orderStatus)"
                :disabled="updatingStatus[o.orderID]"
                @change="(e) => updateStatus(o, e.target.value)"
              >
                <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </td>
            <td>
              <div class="shipLine">{{ SHIPPING.service }}</div>
              <div class="track mono">{{ trackingNumber(o.orderID) }}</div>
              <div class="shipEta">{{ SHIPPING.estimatedDelivery }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, reactive } from 'vue'
import { api } from '../../api/client'
import { SHIPPING, trackingNumber } from '../../utils/shipping'

const ORDER_STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

const orders = ref([])
const loading = ref(false)
const error = ref(null)
const updatingStatus = reactive({})

const q = ref('')

const filtered = computed(() => {
  const needle = q.value.toLowerCase()
  if (!needle) return orders.value
  return orders.value.filter((o) => {
    const hay = `${o.orderID} ${o.email}`.toLowerCase()
    return hay.includes(needle)
  })
})

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso || '')
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function customerName(email) {
  const e = String(email || '')
  if (!e) return 'Customer'
  const local = e.split('@')[0] || 'customer'
  const parts = local.split(/[._-]+/g).filter(Boolean)
  if (parts.length === 0) return 'Customer'
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

function customerId(email) {
  const e = String(email || '').toLowerCase()
  if (!e) return 'C000'
  let h = 0
  for (let i = 0; i < e.length; i++) h = (h * 31 + e.charCodeAt(i)) >>> 0
  const n = (h % 900) + 100
  return `C${n}`
}

function paymentLabel(method) {
  if (method === 'CreditCard') return 'Credit Card'
  if (method === 'Cash') return 'Cash on Delivery'
  return method || '—'
}

function statusClass(status) {
  if (status === 'Placed') return 'statusPlaced'
  if (status === 'Processing') return 'statusProcessing'
  if (status === 'Shipped') return 'statusShipped'
  if (status === 'Delivered') return 'statusDelivered'
  if (status === 'Cancelled') return 'statusCancelled'
  return ''
}

async function updateStatus(order, newStatus) {
  if (newStatus === order.orderStatus) return
  updatingStatus[order.orderID] = true
  try {
    await api.patch(`/api/admin/orders/${order.orderID}/status`, { status: newStatus })
    order.orderStatus = newStatus
  } catch (e) {
    alert(e?.response?.data || 'Failed to update status')
  } finally {
    updatingStatus[order.orderID] = false
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/orders?limit=200')
    orders.value = res.data
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load orders'
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
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.search {
  flex: 1 1 420px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
}
.searchIcon {
  color: var(--muted);
  font-weight: 900;
}
.searchInput {
  border: 0;
  outline: none;
  width: 100%;
  font-weight: 650;
  color: var(--text-h);
  background: transparent;
}
.tableCard {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  overflow: auto;
  box-shadow: var(--shadow-sm);
}
.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}
thead th {
  text-align: left;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 900;
  padding: 12px 14px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border);
}
tbody td {
  padding: 14px;
  border-bottom: 1px solid #eef2f7;
  vertical-align: top;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
.strong {
  font-weight: 950;
  color: var(--text-h);
}
.custName {
  font-weight: 900;
  color: var(--text-h);
}
.custId {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 750;
}
.mutedTd {
  color: var(--text);
  font-weight: 650;
}

.shipLine {
  font-weight: 850;
  color: var(--text-h);
}
.track {
  margin-top: 4px;
  font-size: 12px;
  color: #1d4ed8;
  font-weight: 800;
}
.shipEta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 650;
}

.statusSelect {
  border-radius: 8px;
  padding: 5px 8px;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid var(--border);
  cursor: pointer;
  background: #f8fafc;
}
.statusPlaced    { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
.statusProcessing{ color: #92400e; background: #fffbeb; border-color: #fde68a; }
.statusShipped   { color: #5b21b6; background: #f5f3ff; border-color: #ddd6fe; }
.statusDelivered { color: #065f46; background: #ecfdf5; border-color: #a7f3d0; }
.statusCancelled { color: #991b1b; background: #fef2f2; border-color: #fecaca; }

.btnGhost {
  border: 1px solid var(--border);
  background: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  color: var(--text-h);
}

.muted {
  color: var(--text);
}
.error {
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 10px 12px;
  border-radius: 12px;
}
</style>
