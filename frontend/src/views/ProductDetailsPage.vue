<template>
  <section class="page">
    <nav class="crumbs" aria-label="Breadcrumb">
      <RouterLink :to="{ name: 'home' }">{{ t('shell.home') }}</RouterLink>
      <span aria-hidden="true">/</span>
      <RouterLink :to="{ name: 'products' }">{{ t('shell.products') }}</RouterLink>
      <template v-if="product">
        <span aria-hidden="true">/</span>
        <RouterLink :to="{ name: 'products', query: { cat: product.category } }">{{ categoryLabel(product.category) }}</RouterLink>
      </template>
    </nav>

    <div v-if="loading" class="mainGrid" aria-busy="true">
      <div class="skeleton big" />
      <div class="skeleton" />
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="product" class="mainGrid">
      <ProductGallery :images="productGalleryUrls(product)" :alt="product.name">
        <span v-if="sale" class="saleBadge" dir="ltr">-{{ off }}%</span>
      </ProductGallery>

      <div class="info">
        <div class="metaRow">
          <span class="chip">{{ categoryLabel(product.category) }}</span>
          <span class="sku">{{ t('product.sku') }}: <span dir="ltr">{{ product.productID }}</span></span>
        </div>
        <h1 class="title" dir="auto">{{ product.name }}</h1>
        <button v-if="product.reviewCount" class="ratingLink" type="button" @click="openTab('reviews')">
          <StarRating :value="product.rating" size="md" />
          <span>{{ Number(product.rating).toFixed(1) }} · {{ product.reviewCount }} {{ tp(product.reviewCount === 1 ? 'review' : 'reviews') }}</span>
        </button>

        <div class="priceRow">
          <span class="price" dir="ltr">{{ format(product.price) }}</span>
          <s v-if="sale" class="was" dir="ltr">{{ format(product.compareAtPrice) }}</s>
          <span v-if="sale" class="save">{{ tp('You save') }} <span dir="ltr">{{ format(product.compareAtPrice - product.price) }}</span></span>
          <span v-else class="priceNote">{{ t('product.priceNote') }}</span>
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

        <div class="share">
          <span class="shareLabel"><AppIcon name="share" :size="18" />{{ tp('Share') }}</span>
          <a :href="shareLinks.whatsapp" target="_blank" rel="noopener" class="shareBtn" aria-label="WhatsApp"><AppIcon name="whatsapp" :size="18" /></a>
          <a :href="shareLinks.x" target="_blank" rel="noopener" class="shareBtn" aria-label="X">𝕏</a>
          <a :href="shareLinks.facebook" target="_blank" rel="noopener" class="shareBtn" aria-label="Facebook">f</a>
          <a :href="shareLinks.telegram" target="_blank" rel="noopener" class="shareBtn" aria-label="Telegram">✈</a>
          <button type="button" class="shareBtn" :aria-label="tp('Copy link')" @click="copyLink">
            <AppIcon :name="copied ? 'check' : 'link'" :size="18" />
          </button>
          <span v-if="copied" class="copied" role="status">{{ tp('Link copied') }}</span>
        </div>
      </div>
    </div>

    <section v-if="product" ref="tabsEl" class="infoCard">
      <div class="tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :id="`tab-${tab.key}`"
          :key="tab.key"
          class="tab"
          :class="{ on: activeTab === tab.key }"
          role="tab"
          type="button"
          :aria-selected="activeTab === tab.key ? 'true' : 'false'"
          :aria-controls="`panel-${tab.key}`"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'desc'" id="panel-desc" class="infoBody" role="tabpanel" aria-labelledby="tab-desc">
        <p class="descText" dir="auto">{{ description || t('product.defaultDesc') }}</p>
      </div>

      <div v-else-if="activeTab === 'specs'" id="panel-specs" class="infoBody" role="tabpanel" aria-labelledby="tab-specs">
        <dl class="specs">
          <template v-for="row in specRows" :key="row.label + row.value">
            <dt dir="auto">{{ row.label }}</dt>
            <dd dir="auto">{{ row.value }}</dd>
          </template>
        </dl>
      </div>

      <div v-else id="panel-reviews" class="infoBody reviews" role="tabpanel" aria-labelledby="tab-reviews">
        <div class="reviewSummary">
          <div class="bigScore">
            <strong>{{ product.reviewCount ? Number(product.rating).toFixed(1) : '–' }}</strong>
            <StarRating :value="product.rating" size="md" />
            <span>{{ product.reviewCount }} {{ tp(product.reviewCount === 1 ? 'review' : 'reviews') }}</span>
          </div>
          <div class="bars">
            <div v-for="n in [5, 4, 3, 2, 1]" :key="n" class="barRow">
              <span dir="ltr">{{ n }}★</span>
              <span class="bar"><span :style="{ width: barWidth(n) }" /></span>
              <span class="barCount">{{ starCount(n) }}</span>
            </div>
          </div>
        </div>

        <form v-if="auth.role === 'Customer'" class="reviewForm" @submit.prevent="submitReview">
          <h3 class="h3">{{ myReview ? tp('Edit your review') : tp('Write a review') }}</h3>
          <StarRating v-model="draft.rating" editable size="lg" />
          <textarea v-model="draft.comment" rows="3" maxlength="1000" dir="auto" :placeholder="tp('What did you think of this product?')" />
          <p v-if="reviewError" class="formError" role="alert">{{ tp(reviewError) }}</p>
          <div class="formRow">
            <button class="darkBtn small" type="submit" :disabled="savingReview || !draft.rating">
              {{ savingReview ? tp('Saving…') : tp('Post review') }}
            </button>
            <button v-if="myReview" class="textBtn" type="button" @click="deleteReview(myReview)">{{ tp('Delete my review') }}</button>
          </div>
        </form>
        <p v-else-if="!auth.token" class="hint">
          <RouterLink :to="{ name: 'login', query: { next: route.fullPath } }">{{ tp('Sign in') }}</RouterLink>
          {{ tp('to write a review.') }}
        </p>

        <p v-if="!reviews.length" class="hint">{{ tp('No reviews yet. Be the first to review this product.') }}</p>
        <ul v-else class="reviewList">
          <li v-for="r in reviews" :key="r.reviewId" class="review">
            <div class="reviewHead">
              <strong>{{ r.name }}</strong>
              <span v-if="r.verifiedBuyer" class="verified"><AppIcon name="check" :size="14" />{{ tp('Verified buyer') }}</span>
              <span class="reviewDate">{{ formatDay(r.createdAt) }}</span>
            </div>
            <StarRating :value="r.rating" />
            <p v-if="r.comment" dir="auto">{{ r.comment }}</p>
            <button v-if="auth.role === 'Admin'" class="textBtn" type="button" @click="deleteReview(r)">{{ tp('Delete') }}</button>
          </li>
        </ul>
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
import { productGalleryUrls } from '../utils/images'
import { useCurrency } from '../composables/useCurrency'
import { useI18n } from '../i18n'
import AppIcon from '../components/AppIcon.vue'
import ProductCard from '../components/ProductCard.vue'
import StarRating from '../components/StarRating.vue'
import ProductGallery from '../components/ProductGallery.vue'
import { discountPercent, isOnSale } from '../utils/pricing'

