<template>
  <section class="page">
    <CheckoutSteps current="confirm" />

    <div class="card">
      <div class="successIcon" aria-hidden="true">✓</div>
      <h1 class="h1">Order placed successfully</h1>
      <p class="sub">
        Thank you for your purchase. Your order is being prepared for FedEx Express delivery.
      </p>

      <div class="details">
        <div class="row">
          <span class="k">Order ID</span>
          <span class="v mono">{{ order?.orderID }}</span>
        </div>
        <div class="row">
          <span class="k">Amount paid</span>
          <span class="v">${{ Number(order?.total || 0).toFixed(2) }}</span>
        </div>
        <div class="row">
          <span class="k">Payment method</span>
          <span class="v">{{ methodLabel }}</span>
        </div>
        <div v-if="order?.transactionId" class="row">
          <span class="k">Transaction ID</span>
          <span class="v mono small">{{ order.transactionId }}</span>
        </div>
        <div class="row">
          <span class="k">Shipping</span>
          <span class="v">{{ shippingLabel }}</span>
        </div>
        <div class="row">
          <span class="k">Delivery</span>
          <span class="v">{{ deliveryEta }}</span>
        </div>
        <div v-if="trackingNumber" class="row">
          <span class="k">FedEx tracking</span>
          <span class="v mono small">{{ trackingNumber }}</span>
        </div>
      </div>

      <p class="notice">
        A confirmation email with your invoice has been sent to your registered email address.
      </p>

      <CheckoutReturnPanel
        :seconds-left="secondsLeft"
        message="You will be redirected to your invoice page shortly. Please wait or click below to continue."
        hint="Do not close this browser window until you have saved your invoice."
        button-label="Return to Al-Wakeel Al-Shamel"
        @proceed="proceedToInvoice"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CheckoutSteps from '../../components/CheckoutSteps.vue'
import CheckoutReturnPanel from '../../components/CheckoutReturnPanel.vue'
import { useReturnTimer } from '../../composables/useReturnTimer'
import { loadCompletedOrder, paymentMethodLabel } from '../../stores/checkout'
import { SHIPPING, trackingNumber as buildTracking } from '../../utils/shipping'

const route = useRoute()
const router = useRouter()

const order = ref(null)

const methodLabel = computed(() => paymentMethodLabel(order.value?.paymentMethod))
const shippingLabel = computed(() => {
  const carrier = order.value?.shippingCarrier || SHIPPING.carrier
  const service = order.value?.shippingService || SHIPPING.service
  const cost = order.value?.shippingCostLabel || SHIPPING.costLabel
  return `${carrier} ${service} — ${cost}`
})
const deliveryEta = computed(() => order.value?.shippingEstimatedDelivery || SHIPPING.estimatedDelivery)
const trackingNumber = computed(() =>
  order.value?.shippingTrackingNumber || (order.value?.orderID ? buildTracking(order.value.orderID) : ''),
)

const { secondsLeft, start: startReturnTimer, proceedNow: proceedToInvoice } = useReturnTimer(() => {
  goToInvoice()
})

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
  background: #f8fafc;
  text-align: left;
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
  text-align: right;
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
