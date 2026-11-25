<template>
  <section class="page">
    <CheckoutSteps current="details" />

    <h1 class="h1">{{ tp('Shopping Cart') }}</h1>

    <div v-if="cart.items.length === 0" class="empty">
      <div class="emptyTitle">{{ tp('Your cart is empty') }}</div>
      <RouterLink class="btnGhost" :to="{ name: 'products' }">{{ tp('Browse products') }}</RouterLink>
    </div>

    <div v-else class="layout">
      <div class="items">
        <article v-for="it in cart.items" :key="it.productID" class="item">
          <div class="thumb" :style="{ backgroundImage: `url(${itemImage(it)})` }" />

          <div class="mid">
            <div class="name">{{ it.name }}</div>
            <div class="meta">{{ tp('Accessory') }}</div>
            <div class="unit">{{ format(it.price) }}</div>
          </div>

          <div class="right">
            <button class="trash" type="button" :title="tp('Remove')" @click="cart.remove(it.productID)">🗑</button>

            <div class="stepper" role="group" :aria-label="tp('Quantity')">
              <button class="step" type="button" @click="bump(it.productID, -1)">−</button>
              <div class="qty">{{ it.quantity }}</div>
              <button class="step" type="button" @click="bump(it.productID, 1)">+</button>
            </div>
          </div>
        </article>
      </div>

      <aside class="summary">
        <div class="sumTitle">{{ tp('Order Summary') }}</div>

        <div class="row">
          <div class="k">{{ tp('Subtotal') }}</div>
          <div class="v">{{ format(cart.total) }}</div>
        </div>
        <div class="row">
          <div class="k">{{ tp('Shipping') }}</div>
          <div class="v shipVal">{{ tp(shippingSummary()) }}</div>
        </div>

        <div class="shippingBox">
          <div class="shipHead">
            <span class="fedexBadge">{{ tp('FedEx') }}</span>
            <span class="shipService">{{ SHIPPING.service }}</span>
          </div>
          <div class="shipMeta">{{ tp('Estimated delivery') }}: {{ tp(SHIPPING.estimatedDelivery) }}</div>
          <div class="shipMeta">{{ tp('Standard express delivery to your registered address.') }}</div>
        </div>

        <!-- Discount code: checked with the server now and again when the order is placed. -->
        <form class="couponForm" novalidate @submit.prevent="applyCoupon">
          <label class="srOnly" for="couponCode">{{ tp('Discount code') }}</label>
          <div v-if="!coupon" class="couponRow">
            <AppIcon name="tag" :size="18" class="couponIcon" />
            <input
              id="couponCode"
              v-model.trim="couponInput"
              class="couponInput"
              type="text"
              dir="ltr"
              autocomplete="off"
              maxlength="40"
              :placeholder="tp('Discount code')"
            />
            <button class="couponBtn" type="submit" :disabled="checkingCoupon || !couponInput">
              {{ checkingCoupon ? tp('Checking…') : tp('Apply') }}
            </button>
          </div>
          <div v-else class="couponApplied">
            <AppIcon name="check" :size="18" />
            <span><strong dir="ltr">{{ coupon.code }}</strong> · {{ coupon.percent }}% {{ tp('off') }}</span>
            <button type="button" class="couponRemove" @click="removeCoupon">{{ tp('Remove') }}</button>
          </div>
          <p v-if="couponError" class="couponError" role="alert">{{ tp(couponError) }}</p>
        </form>

        <div v-if="coupon" class="row">
          <div class="k">{{ tp('Discount') }}</div>
          <div class="v discountVal" dir="ltr">-{{ format(discount) }}</div>
        </div>

        <div class="hr" />

        <div class="row total">
          <div class="k">{{ tp('Total') }}</div>
          <div class="v big">{{ format(grandTotal) }}</div>
        </div>

        <form class="checkoutForm" novalidate @submit.prevent="checkout">
          <label class="payLabel">
            <span>{{ tp('Payment Method') }}</span>
            <select
              v-model="paymentMethod"
              class="select"
              :disabled="submitting"
              @change="onPaymentMethodChange"
            >
              <option value="CreditCard">{{ tp('Credit Card') }}</option>
              <option value="Cash">{{ tp('Cash on Delivery') }}</option>
            </select>
          </label>

          <div v-if="paymentMethod === 'CreditCard'" class="payForm">
            <label class="field" :class="{ invalid: showError('cardName') }">
              <span>{{ tp('Cardholder Name') }}</span>
              <input
                v-model.trim="cardName"
                :placeholder="tp('Ahmed Ali')"
                autocomplete="cc-name"
                :disabled="submitting"
                :aria-invalid="showError('cardName') ? 'true' : 'false'"
                @blur="touch('cardName')"
                @input="revalidate('cardName')"
              />
              <span v-if="showError('cardName')" class="fieldError" role="alert">{{ tp(errors.cardName) }}</span>
            </label>

            <label class="field" :class="{ invalid: showError('cardNumber') }">
              <span class="labelRow">
                <span>{{ tp('Card Number') }}</span>
                <span v-if="cardBrand" class="cardBrand">{{ cardBrand }}</span>
              </span>
              <input
                :value="cardNumber"
                placeholder="4111 1111 1111 1111"
                inputmode="numeric"
                autocomplete="cc-number"
                maxlength="23"
                :disabled="submitting"
                :aria-invalid="showError('cardNumber') ? 'true' : 'false'"
                @input="onCardNumberInput"
                @blur="touch('cardNumber')"
              />
              <span v-if="showError('cardNumber')" class="fieldError" role="alert">{{ tp(errors.cardNumber) }}</span>
            </label>

            <div class="row2">
              <label class="field" :class="{ invalid: showError('cardExpiry') }">
                <span>{{ tp('Expiry (MM/YY)') }}</span>
                <input
                  :value="cardExpiry"
                  placeholder="12/28"
                  maxlength="5"
                  inputmode="numeric"
                  autocomplete="cc-exp"
                  :disabled="submitting"
                  :aria-invalid="showError('cardExpiry') ? 'true' : 'false'"
                  @input="onExpiryInput"
                  @blur="touch('cardExpiry')"
                />
                <span v-if="showError('cardExpiry')" class="fieldError" role="alert">{{ tp(errors.cardExpiry) }}</span>
              </label>

              <label class="field" :class="{ invalid: showError('cardCvv') }">
                <span>{{ tp('CVV') }}</span>
                <input
                  v-model.trim="cardCvv"
                  placeholder="123"
                  type="password"
                  :maxlength="cardBrand === 'Amex' ? 4 : 3"
                  inputmode="numeric"
                  autocomplete="cc-csc"
                  :disabled="submitting"
                  :aria-invalid="showError('cardCvv') ? 'true' : 'false'"
                  @input="onCvvInput"
                  @blur="touch('cardCvv')"
                />
                <span v-if="showError('cardCvv')" class="fieldError" role="alert">{{ tp(errors.cardCvv) }}</span>
              </label>
            </div>

            <p class="hint secure">
              <span class="lock" aria-hidden="true">🔒</span>
              {{ tp('Card details are validated locally and never stored. Use test card') }} <code>4111 1111 1111 1111</code>.
            </p>
          </div>

          <div v-if="paymentMethod === 'Cash'" class="payForm">
            <div class="cashBox">
              <div class="cashTitle">{{ tp('Cash on delivery') }}</div>
              <p class="hint">
                {{ tp('Pay in cash when your FedEx shipment arrives. No card details are required to place this order.') }}
              </p>
            </div>
          </div>

          <p v-if="formError" class="error" role="alert">{{ tp(formError) }}</p>

          <button class="btnPrimary" type="submit" :disabled="submitting || !canSubmit">
            {{ tp(submitLabel) }}
          </button>
        </form>

        <RouterLink class="btnGhost full" :to="{ name: 'products' }">{{ tp('Continue Shopping') }}</RouterLink>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { api } from '../api/client'
