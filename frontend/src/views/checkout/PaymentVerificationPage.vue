<template>
  <section class="page">
    <CheckoutSteps :current="phase === 'verified' ? 'confirm' : 'verify'" />

    <div class="card">
      <div class="iconWrap" aria-hidden="true">
        <div v-if="phase === 'verifying'" class="spinner" />
        <div v-else-if="phase === 'verified'" class="successIcon">✓</div>
      </div>

      <h1 class="h1">{{ tp(headline) }}</h1>
      <p class="sub">{{ tp(subline) }}</p>

      <div v-if="phase !== 'error'" class="progressList" role="status" aria-live="polite">
        <div
          v-for="(step, index) in visibleSteps"
          :key="step"
          class="progressItem"
          :class="{
            done: phase === 'verified' || index < stepIndex,
            active: phase === 'verifying' && index === stepIndex,
          }"
        >
          <span class="bullet">
            {{ phase === 'verified' || index < stepIndex ? '✓' : index === stepIndex ? '…' : '○' }}
          </span>
          <span>{{ tp(step) }}</span>
        </div>
      </div>

      <div class="amount" dir="ltr">{{ format(pending?.total || 0) }}</div>

      <button v-if="phase === 'verified'" class="btnPrimary" type="button" @click="goToConfirmation">
        {{ tp('Continue to confirmation') }}
      </button>

      <p v-if="error" class="error" role="alert">{{ tp(error) }}</p>

      <div v-if="error" class="actions">
        <RouterLink class="btnGhost" :to="{ name: 'cart' }">{{ tp('Back to cart') }}</RouterLink>
        <button class="btnPrimary" type="button" @click="retry">{{ tp('Try again') }}</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../../i18n'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import CheckoutSteps from '../../components/CheckoutSteps.vue'
import { api } from '../../api/client'
import { useCartStore } from '../../stores/cart'
import {
  clearPendingCheckout,
  loadPendingCheckout,
  saveCompletedOrder,
} from '../../stores/checkout'
import { useCurrency } from '../../composables/useCurrency'

const { tp } = useI18n()

const router = useRouter()
const { format } = useCurrency()
const cart = useCartStore()
cart.hydrate()

const pending = ref(null)
const error = ref(null)
const phase = ref('verifying')
const stepIndex = ref(0)
const started = ref(false)
const completedOrder = ref(null)

const creditCardSteps = [
  'Validating payment details',
  'Contacting card issuer',
  'Authorizing transaction',
  'Verifying payment status',
  'Finalizing your order',
]

const cashSteps = [
  'Confirming order details',
  'Scheduling FedEx shipment',
  'Preparing cash on delivery',
  'Finalizing your order',
]

const visibleSteps = computed(() => {
  if (pending.value?.paymentMethod === 'Cash') return cashSteps
  return creditCardSteps
})

const headline = computed(() => {
  if (error.value) return 'Order processing failed'
  if (phase.value === 'verified') {
    return pending.value?.paymentMethod === 'Cash' ? 'Order received' : 'Payment verified'
  }
  if (pending.value?.paymentMethod === 'Cash') return 'Processing your order'
  return 'Verifying your payment'
})

const subline = computed(() => {
  if (error.value) return 'We could not complete your order. Please try again.'
  if (phase.value === 'verified') {
    return 'Taking you to your order confirmation…'
  }
  if (pending.value?.paymentMethod === 'Cash') {
    return 'Your order is being prepared for FedEx Express delivery with cash on delivery.'
  }
  return 'Your payment is being securely verified with the payment gateway. This may take a moment.'
})

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function animateSteps() {
  for (let i = 0; i < visibleSteps.value.length; i += 1) {
    stepIndex.value = i
    await sleep(i === visibleSteps.value.length - 1 ? 2400 : 2000)
  }
}

let leaving = false
function goToConfirmation() {
  if (!completedOrder.value?.orderID || leaving) return
  leaving = true
  router.replace({
    name: 'checkoutConfirmation',
    params: { orderId: completedOrder.value.orderID },
  })
}

async function submitCheckout() {
  if (!pending.value || started.value) return
  started.value = true
  error.value = null
  phase.value = 'verifying'
  stepIndex.value = 0

  try {
    const animation = animateSteps()
    const request = api.post('/api/orders/checkout', {
      paymentMethod: pending.value.paymentMethod,
      items: pending.value.items,
      paymentDetails: pending.value.paymentDetails,
      couponCode: pending.value.couponCode || null,
    })
    const [res] = await Promise.all([request, animation])

    completedOrder.value = {
      orderID: res.data.orderID,
      total: res.data.totalPrice ?? pending.value.total,
      paymentMethod: res.data.paymentMethod ?? pending.value.paymentMethod,
      transactionId: res.data.transactionId ?? null,
      shippingCarrier: res.data.shippingCarrier,
      shippingService: res.data.shippingService,
      shippingCostLabel: res.data.shippingCostLabel,
      shippingEstimatedDelivery: res.data.shippingEstimatedDelivery,
      shippingTrackingNumber: res.data.shippingTrackingNumber,
      discount: res.data.discount || 0,
      couponCode: res.data.couponCode || null,
    }

    cart.clear()
    clearPendingCheckout()
    sessionStorage.removeItem('oms_coupon')
    saveCompletedOrder(completedOrder.value)

    phase.value = 'verified'
    stepIndex.value = visibleSteps.value.length
    // A short pause so the finished checklist is seen, then on to the confirmation step.
    setTimeout(goToConfirmation, 1800)
  } catch (e) {
    error.value = e?.response?.data || 'Payment verification failed. Please check your details and try again.'
    phase.value = 'error'
    started.value = false
  }
}

function retry() {
  started.value = false
  stepIndex.value = 0
  phase.value = 'verifying'
  submitCheckout()
}

onMounted(() => {
  pending.value = loadPendingCheckout()
  if (!pending.value?.items?.length) {
    router.replace({ name: 'cart' })
    return
  }
  submitCheckout()
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
.iconWrap {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
}
.spinner {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 4px solid #E4DCCB;
  border-top-color: var(--brand-blue);
  animation: spin 0.85s linear infinite;
}
.successIcon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(5, 96, 58, 0.12);
  color: #05603a;
  font-size: 26px;
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
  max-width: 460px;
}
.progressList {
  width: 100%;
  max-width: 420px;
  display: grid;
  gap: 8px;
  text-align: start;
  margin-top: 4px;
}
.progressItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #FAF8F4;
  color: var(--muted);
  font-weight: 750;
  font-size: 13px;
}
.progressItem.active {
  border-color: rgba(184, 145, 79, 0.35);
  background: rgba(184, 145, 79, 0.06);
  color: var(--text-h);
}
.progressItem.done {
  border-color: rgba(5, 96, 58, 0.25);
  background: rgba(5, 96, 58, 0.06);
  color: #05603a;
}
.bullet {
  width: 18px;
  flex-shrink: 0;
  text-align: center;
  font-weight: 950;
}
.amount {
  font-size: 30px;
  font-weight: 950;
  color: var(--text-h);
  letter-spacing: -0.5px;
}
.error {
  margin: 0;
  width: 100%;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 750;
}
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}
.btnPrimary,
.btnGhost {
  border-radius: 14px;
  padding: 11px 14px;
  font-weight: 950;
  cursor: pointer;
  text-decoration: none;
}
.btnPrimary {
  border: 0;
  background: var(--brand-blue);
  color: #fff;
}
.btnGhost {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-h);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
