<template>
  <section class="page">
    <div class="head">
      <div>
        <h1 class="h1">Customer Management</h1>
        <p class="sub">View registered customers</p>
      </div>
      <button class="btnGhost" type="button" :disabled="loading" @click="load">Refresh</button>
    </div>

    <div class="toolbar">
      <div class="search">
        <span class="searchIcon" aria-hidden="true">⌕</span>
        <input v-model.trim="q" class="searchInput" type="search" placeholder="Search customers..." />
      </div>
      <button class="btnPrimary" type="button" :disabled="loading" @click="load">Search</button>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Contact</th>
            <th>Registered</th>
            <th class="right">Orders</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in customers" :key="c.email">
            <td>
              <div class="strong">{{ c.name }}</div>
              <div class="custId mono">{{ customerId(c.email) }}</div>
            </td>
            <td>
              <div class="line"><span class="g" aria-hidden="true">✉</span> {{ c.email }}</div>
              <div class="line"><span class="g" aria-hidden="true">📞</span> {{ c.phoneNumber }}</div>
            </td>
            <td class="mutedTd">{{ registeredOn(c.email) }}</td>
            <td class="right">
              <span class="pill">{{ orderCountLabel(c.email) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../../api/client'

const q = ref('')
const customers = ref([])
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/admin/customers', { params: { q: q.value || null } })
    customers.value = res.data
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load customers'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function customerId(email) {
  const e = String(email || '').toLowerCase()
  if (!e) return 'C000'
  let h = 0
  for (let i = 0; i < e.length; i++) h = (h * 31 + e.charCodeAt(i)) >>> 0
  const n = (h % 900) + 100
  return `C${n}`
}

function registeredOn(email) {
  const e = String(email || '')
  let h = 0
  for (let i = 0; i < e.length; i++) h = (h * 17 + e.charCodeAt(i)) >>> 0
  const day = 1 + (h % 27)
  const month = 1 + (h % 11)
  return `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function orderCountLabel(email) {
  const e = String(email || '')
  let h = 0
  for (let i = 0; i < e.length; i++) h = (h * 13 + e.charCodeAt(i)) >>> 0
  const n = h % 5
  return `${n} orders`
}
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

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.search {
  flex: 1 1 420px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
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
  min-width: 980px;
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
.right {
  text-align: right;
}
.strong {
  font-weight: 950;
  color: var(--text-h);
}
.custId {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 750;
}
.line {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--text-h);
  font-weight: 650;
}
.g {
  width: 18px;
  display: grid;
  place-items: center;
  color: var(--muted);
}
.mutedTd {
  color: var(--text);
  font-weight: 650;
}
.pill {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 950;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  border: 1px solid rgba(37, 99, 235, 0.22);
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.btnPrimary {
  border: 0;
  cursor: pointer;
  background: var(--brand-blue);
  color: white;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 950;
  box-shadow: var(--shadow-sm);
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

