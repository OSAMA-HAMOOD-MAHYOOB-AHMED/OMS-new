<template>
  <div class="home">
    <!-- Slider: the welcome slide plus offers / discount code / delivery slides. -->
    <section
      class="slider"
      :aria-label="tp('Highlights')"
      aria-roledescription="carousel"
      @mouseenter="paused = true"
      @mouseleave="paused = false"
      @focusin="paused = true"
      @focusout="paused = false"
    >
      <Transition name="slide" mode="out-in">
        <div :key="current.key" class="hero" role="group" aria-roledescription="slide" :aria-label="`${slide + 1} / ${slides.length}`">
          <div class="heroText">
            <span class="badge">{{ current.badge }}</span>
            <component :is="slide === 0 ? 'h1' : 'h2'" class="h1">
              {{ current.title1 }}<br v-if="current.title2" />
              <span v-if="current.title2" class="gold">{{ current.title2 }}</span>
            </component>
            <p class="sub">{{ current.sub }}</p>
            <div class="cta">
              <button v-if="current.key === 'welcome'" class="goldBtn" type="button" @click="goPrimary">
                {{ isStaff ? t('home.staffCta') : t('home.shopNow') }}
              </button>
              <RouterLink v-else class="goldBtn" :to="current.to">{{ current.cta }}</RouterLink>
              <RouterLink v-if="current.key === 'welcome' && !auth.token" class="outlineBtn" :to="{ name: 'register' }">
                {{ t('home.createAccount') }}
              </RouterLink>
            </div>
          </div>
          <div class="heroMedia">
            <img :src="current.image" alt="" />
          </div>
        </div>
      </Transition>

      <template v-if="slides.length > 1">
        <button class="arrow prev" type="button" :aria-label="tp('Previous slide')" @click="go(slide - 1)">
          <AppIcon name="chevron" :size="20" :style="isRtl ? '' : 'transform: scaleX(-1)'" />
        </button>
        <button class="arrow next" type="button" :aria-label="tp('Next slide')" @click="go(slide + 1)">
          <AppIcon name="chevron" :size="20" :style="isRtl ? 'transform: scaleX(-1)' : ''" />
        </button>
        <div class="dots">
          <button
            v-for="(sl, i) in slides"
            :key="sl.key"
            type="button"
            class="dotBtn"
            :class="{ on: i === slide }"
            :aria-label="`${tp('Slide')} ${i + 1}`"
            :aria-current="i === slide ? 'true' : undefined"
            @click="go(i)"
          />
        </div>
      </template>
    </section>

    <section class="section" aria-labelledby="catsTitle">
      <h2 id="catsTitle" class="sectionTitle">{{ t('home.browseCats') }}</h2>
      <div class="cats">
        <RouterLink v-for="c in shopCategories" :key="c.name" class="cat" :to="{ name: 'products', query: { cat: c.name } }">
          <span class="catIcon"><AppIcon :name="categoryIcon(c.name)" :size="26" /></span>
          <span class="catText">
            <span class="catName">{{ categoryLabel(c.name) }}</span>
            <span class="catCount">{{ t('cats.count', { n: c.productCount }) }}</span>
          </span>
        </RouterLink>
      </div>
    </section>

    <section v-if="offers.length" class="section" aria-labelledby="offersTitle">
      <div class="sectionHead">
        <h2 id="offersTitle" class="sectionTitle"><AppIcon name="percent" :size="22" class="offerIcon" />{{ tp('Offers') }}</h2>
        <RouterLink class="more" :to="{ name: 'products', query: { offers: '1' } }">{{ t('common.viewAll') }}</RouterLink>
      </div>
      <div class="grid">
        <ProductCard v-for="p in offers" :key="p.productID" :product="p" />
      </div>
    </section>

    <section v-if="featured.length" class="section" aria-labelledby="featuredTitle">
      <div class="sectionHead">
        <h2 id="featuredTitle" class="sectionTitle">{{ t('home.featured') }}</h2>
        <RouterLink class="more" :to="{ name: 'products' }">{{ t('common.viewAll') }}</RouterLink>
      </div>
      <div class="grid">
        <ProductCard v-for="p in featured" :key="p.productID" :product="p" />
      </div>
    </section>

    <section v-for="row in categoryRows" :key="row.name" class="section" :aria-label="categoryLabel(row.name)">
      <div class="sectionHead">
        <h2 class="sectionTitle">{{ categoryLabel(row.name) }}</h2>
        <RouterLink class="more" :to="{ name: 'products', query: { cat: row.name } }">{{ t('common.viewAll') }}</RouterLink>
      </div>
      <div class="grid">
        <ProductCard v-for="p in row.items" :key="p.productID" :product="p" />
      </div>
    </section>

    <section class="why">
      <div v-for="w in why" :key="w.title" class="whyItem">
        <span class="whyIcon"><AppIcon :name="w.icon" :size="26" /></span>
        <span class="whyText">
          <span class="whyTitle">{{ t(w.title) }}</span>
          <span class="whyBody">{{ t(w.body) }}</span>
        </span>
      </div>
    </section>

    <section v-if="!auth.token" class="ctaBand">
      <div>
        <h2 class="ctaTitle">{{ t('home.ctaTitle') }}</h2>
        <p class="ctaSub">{{ t('home.ctaSub') }}</p>
      </div>
      <RouterLink class="goldBtn" :to="{ name: 'register' }">{{ t('home.createAccount') }}</RouterLink>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { productImageUrl, siteHeroUrl } from '../utils/images'
