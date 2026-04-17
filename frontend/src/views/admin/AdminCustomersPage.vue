<template>
  <section class="card">
    <div class="row">
      <div>
        <h2>Customer Management</h2>
        <p class="muted">Search and view customer list (demo).</p>
      </div>
      <div class="row">
        <input v-model.trim="q" placeholder="Search name/email" />
        <button class="btn secondary" :disabled="loading" @click="load">Search</button>
      </div>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in customers" :key="c.email">
            <td class="mono">{{ c.email }}</td>
            <td>{{ c.name }}</td>
            <td>{{ c.phoneNumber }}</td>
            <td class="muted">{{ c.address }}</td>
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
</script>

<style scoped>
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 10px;
  flex-wrap: wrap;
}
input {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
}
.muted {
  color: var(--text);
  margin-top: 6px;
}
.tableWrap {
  margin-top: 12px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
}
.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 820px;
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

