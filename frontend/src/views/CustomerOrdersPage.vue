<template>
  <section class="page">
    <div class="head">
      <h1 class="h1">{{ t('orders.title') }}</h1>
      <div class="filters">
        <label class="srOnly" for="statusFilter">{{ t('orders.allStatuses') }}</label>
        <select id="statusFilter" v-model="statusFilter" class="select">
          <option value="">{{ t('orders.allStatuses') }}</option>
          <option v-for="s in statusOptions" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </select>
        <button class="btnGhost" type="button" :disabled="loading" @click="load">
          <AppIcon name="refresh" :size="18" />
          {{ t('orders.refresh') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="muted">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="!orders.length" class="emptyBox">
      <AppIcon name="receipt" :size="40" />
      <p>{{ t('orders.empty') }}</p>
      <RouterLink class="btnPrimary" :to="{ name: 'products' }">{{ t('orders.startShopping') }}</RouterLink>
    </div>

    <div v-else class="list">
      <article v-for="o in orders" :key="o.orderID" class="order">
        <div class="top">
          <div class="topLeft">
            <div class="id" dir="ltr">{{ t('orders.order', { id: shortId(o.orderID) }) }}</div>
            <div class="when">{{ t('orders.placedOn', { date: formatDate(o.orderDate) }) }}</div>
          </div>

          <div class="rightTop">
            <span class="badge" :class="badgeClass(o.orderStatus)">{{ statusLabel(o.orderStatus) }}</span>
            <div class="total" dir="ltr">{{ format(o.totalPrice) }}</div>
          </div>
        </div>

        <ol v-if="!isCancelled(o)" class="tracker" :aria-label="statusLabel(o.orderStatus)">
          <li v-for="(step, i) in trackSteps" :key="step" :class="stepClass(o, i)">
            <span class="stepDot"><AppIcon v-if="stepIndex(o) > i" name="check" :size="14" :stroke="3" /></span>
            <span class="stepLabel">{{ statusLabel(step) }}</span>
          </li>
        </ol>
        <p v-else class="cancelled">{{ t('orders.cancelledNote') }}</p>

        <div class="lines">
          <div v-for="it in o.items" :key="it.productID" class="line">
            <div class="lineLeft" dir="auto">{{ it.name }} × {{ it.quantity }}</div>
            <div class="lineRight" dir="ltr">{{ format(it.subtotal) }}</div>
          </div>
        </div>

        <div class="metaRow">
          <div class="pay">{{ t('orders.payment') }}: <span class="strong">{{ tp(paymentLabel(o.paymentMethod)) }}</span></div>
          <div class="pay">
            {{ t('orders.shipping') }}: <span class="strong">{{ o.shippingService || 'FedEx Express' }}</span>
            <span class="mutedInline"> · {{ o.shippingEstimatedDelivery || t('orders.days') }}</span>
          </div>
          <div v-if="o.shippingTrackingNumber" class="pay tracking">
            {{ t('orders.tracking') }}: <span class="strong mono">{{ o.shippingTrackingNumber }}</span>
          </div>
        </div>

        <div class="actions">
          <RouterLink class="btnPrimary small" :to="{ name: 'checkoutInvoice', params: { orderId: o.orderID } }">
            <AppIcon name="receipt" :size="18" />
            {{ t('orders.invoice') }}
          </RouterLink>
          <button class="btnGhost small" type="button" @click="downloadPdf(o.orderID)">
            <AppIcon name="download" :size="18" />
            {{ t('orders.pdf') }}
          </button>
          <button class="btnGhost small" type="button" @click="reorder(o)">
            <AppIcon name="refresh" :size="18" />
            {{ t('orders.reorder') }}
          </button>
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
import { RouterLink, useRouter } from 'vue-router'
import { useCurrency } from '../composables/useCurrency'
import { useI18n } from '../i18n'
import AppIcon from '../components/AppIcon.vue'

const { t, tp, statusLabel } = useI18n()
const statusOptions = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const trackSteps = ['Placed', 'Processing', 'Shipped', 'Delivered']

function shortId(id) {
  const s = String(id || '')
  return s.length > 14 ? `#${s.slice(0, 8).toUpperCase()}` : `#${s}`
}

function isCancelled(o) {
  return String(o.orderStatus || '').toLowerCase().includes('cancel')
}

// Index of the step the order has reached (Delivered = all done).
function stepIndex(o) {
  const s = String(o.orderStatus || '').toLowerCase()
  if (s.includes('deliver') || s.includes('complete')) return 4
  if (s.includes('ship')) return 2
  if (s.includes('process')) return 1
  return 0
}

function stepClass(o, i) {
  const at = stepIndex(o)
  if (at > i) return 'done'
  if (at === i) return 'current'
  return 'todo'
}

const allOrders = ref([])
const loading = ref(false)
const error = ref(null)
const statusFilter = ref('')

const cart = useCartStore()
cart.hydrate()
const router = useRouter()
const { format } = useCurrency()

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
    error.value = (typeof e?.response?.data === 'string' && e.response.data) || t('orders.loadFailed')
  } finally {
    loading.value = false
  }
}

async function downloadPdf(orderID) {
  try {
    await downloadInvoicePdf(api, orderID)
  } catch (e) {
    error.value = (typeof e?.response?.data === 'string' && e.response.data) || t('orders.pdfFailed')
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
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.emptyBox {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 48px 16px;
  border: 1px dashed var(--border-strong);
  border-radius: 22px;
  color: var(--text);
  text-align: center;
}
.emptyBox p {
  margin: 0;
}
.tracker {
  list-style: none;
  margin: 16px 0 6px;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.tracker li {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}
.tracker li:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 12px;
  inset-inline-start: calc(50% + 16px);
  width: calc(100% - 32px);
  height: 2px;
  background: var(--border-strong);
}
.tracker li.done:not(:last-child)::after {
  background: var(--ink);
}
.stepDot {
  width: 26px;
  height: 26px;
  border-radius: 13px;
  border: 2px solid var(--border-strong);
  background: #fff;
  color: #fff;
  display: grid;
  place-items: center;
}
.done .stepDot {
  background: var(--ink);
  border-color: var(--ink);
}
.current .stepDot {
  background: var(--gold);
  border-color: var(--gold);
  box-shadow: 0 0 0 5px var(--sand);
}
.stepLabel {
  font-size: 13px;
  color: var(--ink);
  font-weight: 600;
}
.todo .stepLabel {
  color: var(--muted);
  font-weight: 500;
}
.cancelled {
  margin: 12px 0 4px;
  color: var(--danger);
  font-size: 14px;
}

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
  background: rgba(184, 145, 79, 0.12);
  color: #85652A;
  border-color: rgba(184, 145, 79, 0.22);
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
  background: rgba(207, 199, 184, 0.14);
  color: #3A352D;
  border-color: rgba(207, 199, 184, 0.22);
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
.actions .btnPrimary,
.actions .btnGhost,
.filters .btnGhost,
.emptyBox .btnPrimary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  font-weight: 600;
}
</style>

