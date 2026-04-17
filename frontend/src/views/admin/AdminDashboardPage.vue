<template>
  <section class="card">
    <h2>Admin Dashboard</h2>
    <p class="muted">Overview metrics (demo).</p>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="grid">
      <div class="kpi">
        <div class="label">Total Orders</div>
        <div class="value">{{ data.totalOrders }}</div>
      </div>
      <div class="kpi">
        <div class="label">Cash Revenue</div>
        <div class="value">${{ Number(data.cashRevenue).toFixed(2) }}</div>
      </div>
      <div class="kpi">
        <div class="label">Cash Orders</div>
        <div class="value">{{ data.cashOrders }}</div>
      </div>
    </div>

    <div class="quick">
      <button class="btn secondary" @click="$router.push({ name: 'adminProducts' })">Manage Products</button>
      <button class="btn secondary" @click="$router.push({ name: 'adminCustomers' })">Customers</button>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../../api/client'

const data = ref({ totalOrders: 0, cashRevenue: 0, cashOrders: 0, recentOrders: [] })
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/admin/dashboard')
    data.value = res.data
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load admin dashboard'
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
.quick {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.btn {
  border: 0;
  cursor: pointer;
  background: #007aff;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
}
.secondary {
  background: rgba(0, 0, 0, 0.08);
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

