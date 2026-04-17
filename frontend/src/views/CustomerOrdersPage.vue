<template>
  <section class="card">
    <h2>Order History</h2>
    <p class="muted">Your recent orders.</p>

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
      </article>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api } from '../api/client'

const orders = ref([])
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/orders/mine')
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
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}
.muted {
  color: var(--text);
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
.error {
  margin-top: 12px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}
</style>

