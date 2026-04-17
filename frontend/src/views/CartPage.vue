<template>
  <section class="card">
    <h2>Cart</h2>

    <div v-if="cart.items.length === 0" class="muted">Your cart is empty.</div>

    <div v-else class="list">
      <div v-for="it in cart.items" :key="it.productID" class="item">
        <div class="left">
          <div class="name">{{ it.name }}</div>
          <div class="meta">{{ it.productID }}</div>
        </div>
        <div class="right">
          <input
            class="qty"
            type="number"
            min="1"
            :value="it.quantity"
            @input="cart.setQuantity(it.productID, $event.target.value)"
          />
          <div class="price">${{ (it.price * it.quantity).toFixed(2) }}</div>
          <button class="btn secondary small" @click="cart.remove(it.productID)">Remove</button>
        </div>
      </div>

      <div class="footer">
        <div class="total">
          <span>Total</span>
          <strong>${{ cart.total.toFixed(2) }}</strong>
        </div>
        <div class="pay">
          <select v-model="paymentMethod">
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
          </select>
          <button class="btn" :disabled="loading" @click="checkout">
            {{ loading ? 'Placing order...' : `Checkout (${paymentMethod})` }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="success" class="success">Order placed: {{ success }}</p>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useCartStore } from '../stores/cart'
import { api } from '../api/client'

const cart = useCartStore()
cart.hydrate()

const loading = ref(false)
const error = ref(null)
const success = ref(null)

const paymentMethod = ref('Cash')

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
  gap: 10px;
}
.item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.55);
}
.name {
  font-weight: 800;
  color: var(--text-h);
}
.meta {
  font-size: 12px;
  color: var(--text);
}
.right {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: end;
}
.qty {
  width: 70px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
}
.price {
  font-weight: 800;
  color: var(--text-h);
  min-width: 88px;
  text-align: right;
}
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}
.pay {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: end;
}
select {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
}
.total {
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: var(--text-h);
}
.btn {
  border: 0;
  cursor: pointer;
  background: #007aff;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 700;
}
.secondary {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-h);
}
.small {
  padding: 8px 10px;
  border-radius: 10px;
}
.error {
  margin-top: 12px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
}
.success {
  margin-top: 12px;
  color: #05603a;
  background: rgba(5, 96, 58, 0.08);
  border: 1px solid rgba(5, 96, 58, 0.18);
  padding: 8px 10px;
  border-radius: 12px;
}
</style>

