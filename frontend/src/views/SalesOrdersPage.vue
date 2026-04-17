<template>
  <section class="card">
    <div class="row">
      <div>
        <h2>Order Management</h2>
        <p class="muted">Approve/reject credit and update order statuses.</p>
      </div>
      <button class="btn secondary" :disabled="loading" @click="load">Refresh</button>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Total</th>
            <th>When</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.orderID">
            <td class="mono">{{ o.orderID }}</td>
            <td>{{ o.email }}</td>
            <td>{{ o.paymentMethod }}</td>
            <td>{{ o.orderStatus }}</td>
            <td>${{ Number(o.totalPrice).toFixed(2) }}</td>
            <td>{{ new Date(o.orderDate).toLocaleString() }}</td>
            <td class="actions">
              <button
                v-if="o.paymentMethod === 'Credit' && o.orderStatus === 'Pending Credit'"
                class="btn small"
                :disabled="saving"
                @click="creditDecision(o.orderID, true)"
              >
                Approve
              </button>
              <button
                v-if="o.paymentMethod === 'Credit' && o.orderStatus === 'Pending Credit'"
                class="btn small danger"
                :disabled="saving"
                @click="creditDecision(o.orderID, false)"
              >
                Reject
              </button>

              <select v-model="statusEdits[o.orderID]" class="statusSel">
                <option value="Placed">Placed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button class="btn small secondary" :disabled="saving" @click="setStatus(o.orderID)">
                Set
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
import { onMounted, reactive, ref } from 'vue'
import { api } from '../api/client'

const orders = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const ok = ref(null)
const statusEdits = reactive({})

async function load() {
  loading.value = true
  error.value = null
  ok.value = null
  try {
    const res = await api.get('/api/orders?limit=100')
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
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
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
  min-width: 980px;
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
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.statusSel {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
}
.btn {
  border: 0;
  cursor: pointer;
  background: #007aff;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 700;
}
.secondary {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-h);
}
.small {
  padding: 8px 10px;
  border-radius: 10px;
}
.danger {
  background: rgba(180, 35, 24, 0.92);
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