import AppIcon from '../components/AppIcon.vue'
import { useI18n } from '../i18n'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import CheckoutSteps from '../components/CheckoutSteps.vue'
import { useCartStore } from '../stores/cart'
import { savePendingCheckout } from '../stores/checkout'
import { productImageUrl } from '../utils/images'
import {
  detectCardBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  validatePaymentForm,
} from '../utils/payment'
import { SHIPPING, shippingSummary } from '../utils/shipping'
import { useCurrency } from '../composables/useCurrency'

const { tp } = useI18n()
const auth = useAuthStore()
const route = useRoute()

const cart = useCartStore()
const router = useRouter()
cart.hydrate()
const { format } = useCurrency()

const submitting = ref(false)
const formError = ref(null)
const submitted = ref(false)

const paymentMethod = ref('CreditCard')
const cardName = ref('')
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvv = ref('')

const touched = reactive({
  cardName: false,
  cardNumber: false,
  cardExpiry: false,
  cardCvv: false,
})

const errors = reactive({
  cardName: null,
  cardNumber: null,
  cardExpiry: null,
  cardCvv: null,
})

const cardBrand = computed(() => detectCardBrand(cardNumber.value))

const paymentFields = computed(() => ({
  cardName: cardName.value,
  cardNumber: cardNumber.value,
  cardExpiry: cardExpiry.value,
  cardCvv: cardCvv.value,
}))

