<template>
  <section class="page">
    <CheckoutSteps current="invoice" />

    <div class="head">
      <div class="headLeft">
        <img class="logo" :src="siteLogoUrl" :alt="tp('Al-Wakeel Al-Shamel')" />
        <div>
          <h1 class="h1">{{ tp('Your invoice') }}</h1>
          <p class="sub">{{ tp('Order') }} <span dir="ltr">{{ orderId }}</span> — {{ tp('official PDF invoice with full order details.') }}</p>
        </div>
      </div>
      <div v-if="invoice" class="headActions">
        <button class="btnPrimary" type="button" :disabled="downloading" @click="download">
          {{ tp(downloading ? 'Preparing PDF…' : 'Download PDF') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="muted">{{ tp('Loading invoice…') }}</div>
    <div v-else-if="error" class="error">{{ tp(error) }}</div>

    <div v-else-if="invoice" class="layout">
      <aside class="summaryCard">
        <div class="stamp" :class="{ due: !isPaid }">{{ tp(isPaid ? 'PAID' : 'PAYMENT DUE ON DELIVERY') }}</div>
        <div class="sumTitle">{{ tp('Invoice for order') }} <span dir="ltr">{{ invoice.orderId }}</span></div>

        <div class="block">
          <div class="blockTitle">{{ tp('Order') }}</div>
          <div class="detail"><span>{{ tp('Order number') }}</span><strong class="mono">{{ invoice.orderId }}</strong></div>
          <div class="detail"><span>{{ tp('Order date') }}</span><strong>{{ formatDate(invoice.orderDate) }}</strong></div>
          <div class="detail"><span>{{ tp('Status') }}</span><strong>{{ statusLabel(invoice.orderStatus) }}</strong></div>
        </div>

        <div class="block">
          <div class="blockTitle">{{ tp('Customer') }}</div>
          <div class="detail"><span>{{ tp('Name') }}</span><strong>{{ invoice.customerName }}</strong></div>
          <div class="detail"><span>{{ tp('Email') }}</span><strong>{{ invoice.email }}</strong></div>
        </div>

        <div class="block">
          <div class="blockTitle">{{ tp('Shipping') }}</div>
          <div class="detail"><span>{{ tp('Carrier') }}</span><strong>{{ invoice.shippingCarrier }}</strong></div>
          <div class="detail"><span>{{ tp('Service') }}</span><strong>{{ invoice.shippingService }}</strong></div>
          <div class="detail"><span>{{ tp('Cost') }}</span><strong>{{ invoice.shippingCostLabel }}</strong></div>
          <div class="detail"><span>{{ tp('Delivery') }}</span><strong>{{ invoice.shippingEstimatedDelivery }}</strong></div>
          <div class="detail">
            <span>{{ tp('Tracking') }}</span><strong class="mono small">{{ invoice.shippingTrackingNumber }}</strong>
          </div>
        </div>

        <div class="block">
          <div class="blockTitle">{{ tp('Payment') }}</div>
          <div class="detail"><span>{{ tp('Method') }}</span><strong>{{ tp(paymentLabel) }}</strong></div>
          <div class="detail"><span>{{ tp('Status') }}</span><strong>{{ tp(isPaid ? 'Paid' : 'Due on delivery') }}</strong></div>
          <div v-if="invoice.transactionReference" class="detail">
            <span>{{ tp('Transaction') }}</span><strong class="mono small">{{ invoice.transactionReference }}</strong>
          </div>
        </div>

        <div class="itemsBlock">
          <div class="blockTitle">{{ tp('Items') }}</div>
          <div v-for="it in invoice.items" :key="it.productId" class="itemRow">
            <div class="itemName" dir="auto">{{ it.name }}</div>
            <div class="itemMeta">{{ it.productId }} · {{ tp('Qty') }} {{ it.quantity }} × <span dir="ltr">{{ format(it.unitPrice) }}</span></div>
            <div class="itemTotal">{{ format(it.subtotal) }}</div>
          </div>
        </div>

        <div v-if="invoice.discount > 0" class="discountRow">
          <span>{{ tp('Discount') }} <span v-if="invoice.couponCode" dir="ltr">({{ invoice.couponCode }})</span></span>
          <span dir="ltr">-{{ format(invoice.discount) }}</span>
        </div>
        <div class="totalRow">
          <span>{{ tp(isPaid ? 'Total paid' : 'Amount due') }}</span>
          <strong dir="ltr">{{ format(invoice.totalPrice) }}</strong>
        </div>
      </aside>

      <div class="previewCard">
        <div class="previewHead">
          <div class="previewTitle">{{ tp('PDF Preview') }}</div>
          <button class="btnGhost" type="button" :disabled="downloading" @click="download">{{ tp('Download PDF') }}</button>
        </div>
        <iframe v-if="pdfUrl && !isMobile" class="pdfFrame" :src="pdfUrl" :title="tp('Invoice PDF preview')" />
        <div v-else-if="isMobile && invoice" class="mobilePdf">
          <div class="pdfFileIcon"><AppIcon name="receipt" :size="40" /></div>
          <p class="mobilePdfMsg">{{ tp('Tap the button below to download your PDF invoice.') }}</p>
          <button class="btnPrimary mobilePdfBtn" type="button" :disabled="downloading" @click="download">
            {{ tp(downloading ? 'Preparing…' : 'Download PDF Invoice') }}
          </button>
        </div>
        <div v-else class="pdfLoading">{{ tp('Generating PDF preview…') }}</div>
      </div>

      <CheckoutReturnPanel
        v-if="fromCheckout"
        class="returnPanel"
        :seconds-left="secondsLeft"
        message="Your transaction is complete. You will be returned to the store shortly."
        hint="Download your PDF invoice before leaving this page."
        button-label="Return to Al-Wakeel Al-Shamel"
        @proceed="proceedToStore"
      />
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../../i18n'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
import { useRoute, useRouter } from 'vue-router'
import CheckoutSteps from '../../components/CheckoutSteps.vue'
import CheckoutReturnPanel from '../../components/CheckoutReturnPanel.vue'
import { useReturnTimer } from '../../composables/useReturnTimer'
import { api } from '../../api/client'
import {
  downloadInvoicePdf,
  formatDate,
  loadInvoicePdfUrl,
  paymentMethodLabel,
} from '../../utils/invoice'
import { siteLogoUrl } from '../../utils/images'
import AppIcon from '../../components/AppIcon.vue'
import { useCurrency } from '../../composables/useCurrency'
import { clearCompletedOrder, loadCompletedOrder } from '../../stores/checkout'

const { tp, statusLabel } = useI18n()

const route = useRoute()
const router = useRouter()
const orderId = route.params.orderId

const invoice = ref(null)
const pdfUrl = ref(null)
const loading = ref(false)
const downloading = ref(false)
const error = ref(null)

const paymentLabel = computed(() => paymentMethodLabel(invoice.value?.paymentMethod))

// Card orders are paid at checkout; cash orders only once delivered.
const isPaid = computed(() => {
  const inv = invoice.value
  if (!inv) return false
  const status = String(inv.paymentStatus || '').toLowerCase()
  if (inv.paymentMethod !== 'Cash') return status !== 'failed'
  return String(inv.orderStatus || '').toLowerCase() === 'delivered' || status === 'completed' || status === 'paid'
})

// Only right after checkout do we count down back to the store (not when opened from "My orders").
const fromCheckout = ref(false)
const { format, currencyCode, rate } = useCurrency()

const { secondsLeft, start: startReturnTimer, proceedNow: proceedToStore } = useReturnTimer(() => {
  router.push({ name: 'products' })
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/api/invoices/${orderId}`)
    invoice.value = res.data
    if (!isMobile.value) {
      pdfUrl.value = await loadInvoicePdfUrl(api, orderId, currencyCode.value, rate.value)
    }
    if (fromCheckout.value) startReturnTimer()
  } catch (e) {
    error.value = e?.response?.data || 'Invoice not found for this order.'
  } finally {
    loading.value = false
  }
}

async function download() {
  downloading.value = true
  try {
    await downloadInvoicePdf(api, orderId, currencyCode.value, rate.value)
  } catch (e) {
    error.value = e?.response?.data || 'Unable to download PDF invoice.'
  } finally {
    downloading.value = false
  }
}


onMounted(() => {
  window.addEventListener('resize', onResize)
  fromCheckout.value = !!loadCompletedOrder(orderId)
  load()
  clearCompletedOrder()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
})
</script>

<style scoped>
.page {
  display: grid;
  gap: 14px;
  max-width: 1100px;
  margin: 0 auto;
}
.head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: end;
  flex-wrap: wrap;
}
.headLeft {
  display: flex;
  gap: 14px;
  align-items: center;
}
.logo {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  border: 1px solid var(--border);
  object-fit: cover;
  background: #fff;
}
.h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 950;
  letter-spacing: -0.7px;
  color: var(--text-h);
}
.sub {
  margin: 6px 0 0;
  color: var(--text);
  font-weight: 650;
}
.headActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.layout {
  display: grid;
  gap: 14px;
}
@media (min-width: 980px) {
  .layout {
    grid-template-columns: 360px 1fr;
    align-items: start;
  }
  .returnPanel {
    grid-column: 1 / -1;
  }
}
.btnPrimary,
.btnGhost {
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 950;
  cursor: pointer;
  text-decoration: none;
}
.btnPrimary {
  border: 0;
  background: var(--brand-blue);
  color: #fff;
}
.btnPrimary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.btnGhost {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-h);
}
.muted {
  color: var(--text);
  font-weight: 650;
}
.error {
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 10px 12px;
  border-radius: 12px;
}
.summaryCard {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  padding: 16px;
  display: grid;
  gap: 14px;
}
.stamp {
  justify-self: start;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e6f2ec;
  color: var(--success);
  border: 1px solid rgba(31, 122, 77, 0.25);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.stamp.due {
  background: var(--sand);
  color: var(--gold-text);
  border-color: rgba(184, 145, 79, 0.35);
}
.sumTitle {
  font-weight: 950;
  color: var(--text-h);
  font-size: 16px;
}
.block,
.itemsBlock {
  display: grid;
  gap: 8px;
}
.blockTitle {
  font-size: 11px;
  font-weight: 950;
  color: var(--brand-blue);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.detail {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}
.detail span {
  color: var(--muted);
  font-weight: 700;
  flex-shrink: 0;
}
.detail strong {
  color: var(--text-h);
  font-weight: 900;
  text-align: end;
  min-width: 0;
  overflow-wrap: anywhere;
}
.mono {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  word-break: break-all;
}
.small {
  font-size: 11px;
  word-break: break-all;
}
.itemRow {
  padding: 10px 0;
  border-top: 1px solid var(--border);
  display: grid;
  gap: 4px;
}
.itemName {
  font-weight: 900;
  color: var(--text-h);
}
.itemMeta {
  font-size: 12px;
  color: var(--muted);
  font-weight: 650;
}
.itemTotal {
  font-weight: 950;
  color: var(--text-h);
}
.totalRow {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 16px;
}
.totalRow strong {
  color: var(--brand-blue);
  font-weight: 950;
}
.previewCard {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: grid;
  min-height: 620px;
}
.previewHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: #FAF8F4;
}
.previewTitle {
  font-weight: 950;
  color: var(--text-h);
}
.pdfFrame {
  width: 100%;
  min-height: 560px;
  border: 0;
  background: #525659;
}
.pdfLoading {
  display: grid;
  place-items: center;
  min-height: 560px;
  color: var(--muted);
  font-weight: 700;
}
.mobilePdf {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 320px;
  padding: 32px 24px;
  text-align: center;
}
.pdfFileIcon {
  font-size: 52px;
}
.mobilePdfMsg {
  margin: 0;
  color: var(--text);
  font-weight: 650;
  line-height: 1.5;
}
.mobilePdfBtn {
  width: 100%;
  max-width: 280px;
  padding: 14px;
  font-size: 15px;
}
.returnPanel {
  width: 100%;
  max-width: none;
}
.discountRow {
  display: flex;
  justify-content: space-between;
  padding: 10px 0 0;
  color: var(--success);
  font-weight: 600;
  font-size: 14px;
}
</style>
