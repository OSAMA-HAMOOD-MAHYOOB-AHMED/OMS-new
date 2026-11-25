<template>
  <section class="page">
    <CheckoutSteps current="confirm" />

    <div class="card">
      <div class="successIcon" aria-hidden="true"><AppIcon name="check" :size="30" :stroke="2.6" /></div>
      <h1 class="h1">{{ tp('Order placed successfully') }}</h1>
      <p class="sub">
        {{ tp('Thank you for your purchase. Your order is being prepared for FedEx Express delivery.') }}
      </p>

      <div class="details">
        <div class="row">
          <span class="k">{{ tp('Order ID') }}</span>
          <span class="v mono">{{ order?.orderID }}</span>
        </div>
        <div v-if="order?.discount > 0" class="row">
          <span class="k">{{ tp('Discount') }} <span v-if="order.couponCode" dir="ltr">({{ order.couponCode }})</span></span>
          <span class="v" dir="ltr">-{{ format(order.discount) }}</span>
        </div>
        <div class="row">
          <span class="k">{{ tp(order?.paymentMethod === 'Cash' ? 'Amount due on delivery' : 'Amount paid') }}</span>
          <span class="v" dir="ltr">{{ format(order?.total || 0) }}</span>
        </div>
        <div class="row">
          <span class="k">{{ tp('Payment method') }}</span>
          <span class="v">{{ tp(methodLabel) }}</span>
        </div>
        <div v-if="order?.transactionId" class="row">
          <span class="k">{{ tp('Transaction ID') }}</span>
          <span class="v mono small">{{ order.transactionId }}</span>
        </div>
        <div class="row">
          <span class="k">{{ tp('Shipping') }}</span>
          <span class="v">{{ shippingLabel }}</span>
        </div>
        <div class="row">
          <span class="k">{{ tp('Delivery') }}</span>
          <span class="v">{{ tp(deliveryEta) }}</span>
        </div>
        <div v-if="trackingNumber" class="row">
          <span class="k">{{ tp('FedEx tracking') }}</span>
          <span class="v mono small">{{ trackingNumber }}</span>
        </div>
      </div>

      <p class="notice">
        {{ tp('We are emailing your confirmation and invoice to') }}
        <strong dir="ltr">{{ auth.email }}</strong>.
        {{ tp('If it is not in your inbox within a few minutes, check your spam folder.') }}
      </p>

      <CheckoutReturnPanel
        :seconds-left="secondsLeft"
        :total-seconds="CONFIRMATION_SECONDS"
        message="You will be redirected to your invoice page shortly. Please wait or click below to continue."
        hint="Do not close this browser window until you have saved your invoice."
        button-label="View invoice"
        @proceed="proceedToInvoice"
      />
    </div>
  </section>
</template>

<script setup>
import AppIcon from '../../components/AppIcon.vue'
import { useI18n } from '../../i18n'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CheckoutSteps from '../../components/CheckoutSteps.vue'
import CheckoutReturnPanel from '../../components/CheckoutReturnPanel.vue'
import { useReturnTimer } from '../../composables/useReturnTimer'
import { loadCompletedOrder, paymentMethodLabel } from '../../stores/checkout'
import { SHIPPING, trackingNumber as buildTracking } from '../../utils/shipping'
import { useCurrency } from '../../composables/useCurrency'
import { useAuthStore } from '../../stores/auth'

const { tp } = useI18n()
const auth = useAuthStore()

const route = useRoute()
const router = useRouter()
const { format } = useCurrency()

const order = ref(null)

const methodLabel = computed(() => paymentMethodLabel(order.value?.paymentMethod))
const shippingLabel = computed(() => {
  // The service name already includes the carrier ("FedEx Express").
  const service = order.value?.shippingService || SHIPPING.service
  const cost = order.value?.shippingCostLabel || SHIPPING.costLabel
  return `${service} — ${tp(cost)}`
})
const deliveryEta = computed(() => order.value?.shippingEstimatedDelivery || SHIPPING.estimatedDelivery)
const trackingNumber = computed(() =>
  order.value?.shippingTrackingNumber || (order.value?.orderID ? buildTracking(order.value.orderID) : ''),
)

// The confirmation is a short stop on the way to the invoice.
const CONFIRMATION_SECONDS = 15
const { secondsLeft, start: startReturnTimer, proceedNow: proceedToInvoice } = useReturnTimer(() => {
  goToInvoice()
}, CONFIRMATION_SECONDS)

function goToInvoice() {
  if (!order.value?.orderID) return
  router.push({ name: 'checkoutInvoice', params: { orderId: order.value.orderID } })
}

onMounted(() => {
  const orderId = route.params.orderId
  order.value = loadCompletedOrder(orderId)
  if (!order.value) {
    router.replace({ name: 'customerOrders' })
    return
  }
  startReturnTimer()
})
</script>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
}
.card {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  padding: 28px 22px;
  display: grid;
  gap: 14px;
  justify-items: center;
  text-align: center;
}
.successIcon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(5, 96, 58, 0.12);
  color: #05603a;
  font-size: 30px;
  font-weight: 950;
  border: 2px solid rgba(5, 96, 58, 0.25);
}
.h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 950;
  letter-spacing: -0.6px;
  color: var(--text-h);
}
.sub {
  margin: 0;
  color: var(--text);
  font-weight: 650;
  line-height: 1.5;
  max-width: 480px;
}
.details {
  width: 100%;
  max-width: 460px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  display: grid;
  gap: 10px;
  background: #FAF8F4;
  text-align: start;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}
.k {
  color: var(--muted);
  font-weight: 800;
  font-size: 12px;
}
.v {
  color: var(--text-h);
  font-weight: 950;
  text-align: end;
}
.mono {
  font-family: ui-monospace, Consolas, monospace;
}
.small {
  font-size: 11px;
  word-break: break-all;
}
.notice {
  margin: 0;
  font-size: 13px;
  color: var(--text);
  font-weight: 650;
  line-height: 1.45;
  max-width: 460px;
}
</style>
