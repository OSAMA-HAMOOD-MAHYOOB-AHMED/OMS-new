<template>
  <div class="home">
    <section class="hero" :aria-label="t('home.title2')">
      <div class="heroText">
        <span class="badge">{{ t('home.badge') }}</span>
        <h1 class="h1">
          {{ t('home.title1') }}<br />
          <span class="gold">{{ t('home.title2') }}</span>
        </h1>
        <p class="sub">{{ t('home.sub') }}</p>
        <div class="cta">
          <button class="goldBtn" type="button" @click="goPrimary">{{ isStaff ? t('home.staffCta') : t('home.shopNow') }}</button>
          <RouterLink v-if="!auth.token" class="outlineBtn" :to="{ name: 'register' }">{{ t('home.createAccount') }}</RouterLink>
        </div>
      </div>
      <div class="heroMedia">
        <img :src="siteHeroUrl" alt="" />
      </div>
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

    <section v-if="featured.length" class="section" aria-labelledby="featuredTitle">
      <div class="sectionHead">
        <h2 id="featuredTitle" class="sectionTitle">{{ t('home.featured') }}</h2>
        <RouterLink class="more" :to="{ name: 'products' }">{{ t('common.viewAll') }}</RouterLink>
      </div>
      <div class="grid">
        <ProductCard v-for="p in featured" :key="p.productID" :product="p" />
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
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { siteHeroUrl } from '../utils/images'
import { useI18n } from '../i18n'
import AppIcon from '../components/AppIcon.vue'
import ProductCard from '../components/ProductCard.vue'
import { loadCategories, shopCategories } from '../stores/categories'

const { t, categoryLabel, categoryIcon } = useI18n()
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
</style>