const validation = computed(() => validatePaymentForm(paymentMethod.value, paymentFields.value))

const canSubmit = computed(() => validation.value.valid && !submitting.value)

const submitLabel = computed(() => {
  if (!validation.value.valid) return 'Complete payment details'
  return 'Place Order'
})

function itemImage(item) {
  return productImageUrl({ productID: item.productID, imageUrl: item.imageUrl })
}

function bump(productID, delta) {
  const it = cart.items.find((x) => x.productID === productID)
  if (!it) return
  const next = Math.max(1, Number(it.quantity) + delta)
  cart.setQuantity(productID, next)
}

function touch(field) {
  touched[field] = true
  applyValidation()
}

function showError(field) {
  return (touched[field] || submitted.value) && errors[field]
}

function applyValidation() {
  const { errors: next } = validatePaymentForm(paymentMethod.value, paymentFields.value)
  for (const key of Object.keys(errors)) {
    errors[key] = next[key] ?? null
  }
}

function revalidate(field) {
  if (touched[field] || submitted.value) applyValidation()
}

function resetTouched() {
  for (const key of Object.keys(touched)) touched[key] = false
}

function onPaymentMethodChange() {
  formError.value = null
  submitted.value = false
  resetTouched()
  applyValidation()
}

function onCardNumberInput(e) {
  cardNumber.value = formatCardNumber(e.target.value)
  revalidate('cardNumber')
  if (touched.cardCvv || submitted.value) revalidate('cardCvv')
}

function onExpiryInput(e) {
  cardExpiry.value = formatExpiry(e.target.value)
  revalidate('cardExpiry')
}

function onCvvInput(e) {
  cardCvv.value = digitsOnly(e.target.value).slice(0, cardBrand.value === 'Amex' ? 4 : 3)
  revalidate('cardCvv')
}

function buildPaymentDetails() {
  if (paymentMethod.value === 'CreditCard') {
    return {
      creditCard: {
        cardNumber: cardNumber.value,
        expiry: cardExpiry.value,
        cvv: cardCvv.value,
        cardholderName: cardName.value,
      },
      onlineBanking: null,
    }
  }
  return null
}

// ----- Discount code -----
const couponInput = ref('')
const coupon = ref(loadSavedCoupon())
const couponError = ref(null)
const checkingCoupon = ref(false)

function loadSavedCoupon() {
  try {
    return JSON.parse(sessionStorage.getItem('oms_coupon') || 'null')
  } catch {
    return null
  }
}

// The percentage is fixed; the amount follows the cart.
const discount = computed(() =>
  coupon.value ? Math.round(cart.total * coupon.value.percent) / 100 : 0,
)
const grandTotal = computed(() => Math.max(0, cart.total - discount.value))

