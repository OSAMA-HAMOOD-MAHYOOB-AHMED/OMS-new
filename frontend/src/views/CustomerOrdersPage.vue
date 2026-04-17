<template>
  <section class="card">
    <h2>Order History</h2>
    <p class="muted">Your recent orders.</p>

    <div class="filters">
      <select v-model="statusFilter">
        <option value="">All statuses</option>
        <option>Placed</option>
        <option>Processing</option>
        <option>Shipped</option>
        <option>Delivered</option>
        <option>Cancelled</option>
        <option>Pending Credit</option>
        <option>Credit Rejected</option>
      </select>
      <button class="btn secondary small" :disabled="loading" @click="load">Refresh</button>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="list">
      <article v-for="o in orders" :key="o.orderID" class="order">
        <div class="row">
          <div class="id">{{ o.orderID }}</div>
          <div class="status">{{ o.orderStatus }}</div>
        </div>
        <div class="row muted">
          <div>{{ new Date(o.orderDate).toLocaleString() }}</div>
          <div>${{ Number(o.totalPrice).toFixed(2) }} • {{ o.paymentMethod }}</div>
        </div>

        <ul class="items">
          <li v-for="it in o.items" :key="it.productID">
            {{ it.name }} × {{ it.quantity }} — ${{ Number(it.subtotal).toFixed(2) }}
          </li>
        </ul>

        <div class="actions">
          <button class="btn small" @click="viewInvoice(o.orderID)">View invoice</button>
          <button class="btn secondary small" @click="reorder(o)">Reorder</button>
        </div>

        <div v-if="invoiceByOrder[o.orderID]" class="invoice">
          <div class="mono">{{ invoiceByOrder[o.orderID].subject }}</div>
          <pre class="pre">{{ invoiceByOrder[o.orderID].body }}</pre>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { api } from '../api/client'
import { useCartStore } from '../stores/cart'
import { useRouter } from 'vue-router'

const allOrders = ref([])
const loading = ref(false)
const error = ref(null)
const statusFilter = ref('')
const invoiceByOrder = ref({})

const cart = useCartStore()
cart.hydrate()
const router = useRouter()

const orders = computed(() => {
  if (!statusFilter.value) return allOrders.value
  return allOrders.value.filter((o) => o.orderStatus === statusFilter.value)
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/orders/mine')
    allOrders.value = res.data
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

async function viewInvoice(orderID) {
  try {
    const res = await api.get(`/api/invoices/${orderID}`)
    invoiceByOrder.value = { ...invoiceByOrder.value, [orderID]: res.data }
  } catch (e) {
    error.value = e?.response?.data || 'Invoice not found'
  }
}

function reorder(order) {
  cart.setItems(
    order.items.map((it) => ({
      productID: it.productID,
      name: it.name,
      price: it.quantity > 0 ? it.subtotal / it.quantity : 0,
      quantity: it.quantity,
    })),
  )
  router.push({ name: 'cart' })
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
.filters {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
select {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
}
.list {
  margin-top: 12px;
  display: grid;
  gap: 12px;
}
.order {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.55);
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.id {
  font-weight: 800;
  color: var(--text-h);
}
.status {
  font-weight: 800;
  color: #007aff;
}
.items {
  margin: 10px 0 0;
  padding-left: 18px;
  color: var(--text-h);
}
.actions {
  margin-top: 10px;
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
.small {
  padding: 8px 10px;
  border-radius: 10px;
}
.invoice {
  margin-top: 10px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  border-radius: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
}
.mono {
  font-family: ui-monospace, Consolas, monospace;
  font-weight: 900;
  color: var(--text-h);
}
.pre {
  margin: 8px 0 0;
  white-space: pre-wrap;
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