const { t, tp, locale, categoryGroup, categoryLabel } = useI18n()
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
const sale = computed(() => isOnSale(product.value))
// The description in the store's language (falls back to the other one if only one is written).
const description = computed(() => {
  const p = product.value
  if (!p) return ''
  return locale.value === 'ar' ? p.descriptionAr || p.description : p.description || p.descriptionAr
})
const off = computed(() => discountPercent(product.value))

// ----- Tabs -----
const tabsEl = ref(null)
const activeTab = ref('desc')
const reviews = ref([])
const tabs = computed(() => [
  { key: 'desc', label: t('product.description') },
  { key: 'specs', label: tp('Specifications') },
  { key: 'reviews', label: `${tp('Reviews')} (${product.value?.reviewCount || 0})` },
])
function openTab(key) {
  activeTab.value = key
  tabsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Admin-entered "Label: value" lines, plus the basics every product has.
const specRows = computed(() => {
  const p = product.value
  if (!p) return []
  // Arabic specifications when the store is in Arabic (falls back to the English ones).
  const rows = String((locale.value === 'ar' && p.specsAr) || p.specs || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(':')
      return i > 0 ? { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() } : { label: '•', value: line }
    })
  return [
    { label: t('product.sku'), value: p.productID },
    { label: tp('Category'), value: categoryLabel(p.category) },
    ...rows,
    { label: t('product.stockLabel'), value: p.stockLevel > 0 ? t('common.available', { n: p.stockLevel }) : t('common.outOfStock') },
  ]
})

// ----- Reviews -----
const draft = ref({ rating: 0, comment: '' })
const savingReview = ref(false)
const reviewError = ref(null)
const myReview = computed(() => reviews.value.find((r) => r.mine))