import { discountPercent, isOnSale } from '../utils/pricing'
import { loadSettings, localized } from '../stores/settings'
import { useI18n } from '../i18n'
import AppIcon from '../components/AppIcon.vue'
import ProductCard from '../components/ProductCard.vue'
import { loadCategories, shopCategories } from '../stores/categories'

const { t, tp, isRtl, categoryLabel, categoryIcon } = useI18n()
const router = useRouter()
const auth = useAuthStore()
auth.hydrate()

const products = ref([])

const why = [
  { icon: 'cash', title: 'home.whyCod', body: 'home.whyCodText' },
  { icon: 'shield', title: 'home.whyCard', body: 'home.whyCardText' },
  { icon: 'truck', title: 'home.whyTrack', body: 'home.whyTrackText' },
  { icon: 'chat', title: 'home.whyHelp', body: 'home.whyHelpText' },
]

const isStaff = computed(() => !!auth.token && auth.role !== 'Customer')

// One in-stock product from each category first, then fill up to 8.
const featured = computed(() => {
  const inStock = products.value.filter((p) => Number(p.stockLevel) > 0)
  const picked = []
  for (const c of shopCategories.value) {
    const p = inStock.find((x) => x.category === c.name && !picked.includes(x))
    if (p && picked.length < 8) picked.push(p)
  }
  for (const p of inStock) {
    if (picked.length >= 8) break
    if (!picked.includes(p)) picked.push(p)
  }
  return picked
})

// ----- Offers and category rows -----
const offers = computed(() =>
  products.value
    .filter((p) => isOnSale(p) && Number(p.stockLevel) > 0)
    .sort((a, b) => discountPercent(b) - discountPercent(a))
    .slice(0, 4),
)
const categoryRows = computed(() =>
  shopCategories.value
    .map((c) => ({ name: c.name, items: products.value.filter((p) => p.category === c.name && Number(p.stockLevel) > 0).slice(0, 4) }))
    .filter((row) => row.items.length >= 2),
)

// ----- Slider -----
const slide = ref(0)
const paused = ref(false)
const slides = computed(() => {
  const list = [
    { key: 'welcome', badge: t('home.badge'), title1: t('home.title1'), title2: t('home.title2'), sub: t('home.sub'), image: siteHeroUrl },
  ]
  const best = offers.value[0]
  if (best) {
    list.push({
      key: 'offers',
      badge: tp('Offers'),
      title1: tp('Deals up to'),
      title2: `${discountPercent(best)}% ${tp('off')}`,
      sub: tp('Limited-time prices on selected accessories.'),
      cta: tp('Shop offers'),
      to: { name: 'products', query: { offers: '1' } },
      image: productImageUrl(best),
    })
  }
  const promo = localized('promo')
  if (promo) {
    list.push({
      key: 'promo',
      badge: tp('Discount code'),
      title1: promo,
      title2: '',
      sub: tp('Enter the code in your cart before you check out.'),
      cta: t('home.shopNow'),
      to: { name: 'products' },
      image: productImageUrl(products.value.find((p) => Number(p.stockLevel) > 0) || {}),
    })
  }
  list.push({
    key: 'delivery',
    badge: tp('Fast delivery'),
    title1: tp('Pay on delivery,'),
    title2: tp('free FedEx Express shipping'),
    sub: tp('Order today and track every step from your account.'),
    cta: t('home.shopNow'),
    to: { name: 'products' },
    image: productImageUrl(products.value.find((p) => p.category && /charg/i.test(p.category)) || products.value[0] || {}),
  })
  return list
})
const current = computed(() => slides.value[Math.min(slide.value, slides.value.length - 1)])
function go(i) {
  const n = slides.value.length
  slide.value = ((i % n) + n) % n
}
let timer = null
onMounted(() => {
  timer = setInterval(() => {
    // Respect people who prefer less motion, and stop while hovered or focused.
    if (!paused.value && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) go(slide.value + 1)
  }, 6000)
})
onUnmounted(() => clearInterval(timer))

