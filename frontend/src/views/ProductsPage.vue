<template>
  <section class="card">
    <div class="row">
      <div>
        <h2>Products</h2>
        <p class="muted">Browse and add items to your cart.</p>
      </div>
      <button v-if="role === 'Customer'" class="btn" @click="$router.push({ name: 'cart' })">
        Cart ({{ cart.items.length }})
      </button>
    </div>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="grid">
      <article v-for="p in products" :key="p.productID" class="product" @click="open(p.productID)">
        <div class="top">
          <div class="name">{{ p.name }}</div>
          <div class="cat">{{ p.category }}</div>
        </div>
        <div class="desc">{{ p.description || '—' }}</div>
        <div class="bottom">
          <div class="price">${{ Number(p.price).toFixed(2) }}</div>
          <div class="stock">In stock: {{ p.stockLevel }}</div>
        </div>
        <div v-if="role === 'Customer'" class="actions" @click.stop>
          <button class="btn small" :disabled="p.stockLevel <= 0" @click="add(p)">Add to cart</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
auth.hydrate()
const role = computed(() => auth.role)

const cart = useCartStore()
cart.hydrate()
const router = useRouter()

const products = ref([])
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/products')
    products.value = res.data
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load products'
  } finally {
    loading.value = false
  }
}

function add(p) {
  cart.add(p, 1)
}

function open(productID) {
  router.push({ name: 'productDetails', params: { id: productID } })
}

onMounted(load)
</script>

<style scoped>
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}
.row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}
.muted {
  color: var(--text);
  margin-top: 6px;
}
.grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.product {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.55);
  display: grid;
  gap: 8px;
  cursor: pointer;
}
.name {
  font-weight: 800;
  color: var(--text-h);
}
.cat {
  font-size: 12px;
  color: var(--text);
}
.desc {
  font-size: 14px;
  color: var(--text);
  min-height: 40px;
}
.bottom {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text);
}
.price {
  color: var(--text-h);
  font-weight: 800;
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
.small {
  padding: 8px 10px;
  border-radius: 10px;
}
.actions {
  display: flex;
  justify-content: end;
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

