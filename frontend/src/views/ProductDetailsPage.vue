<template>
  <section class="page">
    <nav class="crumbs" aria-label="Breadcrumb">
      <RouterLink :to="{ name: 'home' }">{{ t('shell.home') }}</RouterLink>
      <span aria-hidden="true">/</span>
      <RouterLink :to="{ name: 'products' }">{{ t('shell.products') }}</RouterLink>
      <template v-if="product">
        <span aria-hidden="true">/</span>
        <RouterLink :to="{ name: 'products', query: { cat: categoryGroup(product.category) } }">{{ categoryLabel(product.category) }}</RouterLink>
      </template>
    </nav>

    <div v-if="loading" class="mainGrid" aria-busy="true">
      <div class="skeleton big" />
      <div class="skeleton" />
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="product" class="mainGrid">
      <div class="media">
        <img :src="productImageUrl(product)" :alt="product.name" />
      </div>

      <div class="info">
        <div class="metaRow">
          <span class="chip">{{ categoryLabel(product.category) }}</span>
          <span class="sku">{{ t('product.sku') }}: <span dir="ltr">{{ product.productID }}</span></span>
        </div>
        <h1 class="title" dir="auto">{{ product.name }}</h1>

        <div class="priceRow">
          <span class="price" dir="ltr">{{ format(product.price) }}</span>
          <span class="priceNote">{{ t('product.priceNote') }}</span>
        </div>

        <span v-if="product.stockLevel > 0" class="stock" :class="{ low: product.stockLevel <= 15 }">
          <span class="dot" />
          {{ product.stockLevel <= 15 ? t('common.onlyLeft', { n: product.stockLevel }) : `${t('common.inStock')} — ${t('common.available', { n: product.stockLevel })}` }}
        </span>
        <span v-else class="stock out"><span class="dot" />{{ t('common.outOfStock') }}</span>

        <div class="divider" />

        <template v-if="canBuy">
          <div class="buyRow">
            <div class="qty" role="group" :aria-label="t('product.quantity')">
              <button type="button" :aria-label="t('product.decrease')" :disabled="qty <= 1" @click="qty = Math.max(1, qty - 1)">
                <AppIcon name="minus" :size="18" />
              </button>
              <span class="qtyVal" aria-live="polite">{{ qty }}</span>
              <button type="button" :aria-label="t('product.increase')" :disabled="qty >= maxQty" @click="qty = Math.min(maxQty, qty + 1)">
                <AppIcon name="plus" :size="18" />
              </button>
            </div>
            <button class="darkBtn" type="button" :disabled="product.stockLevel <= 0" @click="addToCart(false)">
              <AppIcon :name="justAdded ? 'check' : 'cart'" />
              {{ auth.token ? (justAdded ? t('common.added') : t('common.addToCart')) : t('product.loginToBuy') }}
            </button>
          </div>
          <button v-if="auth.token" class="goldBtn" type="button" :disabled="product.stockLevel <= 0" @click="addToCart(true)">
            {{ t('product.buyNow') }}
          </button>
        </template>

        <ul class="perks">
          <li><AppIcon name="cash" :size="22" />{{ t('product.cod') }}</li>
          <li><AppIcon name="shield" :size="22" />{{ t('product.card') }}</li>
          <li><AppIcon name="truck" :size="22" />{{ t('product.track') }}</li>
        </ul>
      </div>
    </div>

    <section v-if="product" class="infoCard" aria-labelledby="descTitle">
      <div class="infoBody">
        <div class="desc">
          <h2 id="descTitle" class="h2">{{ t('product.description') }}</h2>
          <p dir="auto">{{ product.description || t('product.defaultDesc') }}</p>
        </div>
        <dl class="specs">
          <dt>{{ t('product.brandLabel') }}</dt>
          <dd>{{ categoryLabel(product.category) }}</dd>
          <dt>{{ t('product.sku') }}</dt>
          <dd dir="ltr">{{ product.productID }}</dd>
          <dt>{{ t('product.stockLabel') }}</dt>
          <dd>{{ product.stockLevel > 0 ? t('common.available', { n: product.stockLevel }) : t('common.outOfStock') }}</dd>
        </dl>
      </div>
    </section>

    <section v-if="related.length" class="related" aria-labelledby="relatedTitle">
      <h2 id="relatedTitle" class="h2">{{ t('product.related') }}</h2>
      <div class="grid">
        <ProductCard v-for="p in related" :key="p.productID" :product="p" />
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { productImageUrl } from '../utils/images'
import { useCurrency } from '../composables/useCurrency'
import { useI18n } from '../i18n'
import AppIcon from '../components/AppIcon.vue'
import ProductCard from '../components/ProductCard.vue'

const { t, categoryGroup, categoryLabel } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
auth.hydrate()
const cart = useCartStore()
cart.hydrate()
const { format } = useCurrency()

const id = computed(() => route.params.id)
const product = ref(null)
const related = ref([])
const loading = ref(false)
const error = ref(null)
const qty = ref(1)
const justAdded = ref(false)