async function applyCoupon() {
  couponError.value = null
  if (!couponInput.value) return
  if (!auth.token) {
    router.push({ name: 'login', query: { next: route.fullPath } })
    return
  }
  checkingCoupon.value = true
  try {
    const { data } = await api.post('/api/coupons/check', { code: couponInput.value, subtotal: cart.total })
    coupon.value = { code: data.code, percent: data.percent }
    sessionStorage.setItem('oms_coupon', JSON.stringify(coupon.value))
    couponInput.value = ''
  } catch (e) {
    couponError.value = (typeof e?.response?.data === 'string' && e.response.data) || 'Could not check the code. Please try again.'
  } finally {
    checkingCoupon.value = false
  }
}

function removeCoupon() {
  coupon.value = null
  sessionStorage.removeItem('oms_coupon')
}

async function checkout() {
  submitted.value = true
  applyValidation()

  if (!validation.value.valid) {
    formError.value = 'Please fix the highlighted payment fields before continuing.'
    return
  }

  submitting.value = true
  formError.value = null

  try {
    savePendingCheckout({
      paymentMethod: paymentMethod.value,
      items: cart.items.map((i) => ({ productID: i.productID, quantity: i.quantity })),
      paymentDetails: buildPaymentDetails(),
      couponCode: coupon.value?.code || null,
      discount: discount.value,
      total: grandTotal.value,
      shipping: { ...SHIPPING },
    })

    await router.push({ name: 'checkoutVerify' })
  } catch {
    formError.value = 'Unable to start checkout. Please try again.'
  } finally {
    submitting.value = false
  }
}

watch(paymentMethod, () => {
  applyValidation()
})

applyValidation()
</script>

<style scoped>
.page {
  display: grid;
  gap: 14px;
}
.h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 950;
  letter-spacing: -0.9px;
  color: var(--text-h);
}

.empty {
  border: 1px dashed rgba(207, 199, 184, 0.55);
  border-radius: 16px;
  padding: 22px;
  background: #fff;
  display: grid;
  gap: 10px;
  justify-items: start;
}
.emptyTitle {
  font-weight: 950;
  color: var(--text-h);
}

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: start;
}
@media (min-width: 980px) {
  .layout {
    grid-template-columns: 1.15fr 0.55fr;
  }
}

.items {
  display: grid;
  gap: 12px;
}
.item {
  display: grid;
  grid-template-columns: 92px 1fr auto;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  align-items: center;
}
.thumb {
  width: 92px;
  height: 92px;
  border-radius: 14px;
  border: 1px solid rgba(207, 199, 184, 0.25);
  background-size: cover;
  background-position: center;
  background-color: #F4F0E8;
}
.mid {
  min-width: 0;
}
.name {
  font-weight: 950;
  color: var(--text-h);
  letter-spacing: -0.2px;
}
.meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
  font-weight: 800;
}
.unit {
  margin-top: 8px;
  font-weight: 950;
  color: var(--text-h);
}

.right {
  justify-self: end;
  display: grid;
  justify-items: end;
  gap: 10px;
}
.trash {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  filter: grayscale(1);
}
.stepper {
  display: inline-grid;
  grid-template-columns: 38px 44px 38px;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}
.step {
  border: 0;
  background: #FAF8F4;
  cursor: pointer;
  font-weight: 950;
  color: var(--text-h);
}
.qty {
  display: grid;
  place-items: center;
  font-weight: 950;
  color: var(--text-h);
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
}

