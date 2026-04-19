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
      <select v-model="filterStatus" class="select">
        <option value="All">All</option>
        <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
      </select>
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
            <th>Status</th>
            <th class="right">Actions</th>
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
            <td>
              <div class="statusRow">
                <span class="badge" :class="badgeClass(o.orderStatus)">{{ o.orderStatus }}</span>
                <select v-model="statusEdits[o.orderID]" class="miniSelect">
                  <option v-for="s in statusChoices(o.orderStatus)" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="creditRow" v-if="o.paymentMethod === 'Credit' && o.orderStatus === 'Pending Credit'">
                <button class="btnMini" type="button" :disabled="saving" @click="creditDecision(o.orderID, true)">Approve</button>
                <button class="btnMini danger" type="button" :disabled="saving" @click="creditDecision(o.orderID, false)">
                  Reject
                </button>
              </div>
            </td>
            <td class="right">
              <button class="iconBtn" type="button" :disabled="saving" title="Apply status" @click="setStatus(o.orderID)">
                ✓
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="ok" class="success">{{ ok }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../../api/client'

const orders = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const ok = ref(null)

const q = ref('')
const filterStatus = ref('All')
const statusEdits = reactive({})

const settableStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

function statusChoices(current) {
  const cur = String(current || '')
  const out = []
  if (cur) out.push(cur)
  for (const s of settableStatuses) {
    if (!out.includes(s)) out.push(s)
  }
  return out
}

const statusOptions = computed(() => {
  const s = new Set(orders.value.map((o) => o.orderStatus).filter(Boolean))
  return Array.from(s).sort((a, b) => a.localeCompare(b))
})

const filtered = computed(() => {
  const needle = q.value.toLowerCase()
  return orders.value.filter((o) => {
    if (filterStatus.value !== 'All' && o.orderStatus !== filterStatus.value) return false
    if (!needle) return true
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

function badgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('complete')) return 'bGreen'
  if (s.includes('confirm')) return 'bBlue'
  if (s.includes('pending') || s.includes('credit')) return 'bAmber'
  if (s.includes('cancel')) return 'bRed'
  return 'bGray'
}

async function load() {
  loading.value = true
  error.value = null
  ok.value = null
  try {
    const res = await api.get('/api/orders?limit=200')
    orders.value = res.data
    for (const o of orders.value) {
      if (!statusEdits[o.orderID]) statusEdits[o.orderID] = o.orderStatus
    }
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

async function setStatus(orderID) {
  saving.value = true
  error.value = null
  ok.value = null
  try {
    await api.post('/api/orders/status', { orderID, orderStatus: statusEdits[orderID] })
    ok.value = `Updated ${orderID}`
    await load()
  } catch (e) {
    error.value = e?.response?.data || 'Update failed'
  } finally {
    saving.value = false
  }
}

async function creditDecision(orderID, approve) {
  saving.value = true
  error.value = null
  ok.value = null
  try {
    await api.post('/api/orders/credit/decision', { orderID, approve })
    ok.value = approve ? `Approved ${orderID}` : `Rejected ${orderID}`
    await load()
  } catch (e) {
    error.value = e?.response?.data || 'Decision failed'
  } finally {
    saving.value = false
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
.select {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
  font-weight: 800;
  color: var(--text-h);
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
.right {
  text-align: right;
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

.statusRow {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.creditRow {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
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

.miniSelect {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 10px;
  background: #fff;
  font-weight: 800;
  color: var(--text-h);
}

.iconBtn {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.35);
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-weight: 950;
  cursor: pointer;
}
.btnMini {
  border: 1px solid var(--border);
  background: #fff;
  padding: 8px 10px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
}
.btnMini.danger {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c;
}

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
.success {
  color: #05603a;
  background: rgba(5, 96, 58, 0.08);
  border: 1px solid rgba(5, 96, 58, 0.18);
  padding: 10px 12px;
  border-radius: 12px;
}
</style>