function starCount(n) {
  return reviews.value.filter((r) => r.rating === n).length
}
function barWidth(n) {
  return reviews.value.length ? `${(starCount(n) / reviews.value.length) * 100}%` : '0%'
}
function formatDay(iso) {
  return new Date(iso).toLocaleDateString(locale.value === 'ar' ? 'ar-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

async function loadReviews() {
  try {
    const res = await api.get(`/api/products/${id.value}/reviews`)
    reviews.value = res.data
    const mine = res.data.find((r) => r.mine)
    draft.value = mine ? { rating: mine.rating, comment: mine.comment || '' } : { rating: 0, comment: '' }
  } catch {
    reviews.value = []
  }
}

async function refreshProduct() {
  const res = await api.get(`/api/products/${id.value}`)
  product.value = res.data
}

async function submitReview() {
  reviewError.value = null
  savingReview.value = true
  try {
    await api.post(`/api/products/${id.value}/reviews`, draft.value)
    await Promise.all([loadReviews(), refreshProduct()])
  } catch (e) {
    reviewError.value = (typeof e?.response?.data === 'string' && e.response.data) || 'Could not save your review. Please try again.'
  } finally {
    savingReview.value = false
  }
}

async function deleteReview(r) {
  if (!confirm(tp('Delete this review?'))) return
  try {
    await api.delete(`/api/products/${id.value}/reviews/${r.reviewId}`)
    await Promise.all([loadReviews(), refreshProduct()])
  } catch {
    reviewError.value = 'Could not delete the review.'
  }
}

// ----- Share -----
const copied = ref(false)
const pageUrl = computed(() => (typeof window !== 'undefined' ? window.location.href.split('?')[0] : ''))
const shareLinks = computed(() => {
  const url = encodeURIComponent(pageUrl.value)
  const text = encodeURIComponent(product.value?.name || '')
  return {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    x: `https://x.com/intent/post?text=${text}&url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
  }
})
async function copyLink() {
  try {
    await navigator.clipboard.writeText(pageUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    /* clipboard blocked: nothing to do */
  }
}
const maxQty = computed(() => Math.max(1, Number(product.value?.stockLevel) || 1))

async function load() {
  loading.value = true
  error.value = null
  product.value = null
  qty.value = 1
  try {
    const res = await api.get(`/api/products/${id.value}`)
    product.value = res.data
    activeTab.value = 'desc'
    loadReviews()

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
/* ----- Sale, rating, share ----- */
.media {
  position: relative;
}
.saleBadge {
  position: absolute;
  z-index: 1;
  top: 18px;
  inset-inline-start: 18px;
  background: var(--danger);
  color: #fff;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
}
.ratingLink {
  border: 0;
  background: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 14px;
  cursor: pointer;
  align-self: flex-start;
}
.was {
  color: var(--muted);
  font-size: 18px;
}
.save {
  background: #fcebe7;
  color: var(--danger);
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}
.share {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.shareLabel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 14px;
  margin-inline-end: 4px;
}
.shareBtn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--ink);
  display: grid;
  place-items: center;
  text-decoration: none;
  font-weight: 700;
  cursor: pointer;
}
.shareBtn:hover {
  border-color: var(--gold);
  color: var(--gold-text);
}
.copied {
  font-size: 13px;
  color: var(--success);
}

/* ----- Tabs ----- */
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 18px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}
.tab {
  border: 0;
  background: none;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--muted);
  border-bottom: 3px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}
.tab.on {
  color: var(--ink);
  border-bottom-color: var(--gold);
}
.descText {
  margin: 0;
  line-height: 1.9;
  white-space: pre-line;
}
.infoBody {
  display: block;
}
.specs dt:last-of-type,
.specs dd:last-of-type {
  border-bottom: 0;
}

/* ----- Reviews ----- */
.reviews {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.reviewSummary {
  display: flex;
  gap: 28px;
  align-items: center;
  flex-wrap: wrap;
}
.bigScore {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 120px;
  color: var(--muted);
  font-size: 13px;
}
.bigScore strong {
  font-family: var(--font-head);
  font-size: 40px;
  color: var(--ink);
  line-height: 1;
}
.bars {
  flex: 1;
  min-width: 220px;
  display: grid;
  gap: 6px;
}
.barRow {
  display: grid;
  grid-template-columns: 34px 1fr 28px;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: var(--muted);
}
.bar {
  height: 8px;
  border-radius: 4px;
  background: var(--sand-2);
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  background: var(--gold);
}
.reviewForm {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg);
}
.reviewForm textarea {
  width: 100%;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: 10px 12px;
  font: inherit;
  resize: vertical;
  background: #fff;
}
.h3 {
  margin: 0;
  font-family: var(--font-head);
  font-size: 17px;
}
.formRow {
  display: flex;
  gap: 12px;
  align-items: center;
}
.darkBtn.small {
  height: 42px;
  padding: 0 18px;
  font-size: 14px;
}
.textBtn {
  border: 0;
  background: none;
  color: var(--danger);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.formError {
  margin: 0;
  color: var(--danger);
  font-size: 14px;
}
.hint {
  margin: 0;
  color: var(--muted);
}
.hint a {
  color: var(--gold-text);
  font-weight: 600;
}
.reviewList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.review {
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.review p {
  margin: 0;
  line-height: 1.7;
}
.reviewHead {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.verified {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--success);
  font-size: 12px;
  font-weight: 600;
}
.reviewDate {
  margin-inline-start: auto;
  color: var(--muted);
  font-size: 12px;
}
</style>
