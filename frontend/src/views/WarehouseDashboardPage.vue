<template>
  <section class="card">
    <h2>Warehouse Dashboard</h2>
    <p class="muted">Low stock alerts + recent inventory activity.</p>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="grid">
      <div class="panel">
        <h3 class="h3">Low Stock</h3>
        <div v-if="data.lowStock.length === 0" class="muted">No low stock items.</div>
        <ul v-else class="list">
          <li v-for="p in data.lowStock" :key="p.productID" class="li">
            <span class="name">{{ p.name }}</span>
            <span class="pill">{{ p.stockLevel }}</span>
          </li>
        </ul>
      </div>

      <div class="panel">
        <h3 class="h3">Recent Activity</h3>
        <div class="tableWrap">
          <table class="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Product</th>
                <th>Action</th>
                <th>Δ</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in data.recentInventoryActivity" :key="a.auditID">
                <td>{{ new Date(a.createdAt).toLocaleString() }}</td>
                <td>{{ a.productName }}</td>
                <td class="mono">{{ a.action }}</td>
                <td :class="a.deltaQuantity < 0 ? 'neg' : 'pos'">{{ a.deltaQuantity }}</td>
                <td class="muted">{{ a.note || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api/client'

const data = ref({ lowStock: [], recentInventoryActivity: [] })
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/dashboard/warehouse')
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
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 980px) {
  .grid {
    grid-template-columns: 360px 1fr;
    align-items: start;
  }
}
.panel {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.55);
}
.h3 {
  margin: 0 0 10px;
  color: var(--text-h);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(17, 24, 39, 0.10);
  background: rgba(255, 255, 255, 0.6);
}
.name {
  font-weight: 800;
  color: var(--text-h);
}
.pill {
  font-family: ui-monospace, Consolas, monospace;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(180, 35, 24, 0.18);
  background: rgba(180, 35, 24, 0.08);
  color: #b42318;
}
.tableWrap {
  overflow: auto;
  border: 1px solid rgba(17, 24, 39, 0.10);
  border-radius: 12px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 740px;
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
.pos {
  color: #05603a;
  font-weight: 900;
}
.neg {
  color: #b42318;
  font-weight: 900;
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