const canBuy = computed(() => !auth.token || auth.role === 'Customer')
const maxQty = computed(() => Math.max(1, Number(product.value?.stockLevel) || 1))

async function load() {
  loading.value = true
  error.value = null
  product.value = null
  qty.value = 1
  try {
    const res = await api.get(`/api/products/${id.value}`)
    product.value = res.data

    const all = await api.get('/api/products')
    const group = categoryGroup(product.value.category)
    const others = all.data.filter((p) => p.productID !== product.value.productID && Number(p.stockLevel) > 0)
    const same = others.filter((p) => categoryGroup(p.category) === group)
    const rest = others.filter((p) => categoryGroup(p.category) !== group)
    related.value = [...same, ...rest].slice(0, 4)
  } catch (e) {
    error.value = (typeof e?.response?.data === 'string' && e.response.data) || t('product.loadFailed')
  } finally {
    loading.value = false
  }
}

function addToCart(goToCart) {
  if (!auth.token) {
    router.push({ name: 'login', query: { next: route.fullPath } })
    return
  }
  cart.add(product.value, Math.max(1, Number(qty.value) || 1))
  if (goToCart) {
    router.push({ name: 'cart' })
    return
  }
  justAdded.value = true
  setTimeout(() => (justAdded.value = false), 1500)
}

watch(id, load)
onMounted(load)
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
}
.crumbs a {
  text-decoration: none;
}

.mainGrid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 40px;
  align-items: start;
}
.media {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 28px;
  min-height: 460px;
  display: grid;
  place-items: center;
  padding: 24px;
}
.media img {
  max-width: 78%;
  max-height: 400px;
  object-fit: contain;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.metaRow {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.chip {
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--sand);
  color: var(--gold-text);
  font-size: 13px;
  font-weight: 600;
}
.sku {
  font-size: 13px;
  color: var(--text);
}
.title {
  margin: 0;
  font-weight: 800;
  font-size: clamp(26px, 3vw, 36px);
  line-height: 1.3;
}
.priceRow {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
.price {
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 38px;
  color: var(--ink);
}
.priceNote {
  font-size: 13px;
  color: var(--text);
}
.stock {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--success);
}
.stock .dot {
  width: 9px;
  height: 9px;
  border-radius: 5px;
  background: currentColor;
}
.stock.low,
.stock.out {
  color: var(--danger);
}
.divider {
  height: 1px;
  background: var(--border);
}

.buyRow {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.qty {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  background: #fff;
  height: 54px;
}
.qty button {
  width: 48px;
  height: 52px;
  border: 0;
  background: transparent;
  color: var(--ink);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.qty button:disabled {
  color: #c2b9a8;
  cursor: not-allowed;
}
.qtyVal {
  min-width: 34px;
  text-align: center;
  font-weight: 600;
  font-size: 17px;
}
.darkBtn,
.goldBtn {
  height: 54px;
  border: 0;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}
.darkBtn {
  flex: 1 1 200px;
  background: var(--ink);
  color: #fff;
}
.darkBtn:hover:not(:disabled) {
  background: #2a2620;
}
.goldBtn {
  background: var(--gold);
  color: var(--ink);
}
.goldBtn:hover:not(:disabled) {
  background: var(--gold-light);
}
.darkBtn:disabled,
.goldBtn:disabled {
  background: #d9d2c4;
  color: #57514a;
  cursor: not-allowed;
}

.perks {
  list-style: none;
  margin: 4px 0 0;
  padding: 18px 20px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 14px;
  color: var(--ink);
}
.perks li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.perks :deep(.appIcon) {
  color: var(--gold-text);
}

.infoCard {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 28px;
}
.infoBody {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}
.desc {
  flex: 1 1 420px;
  min-width: 0;
}
.desc p {
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 1.9;
  color: #3a352d;
}
.h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}
.specs {
  flex: 1 1 300px;
  min-width: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  align-self: start;
}
.specs dt,
.specs dd {
  margin: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.specs dt {
  background: var(--bg);
  color: var(--text);
}
.specs dt:nth-last-of-type(1),
.specs dd:last-of-type {
  border-bottom: 0;
}

.related {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.skeleton {
  min-height: 360px;
  border-radius: 24px;
  background: linear-gradient(90deg, #f1ece2 25%, #f8f4ec 37%, #f1ece2 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
.skeleton.big {
  min-height: 460px;
}
@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
.error {
  color: var(--danger);
  background: rgba(154, 42, 22, 0.06);
  border: 1px solid rgba(154, 42, 22, 0.2);
  padding: 10px 12px;
  border-radius: 12px;
}

@media (max-width: 900px) {
  .mainGrid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .media {
    min-height: 300px;
  }
  .media img {
    max-height: 260px;
  }
}
@media (max-width: 560px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .infoCard {
    padding: 20px;
  }
  .price {
    font-size: 30px;
  }
}
</style>
