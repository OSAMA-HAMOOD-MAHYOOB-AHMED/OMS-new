<template>
  <section class="card">
    <button class="link" @click="$router.push({ name: 'products' })">← Back to products</button>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="product" class="wrap">
      <div class="media">
        <div class="img">{{ product.name.slice(0, 1).toUpperCase() }}</div>
        <div class="thumbs">
          <div class="thumb" v-for="n in 4" :key="n">{{ n }}</div>
        </div>
      </div>

      <div class="info">
        <h2>{{ product.name }}</h2>
        <div class="meta">
          <span class="pill">{{ product.category }}</span>
          <span class="muted">In stock: {{ product.stockLevel }}</span>
        </div>
        <p class="desc">{{ product.description || '—' }}</p>

        <div class="buy">
          <div class="price">${{ Number(product.price).toFixed(2) }}</div>
          <div class="qty">
            <span class="muted">Qty</span>
            <input v-model.number="qty" type="number" min="1" />
          </div>
          <button class="btn" :disabled="product.stockLevel <= 0" @click="addToCart">Add to cart</button>
        </div>
      </div>
    </div>

    <div v-if="related.length" class="related">
      <h3 class="h3">Related products</h3>
      <div class="grid">
        <article v-for="p in related" :key="p.productID" class="product" @click="open(p.productID)">
          <div class="name">{{ p.name }}</div>
          <div class="muted">{{ p.category }}</div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../api/client'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
cart.hydrate()

const id = computed(() => route.params.id)
const product = ref(null)
const related = ref([])
const loading = ref(false)
const error = ref(null)
const qty = ref(1)

async function load() {
  loading.value = true
  error.value = null
  product.value = null
  try {
    const res = await api.get(`/api/products/${id.value}`)
    product.value = res.data

    const all = await api.get('/api/products')
    related.value = all.data
      .filter((p) => p.productID !== product.value.productID && p.category === product.value.category)
      .slice(0, 4)
  } catch (e) {
    error.value = e?.response?.data || 'Failed to load product'
  } finally {
    loading.value = false
  }
}

function addToCart() {
  cart.add(product.value, Math.max(1, Number(qty.value) || 1))
  router.push({ name: 'cart' })
}

function open(productID) {
  router.push({ name: 'productDetails', params: { id: productID } })
}

watch(id, load)
onMounted(load)
</script>

<style scoped>
.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
}
.link {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: #007aff;
  font-weight: 700;
  padding: 0;
}
.wrap {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
@media (min-width: 980px) {
  .wrap {
    grid-template-columns: 380px 1fr;
  }
}
.media {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.55);
}
.img {
  height: 240px;
  border-radius: 12px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  background: radial-gradient(circle at top left, rgba(0, 200, 150, 0.18), rgba(0, 122, 255, 0.14));
  display: grid;
  place-items: center;
  font-size: 72px;
  font-weight: 900;
  color: var(--text-h);
}
.thumbs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.thumb {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  display: grid;
  place-items: center;
  color: var(--text);
  background: rgba(255, 255, 255, 0.7);
}
.info {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.55);
}
.meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 6px;
}
.pill {
  font-size: 12px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(0, 122, 255, 0.2);
  background: rgba(0, 122, 255, 0.08);
  color: #007aff;
}
.muted {
  color: var(--text);
}
.desc {
  margin-top: 10px;
  color: var(--text-h);
}
.buy {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(17, 24, 39, 0.08);
}
@media (min-width: 520px) {
  .buy {
    grid-template-columns: 1fr 140px 160px;
    align-items: end;
  }
}
.price {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-h);
}
.qty input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.6);
  box-sizing: border-box;
}
.btn {
  border: 0;
  cursor: pointer;
  background: #007aff;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
}
.related {
  margin-top: 16px;
}
.h3 {
  margin: 0 0 10px;
  color: var(--text-h);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
.product {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.55);
  cursor: pointer;
}
.name {
  font-weight: 900;
  color: var(--text-h);
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

