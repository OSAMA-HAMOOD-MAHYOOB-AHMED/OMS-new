<template>
  <section class="card">
    <h2>Inventory</h2>
    <p class="muted">Warehouse controls: receive stock and log check-ups.</p>

    <div class="controls">
      <div class="box">
        <h3>Receive Stock</h3>
        <div class="row">
          <select v-model="receiveProductID">
            <option v-for="x in rows" :key="x.productID" :value="x.productID">
              {{ x.productName }} ({{ x.productID }})
            </option>
          </select>
          <input v-model.number="receiveQty" type="number" min="1" />
        </div>
        <input v-model.trim="receiveNote" placeholder="Note (optional)" />
        <button class="btn" :disabled="loading" @click="receive">Receive</button>
      </div>

      <div class="box">
        <h3>Log Check-up</h3>
        <div class="row">
          <select v-model="checkupInventoryID">
            <option v-for="x in rows" :key="x.inventoryID" :value="x.inventoryID">
              {{ x.productName }} — {{ x.location }} ({{ x.inventoryID }})
            </option>
          </select>
        </div>
        <input v-model.trim="checkupNote" placeholder="Note (optional)" />
        <button class="btn" :disabled="loading" @click="checkup">Log check-up</button>
      </div>
    </div>

    <div v-if="loading" class="muted">Working...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="ok" class="success">{{ ok }}</div>

    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Location</th>
            <th>Available</th>
            <th>Reserved</th>
            <th>Last Check-up</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="x in rows" :key="x.inventoryID">
            <td>
              <div class="pname">{{ x.productName }}</div>
              <div class="pid">{{ x.productID }}</div>
            </td>
            <td>{{ x.location }}</td>
            <td>{{ x.quantityAvailable }}</td>
            <td>{{ x.quantityReserved }}</td>
            <td>{{ x.lastCheckupDate ? new Date(x.lastCheckupDate).toLocaleString() : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api/client'

const rows = ref([])
const loading = ref(false)
const error = ref(null)
const ok = ref(null)

const receiveProductID = ref('')
const receiveQty = ref(10)
const receiveNote = ref('')

const checkupInventoryID = ref('')
const checkupNote = ref('')

async function load() {
  error.value = null
  ok.value = null
  const res = await api.get('/api/inventory')
  rows.value = res.data
  if (!receiveProductID.value && rows.value[0]) receiveProductID.value = rows.value[0].productID
  if (!checkupInventoryID.value && rows.value[0]) checkupInventoryID.value = rows.value[0].inventoryID
}

async function receive() {
  loading.value = true
  error.value = null
  ok.value = null
  try {
    await api.post('/api/inventory/receive', {
      productID: receiveProductID.value,
      quantity: receiveQty.value,
      note: receiveNote.value || null,
    })
    ok.value = 'Stock received.'
    await load()
  } catch (e) {
    error.value = e?.response?.data || 'Receive failed'
  } finally {
    loading.value = false
  }
}

async function checkup() {
  loading.value = true
  error.value = null
  ok.value = null
  try {
    await api.post('/api/inventory/checkup', {
      inventoryID: checkupInventoryID.value,
      note: checkupNote.value || null,
    })
    ok.value = 'Check-up logged.'
    await load()
  } catch (e) {
    error.value = e?.response?.data || 'Check-up failed'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await load()
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load inventory'
  }
})
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
.controls {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.box {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.55);
}
.row {
  display: flex;
  gap: 10px;
  margin: 8px 0;
}
select,
input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
  box-sizing: border-box;
}
.btn {
  border: 0;
  cursor: pointer;
  background: #007aff;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 700;
  margin-top: 10px;
}
.tableWrap {
  margin-top: 14px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
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
.pname {
  font-weight: 800;
  color: var(--text-h);
}
.pid {
  font-size: 12px;
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
.success {
  margin-top: 12px;
  color: #05603a;
  background: rgba(5, 96, 58, 0.08);
  border: 1px solid rgba(5, 96, 58, 0.18);
  padding: 8px 10px;
  border-radius: 12px;
}
</style>

