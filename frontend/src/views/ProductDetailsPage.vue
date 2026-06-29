<template>
  <section class="page">
    <button class="back" type="button" @click="$router.push({ name: 'products' })">← Back to products</button>

    <div v-if="loading" class="muted">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="product" class="heroCard">
      <div class="media">
        <div class="img" :style="{ backgroundImage: `url(${productImageUrl(product)})` }" />
      </div>

      <div class="info">
        <div class="cat">{{ product.category }}</div>
        <h1 class="title">{{ product.name }}</h1>

        <div class="priceRow">
          <div class="price">${{ Number(product.price).toFixed(2) }}</div>
          <div class="stock">{{ product.stockLevel }} in stock</div>
        </div>

        <p class="desc">{{ product.description || 'Premium accessory with reliable performance for everyday use.' }}</p>

        <div class="buy">
          <div class="qty">
            <span class="lbl">Quantity</span>
            <input v-model.number="qty" type="number" min="1" />
          </div>
          <button class="btn" type="button" :disabled="product.stockLevel <= 0" @click="addToCart">
            {{ auth.token ? '🛒 Add to Cart' : '🔑 Login to Buy' }}
          </button>
        </div>

        <div class="divider" />

        <div class="featuresTitle">Product Features</div>
        <ul class="features">
          <li><span class="ficon blue" aria-hidden="true">▣</span> High quality materials and construction.</li>
          <li><span class="ficon green" aria-hidden="true">🛡</span> 1 year warranty included.</li>
          <li><span class="ficon purple" aria-hidden="true">🚚</span> Free shipping on orders over $50.</li>
        </ul>
      </div>
    </div>

    <div v-if="related.length" class="related">
      <h2 class="h2">Related Products</h2>
      <div class="grid">
        <article v-for="p in related" :key="p.productID" class="product" @click="open(p.productID)">
          <div class="mini" :style="{ backgroundImage: `url(${productImageUrl(p)})` }" />
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
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { productImageUrl } from '../utils/images'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
auth.hydrate()
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
  if (!auth.token) {
    router.push({ name: 'login', query: { next: route.fullPath } })
    return
  }
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
.page {
  display: grid;
  gap: 14px;
}
.back {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--brand-blue);
  font-weight: 900;
  padding: 0;
  justify-self: start;
}
.heroCard {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #fff;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 980px) {
  .heroCard {
    grid-template-columns: 1.05fr 1fr;
  }
}
.media {
  padding: 14px;
  background: linear-gradient(180deg, #f8fafc, #ffffff);
}
.img {
  height: min(420px, 52vh);
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background-size: cover;
  background-position: center;
  background-color: #eef2ff;
}
.info {
  padding: 18px 18px 20px;
}
.cat {
  font-size: 12px;
  font-weight: 950;
  color: var(--brand-blue);
  letter-spacing: 0.02em;
}
.title {
  margin: 8px 0 0;
  font-size: 34px;
  line-height: 1.05;
  font-weight: 950;
  letter-spacing: -0.9px;
  color: var(--text-h);
}
.priceRow {
  margin-top: 12px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.price {
  font-size: 30px;
  font-weight: 950;
  letter-spacing: -0.8px;
  color: var(--text-h);
}
.stock {
  color: var(--muted);
  font-weight: 850;
}
.desc {
  margin-top: 12px;
  color: var(--text);
  line-height: 1.55;
}
.buy {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 640px) {
  .buy {
    grid-template-columns: 160px 1fr;
    align-items: end;
  }
}
.qty {
  display: grid;
  gap: 8px;
}
.lbl {
  font-size: 12px;
  font-weight: 900;
  color: #334155;
}
.qty input {
  width: 100%;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #fff;
  box-sizing: border-box;
  font-weight: 800;
}
.btn {
  border: 0;
  cursor: pointer;
  background: var(--brand-blue);
  color: white;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 950;
  box-shadow: var(--shadow-sm);
}
.divider {
  height: 1px;
  background: var(--border);
  margin: 16px 0;
}
.featuresTitle {
  font-weight: 950;
  color: var(--text-h);
}
.features {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
  color: var(--text-h);
  font-weight: 650;
}
.features li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.ficon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--border);
  font-weight: 950;
}
.ficon.blue {
  color: var(--brand-blue);
  background: rgba(37, 99, 235, 0.08);
}
.ficon.green {
  color: #047857;
  background: rgba(16, 185, 129, 0.10);
}
.ficon.purple {
  color: #6d28d9;
  background: rgba(139, 92, 246, 0.10);
}

.related {
  margin-top: 6px;
}
.h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.3px;
  color: var(--text-h);
}
.grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 980px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.product {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.mini {
  height: 110px;
  background-size: cover;
  background-position: center;
  background-color: #eef2ff;
}
.name {
  padding: 10px 12px 0;
  font-weight: 950;
  color: var(--text-h);
}
.muted {
  padding: 4px 12px 12px;
  color: var(--text);
  font-size: 12px;
  font-weight: 800;
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

