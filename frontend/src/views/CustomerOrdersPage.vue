<template>
  <section class="page">
    <div class="head">
      <h1 class="h1">Order History</h1>
      <div class="filters">
        <select v-model="statusFilter" class="select">
          <option value="">All statuses</option>
          <option>Placed</option>
          <option>Processing</option>
          <option>Shipped</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <button class="btnGhost" type="button" :disabled="loading" @click="load">Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="list">
      <article v-for="o in orders" :key="o.orderID" class="order">
        <div class="top">
          <div>
            <div class="id">Order {{ o.orderID }}</div>
            <div class="when">Placed on {{ formatDate(o.orderDate) }}</div>
          </div>

          <div class="rightTop">
            <span class="badge" :class="badgeClass(o.orderStatus)">{{ o.orderStatus }}</span>
            <div class="total">${{ Number(o.totalPrice).toFixed(2) }}</div>
          </div>
        </div>

        <div class="hr" />

        <div class="lines">
          <div v-for="it in o.items" :key="it.productID" class="line">
            <div class="lineLeft">{{ it.name }} × {{ it.quantity }}</div>
            <div class="lineRight">${{ Number(it.subtotal).toFixed(2) }}</div>
          </div>
        </div>

        <div class="metaRow">
          <div class="pay">Payment: <span class="strong">{{ paymentLabel(o.paymentMethod) }}</span></div>
          <div class="pay">
            Shipping: <span class="strong">{{ o.shippingService || 'FedEx Express' }}</span>
            <span class="mutedInline"> · {{ o.shippingEstimatedDelivery || '3–5 business days' }}</span>
          </div>
          <div v-if="o.shippingTrackingNumber" class="pay tracking">
            FedEx tracking: <span class="strong mono">{{ o.shippingTrackingNumber }}</span>
          </div>
        </div>

        <div class="actions">
          <RouterLink class="btnPrimary small" :to="{ name: 'checkoutInvoice', params: { orderId: o.orderID } }">
            View invoice
          </RouterLink>
          <button class="btnGhost small" type="button" @click="downloadPdf(o.orderID)">Download PDF</button>
          <button class="btnGhost small" type="button" @click="reorder(o)">Reorder</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { api } from '../api/client'
import { downloadInvoicePdf, paymentMethodLabel } from '../utils/invoice'
import { useCartStore } from '../stores/cart'
import { useRouter } from 'vue-router'

const allOrders = ref([])
const loading = ref(false)
const error = ref(null)
const statusFilter = ref('')

const cart = useCartStore()
cart.hydrate()
const router = useRouter()

const orders = computed(() => {
  if (!statusFilter.value) return allOrders.value
  return allOrders.value.filter((o) => o.orderStatus === statusFilter.value)
})

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso || '')
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function paymentLabel(method) {
  return paymentMethodLabel(method)
}

function badgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('deliver') || s.includes('complete')) return 'bGreen'
  if (s.includes('confirm') || s.includes('placed') || s.includes('process') || s.includes('ship')) return 'bBlue'
  if (s.includes('pending') || s.includes('credit')) return 'bAmber'
  if (s.includes('cancel') || s.includes('reject')) return 'bRed'
  return 'bGray'
}

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

async function downloadPdf(orderID) {
  try {
    await downloadInvoicePdf(api, orderID)
  } catch (e) {
    error.value = e?.response?.data || 'Unable to download PDF invoice'
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
.page {
  display: grid;
  gap: 14px;
}
.head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 950;
  letter-spacing: -0.9px;
  color: var(--text-h);
}
.filters {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.select {
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #fff;
  font-weight: 900;
  color: var(--text-h);
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
.list {
  display: grid;
  gap: 12px;
}
.order {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}
.top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
}
.id {
  font-weight: 950;
  color: var(--text-h);
  letter-spacing: -0.2px;
}
.when {
  margin-top: 6px;
  color: var(--text);
  font-weight: 650;
}
.rightTop {
  display: grid;
  justify-items: end;
  gap: 8px;
}
.total {
  font-weight: 950;
  color: var(--text-h);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 950;
  border: 1px solid transparent;
}
.bGreen {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
  border-color: rgba(16, 185, 129, 0.22);
}
.bBlue {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  border-color: rgba(37, 99, 235, 0.22);
}
.bAmber {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.22);
}
.bRed {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
  border-color: rgba(239, 68, 68, 0.18);
}
.bGray {
  background: rgba(148, 163, 184, 0.14);
  color: #334155;
  border-color: rgba(148, 163, 184, 0.22);
}

.hr {
  height: 1px;
  background: var(--border);
  margin: 12px 0;
}

.lines {
  display: grid;
  gap: 10px;
}
.line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-h);
  font-weight: 650;
}
.lineRight {
  font-weight: 950;
  color: var(--text-h);
}

.metaRow {
  margin-top: 12px;
  color: var(--text);
  font-weight: 650;
}
.strong {
  color: var(--text-h);
  font-weight: 900;
}
.mutedInline {
  color: var(--muted);
  font-weight: 650;
}
.tracking {
  margin-top: 4px;
}
.mono {
  font-family: ui-monospace, Consolas, monospace;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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
.small {
  padding: 9px 10px;
  border-radius: 14px;
}

.error {
  margin-top: 12px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}

@media (max-width: 520px) {
  .h1 {
    font-size: 28px;
  }
  .head {
    flex-direction: column;
    align-items: stretch;
  }
  .filters {
    width: 100%;
  }
  .select {
    flex: 1;
    min-width: 0;
  }
  .top {
    flex-direction: column;
    gap: 10px;
  }
  .rightTop {
    justify-items: start;
  }
  .line {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .actions {
    flex-direction: column;
  }
  .actions .btnPrimary,
  .actions .btnGhost {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}
</style>

