<template>
  <section class="card">
    <h2>Sales Dashboard</h2>
    <p class="muted">Basic metrics for demo 1.</p>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="grid">
      <div class="kpi">
        <div class="label">Total Orders</div>
        <div class="value">{{ data.totalOrders }}</div>
      </div>
      <div class="kpi">
        <div class="label">Cash Orders</div>
        <div class="value">{{ data.cashOrders }}</div>
      </div>
      <div class="kpi">
        <div class="label">Cash Revenue</div>
        <div class="value">${{ Number(data.cashRevenue).toFixed(2) }}</div>
      </div>
    </div>

    <h3 class="h3">Recent Orders</h3>
    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in data.recentOrders" :key="o.orderID">
            <td class="mono">{{ o.orderID }}</td>
            <td>{{ o.email }}</td>
            <td>{{ o.orderStatus }}</td>
            <td>${{ Number(o.totalPrice).toFixed(2) }}</td>
            <td>{{ new Date(o.orderDate).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api/client'

const data = ref({ totalOrders: 0, cashRevenue: 0, cashOrders: 0, recentOrders: [] })
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/dashboard/sales')
    data.value = res.data
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}
.muted {
  color: var(--text);
}
.grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.kpi {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.55);
}
.label {
  font-size: 13px;
  color: var(--text);
}
.value {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 900;
  color: var(--text-h);
  letter-spacing: -0.8px;
}
.h3 {
  margin: 18px 0 10px;
  color: var(--text-h);
}
.tableWrap {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
}
.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}
th,
td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
}
th {
  font-size: 13px;
  color: var(--text);
}
.mono {
  font-family: ui-monospace, Consolas, monospace;
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

