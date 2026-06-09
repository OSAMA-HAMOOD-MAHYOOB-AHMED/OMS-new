<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">Order Management</h1>
        <p class="sub">View customer orders — FedEx Express ships automatically after checkout</p>
      </div>
      <button class="btnGhost" type="button" :disabled="loading" @click="load">Refresh</button>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Shipping</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.orderID">
            <td class="mono strong">{{ o.orderID }}</td>
            <td>
              <div class="custName">{{ customerName(o.email) }}</div>
              <div class="custId">{{ customerId(o.email) }}</div>
            </td>
            <td class="mutedTd">{{ formatDate(o.orderDate) }}</td>
            <td class="strong">${{ Number(o.totalPrice).toFixed(2) }}</td>
            <td class="mutedTd">{{ paymentLabel(o.paymentMethod) }}</td>
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
import { onMounted, ref } from 'vue'
import { api } from '../api/client'
import { SHIPPING, trackingNumber } from '../utils/shipping'

const orders = ref([])
const loading = ref(false)
const error = ref(null)

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

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/orders?limit=100')
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
.btnGhost {
  border: 1px solid var(--border);
  background: #fff;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 950;
  cursor: pointer;
  color: var(--text-h);
}

.muted {
  color: var(--text);
  margin-top: 6px;
}
.tableWrap {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}
thead th {
  text-align: left;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 950;
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
  font-weight: 950;
  color: var(--text-h);
}
.custId {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 800;
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

.error {
  margin-top: 12px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}
</style>
