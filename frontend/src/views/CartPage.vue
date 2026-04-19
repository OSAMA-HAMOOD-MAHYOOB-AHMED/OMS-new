<template>
  <section class="page">
    <h1 class="h1">Shopping Cart</h1>

    <div v-if="cart.items.length === 0" class="empty">
      <div class="emptyTitle">Your cart is empty</div>
      <RouterLink class="btnGhost" :to="{ name: 'products' }">Browse products</RouterLink>
    </div>

    <div v-else class="layout">
      <div class="items">
        <article v-for="it in cart.items" :key="it.productID" class="item">
          <div class="thumb" :style="{ backgroundImage: `url(${itemImage(it.productID)})` }" />

          <div class="mid">
            <div class="name">{{ it.name }}</div>
            <div class="meta">Accessory</div>
            <div class="unit">${{ Number(it.price).toFixed(2) }}</div>
          </div>

          <div class="right">
            <button class="trash" type="button" title="Remove" @click="cart.remove(it.productID)">🗑</button>

            <div class="stepper" role="group" aria-label="Quantity">
              <button class="step" type="button" @click="bump(it.productID, -1)">−</button>
              <div class="qty">{{ it.quantity }}</div>
              <button class="step" type="button" @click="bump(it.productID, 1)">+</button>
            </div>
          </div>
        </article>
      </div>

      <aside class="summary">
        <div class="sumTitle">Order Summary</div>

        <div class="row">
          <div class="k">Subtotal</div>
          <div class="v">${{ cart.total.toFixed(2) }}</div>
        </div>
        <div class="row">
          <div class="k">Shipping</div>
          <div class="v muted">Free</div>
        </div>

        <div class="hr" />

        <div class="row total">
          <div class="k">Total</div>
          <div class="v big">${{ cart.total.toFixed(2) }}</div>
        </div>

        <label class="payLabel">
          <span>Payment</span>
          <select v-model="paymentMethod" class="select">
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
          </select>
        </label>

        <button class="btnPrimary" type="button" :disabled="loading" @click="checkout">
          {{ loading ? 'Placing order...' : 'Place Order' }}
        </button>

        <RouterLink class="btnGhost full" :to="{ name: 'products' }">Continue Shopping</RouterLink>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">Order placed: {{ success }}</p>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { api } from '../api/client'

const cart = useCartStore()
cart.hydrate()

const loading = ref(false)
const error = ref(null)
const success = ref(null)

const paymentMethod = ref('Cash')

function itemImage(productID) {
  const id = String(productID || 'x')
  const n = (id.charCodeAt(id.length - 1) || 7) % 16
  const idx = String(n + 1).padStart(2, '0')
  return `/mock/frame-${idx}.png`
}

function bump(productID, delta) {
  const it = cart.items.find((x) => x.productID === productID)
  if (!it) return
  const next = Math.max(1, Number(it.quantity) + delta)
  cart.setQuantity(productID, next)
}

async function checkout() {
  loading.value = true
  error.value = null
  success.value = null
  try {
    const res = await api.post('/api/orders/checkout', {
      paymentMethod: paymentMethod.value,
      items: cart.items.map((i) => ({ productID: i.productID, quantity: i.quantity })),
    })
    success.value = res.data.orderID
    cart.clear()
  } catch (e) {
    error.value = e?.response?.data || 'Checkout failed'
  } finally {
    loading.value = false
  }
}
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
  border: 1px dashed rgba(148, 163, 184, 0.55);
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
  border: 1px solid rgba(148, 163, 184, 0.25);
  background-size: cover;
  background-position: center;
  background-color: #f1f5f9;
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
  background: #f8fafc;
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
.hr {
  height: 1px;
  background: var(--border);
}
.total .big {
  font-size: 22px;
  letter-spacing: -0.4px;
}

.payLabel {
  display: grid;
  gap: 8px;
  margin-top: 4px;
}
.payLabel span {
  font-size: 12px;
  font-weight: 900;
  color: #334155;
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
  margin-top: 6px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}
.success {
  margin-top: 6px;
  color: #05603a;
  background: rgba(5, 96, 58, 0.08);
  border: 1px solid rgba(5, 96, 58, 0.18);
  padding: 8px 10px;
  border-radius: 12px;
}
</style>