.summary {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  display: grid;
  gap: 10px;
}
.sumTitle {
  font-weight: 950;
  color: var(--text-h);
}
.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.k {
  color: var(--text);
  font-weight: 750;
}
.v {
  font-weight: 950;
  color: var(--text-h);
}
.muted {
  color: var(--muted);
}
.shipVal {
  font-size: 12px;
  font-weight: 850;
  text-align: end;
  max-width: 160px;
}
.shippingBox {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: #FAF8F4;
  display: grid;
  gap: 6px;
}
.shipHead {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.fedexBadge {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 8px;
  background: #4d148c;
  color: #fff;
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.03em;
}
.shipService {
  font-weight: 900;
  color: var(--text-h);
  font-size: 13px;
}
.shipMeta {
  font-size: 11px;
  color: var(--muted);
  font-weight: 650;
  line-height: 1.4;
}
.cashBox {
  border: 1px dashed rgba(184, 145, 79, 0.35);
  border-radius: 12px;
  padding: 12px;
  background: rgba(184, 145, 79, 0.04);
}
.cashTitle {
  font-weight: 950;
  color: var(--text-h);
  margin-bottom: 6px;
}
.hr {
  height: 1px;
  background: var(--border);
}
.total .big {
  font-size: 22px;
  letter-spacing: -0.4px;
}

.checkoutForm {
  display: grid;
  gap: 10px;
}

.payLabel {
  display: grid;
  gap: 8px;
  margin-top: 4px;
}
.payLabel span {
  font-size: 12px;
  font-weight: 900;
  color: #3A352D;
}
.select {
  width: 100%;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #fff;
  font-weight: 900;
  color: var(--text-h);
}
.select.inner {
  padding: 10px 12px;
}

.payForm {
  display: grid;
  gap: 10px;
}
.field {
  display: grid;
  gap: 6px;
}
.field span {
  font-size: 11px;
  font-weight: 900;
  color: #475569;
}
.labelRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.cardBrand {
  font-size: 10px;
  font-weight: 950;
  color: var(--brand-blue);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.field input,
.field select {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  font-weight: 700;
  color: var(--text-h);
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 3px rgba(184, 145, 79, 0.12);
}
.field.invalid input,
.field.invalid select {
  border-color: #f04438;
  background: #fffbfa;
}
.field.invalid input:focus,
.field.invalid select:focus {
  box-shadow: 0 0 0 3px rgba(240, 68, 56, 0.12);
}
.fieldError {
  font-size: 11px;
  font-weight: 750;
  color: #b42318;
  line-height: 1.35;
}
.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.hint {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
  font-weight: 650;
  line-height: 1.4;
}
.hint.secure {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #FAF8F4;
  border: 1px solid rgba(207, 199, 184, 0.25);
}
.hint code {
  font-size: 10px;
  font-weight: 800;
  color: #3A352D;
}
.lock {
  flex-shrink: 0;
}

.btnPrimary {
  border: 0;
  cursor: pointer;
  background: var(--brand-blue);
  color: #fff;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 950;
  box-shadow: var(--shadow-sm);
}
.btnPrimary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.btnGhost {
  display: inline-flex;
  justify-content: center;
  text-decoration: none;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-h);
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 950;
}
.full {
  width: 100%;
  box-sizing: border-box;
}

.error {
  margin: 0;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 750;
}

@media (max-width: 520px) {
  .h1 {
    font-size: 28px;
  }
  .item {
    grid-template-columns: 72px 1fr;
    grid-template-areas:
      'thumb mid'
      'actions actions';
    align-items: start;
  }
  .thumb {
    grid-area: thumb;
    width: 72px;
    height: 72px;
  }
  .mid {
    grid-area: mid;
  }
  .right {
    grid-area: actions;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    justify-self: stretch;
    display: flex;
  }
  .row2 {
    grid-template-columns: 1fr;
  }
  .summary {
    position: sticky;
    bottom: 8px;
  }
}
/* ----- Discount code ----- */
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.couponForm {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.couponRow {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px dashed var(--gold);
  border-radius: 12px;
  padding: 4px 4px 4px 12px;
  background: var(--sand);
}
[dir='rtl'] .couponRow {
  padding: 4px 12px 4px 4px;
}
.couponIcon {
  color: var(--gold-text);
  flex-shrink: 0;
}
.couponInput {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  height: 38px;
  font: inherit;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  outline: none;
}
.couponBtn {
  height: 38px;
  padding: 0 14px;
  border: 0;
  border-radius: 10px;
  background: var(--ink);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.couponBtn:disabled {
  opacity: 0.5;
  cursor: default;
}
.couponApplied {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #e6f2ec;
  color: var(--success);
  font-size: 14px;
}
.couponRemove {
  margin-inline-start: auto;
  border: 0;
  background: none;
  color: var(--danger);
  font-weight: 600;
  cursor: pointer;
}
.couponError {
  margin: 0;
  color: var(--danger);
  font-size: 13px;
}
.discountVal {
  color: var(--success);
  font-weight: 600;
}
</style>