async function loadProducts() {
  try {
    const res = await api.get('/api/products')
    if (Array.isArray(res.data)) products.value = res.data
  } catch {
    // The home page still works without the product strip.
  }
}

function goPrimary() {
  if (!auth.token || auth.role === 'Customer') return router.push({ name: 'products' })
  if (auth.role === 'Warehouse Manager') return router.push({ name: 'warehouseDashboard' })
  if (auth.role === 'Retail Salesperson') return router.push({ name: 'salesDashboard' })
  if (auth.role === 'Admin') return router.push({ name: 'adminDashboard' })
  return router.push({ name: 'home' })
}

onMounted(() => {
  loadProducts()
  loadCategories()
  loadSettings()
})
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.heroText {
  flex: 1 1 460px;
  min-width: 0;
  background: var(--ink);
  color: #fff;
  border-radius: 28px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  min-height: 380px;
}
.badge {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #4a4030;
  color: var(--gold-light);
  font-size: 13px;
}
.h1 {
  margin: 0;
  color: #fff;
  font-weight: 800;
  font-size: clamp(32px, 4vw, 46px);
  line-height: 1.25;
}
.gold {
  color: var(--gold);
}
.sub {
  margin: 0;
  color: #cfc7b8;
  font-size: 17px;
  line-height: 1.8;
  max-width: 470px;
}
.cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}
.goldBtn {
  height: 52px;
  padding: 0 28px;
  border: 0;
  border-radius: 14px;
  background: var(--gold);
  color: var(--ink);
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  white-space: nowrap;
}
.goldBtn:hover {
  background: var(--gold-light);
}
.outlineBtn {
  height: 52px;
  padding: 0 24px;
  border-radius: 14px;
  border: 1px solid #4a4030;
  color: #fff;
  font-size: 16px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.outlineBtn:hover {
  border-color: var(--gold);
}
.heroMedia {
  flex: 1 1 460px;
  min-width: 0;
  min-height: 380px;
  border-radius: 28px;
  overflow: hidden;
  background: #dce9ec;
}
.heroMedia img {
  width: 100%;
  height: 100%;
  min-height: 380px;
  object-fit: cover;
  display: block;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.sectionHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.sectionTitle {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}
.more {
  font-weight: 500;
  font-size: 15px;
}

.cats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.cat {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 20px;
  text-decoration: none;
  color: var(--ink);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.cat:hover {
  border-color: var(--gold);
  box-shadow: var(--shadow-md);
}
.catIcon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--sand);
  color: var(--gold-text);
  display: grid;
  place-items: center;
}
.catText {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.catName {
  font-weight: 600;
  font-size: 17px;
}
.catCount {
  font-size: 13px;
  color: var(--text);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.why {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
}
.whyItem {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 20px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid var(--border);
}
.whyIcon {
  color: var(--gold-text);
}
.whyText {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.whyTitle {
  font-weight: 600;
  font-size: 16px;
  color: var(--ink);
}
.whyBody {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text);
}

.ctaBand {
  background: var(--ink);
  border-radius: 28px;
  padding: 36px 40px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.ctaTitle {
  margin: 0;
  color: #fff;
  font-size: 28px;
  font-weight: 800;
}
.ctaSub {
  margin: 6px 0 0;
  color: #cfc7b8;
  font-size: 15px;
}

@media (max-width: 560px) {
  .home {
    gap: 32px;
  }
  .heroText {
    padding: 28px 22px;
    min-height: 0;
  }
  .heroMedia,
  .heroMedia img {
    min-height: 200px;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .ctaBand {
    padding: 26px 22px;
  }
}
/* ----- Slider ----- */
.slider {
  position: relative;
}
.slider .hero {
  min-height: 420px;
}
.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(20, 20, 20, 0.55);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 2;
}
.arrow.prev {
  inset-inline-start: 10px;
}
.arrow.next {
  inset-inline-end: 10px;
}
.dots {
  position: absolute;
  bottom: 16px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 2;
}
[dir='rtl'] .dots {
  transform: translateX(50%);
}
.dotBtn {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 0;
  background: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  padding: 0;
  transition: width 0.2s;
}
.dotBtn.on {
  width: 26px;
  background: var(--gold);
}
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.35s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
.section {
  scroll-margin-top: 150px; /* clear the sticky header when jumped to */
}
.offerIcon {
  color: var(--danger);
  vertical-align: -3px;
  margin-inline-end: 6px;
}
@media (max-width: 700px) {
  .arrow {
    display: none;
  }
  .slider .hero {
    min-height: 0;
  }
}
</style>
