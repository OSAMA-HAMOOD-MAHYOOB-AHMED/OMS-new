<template>
  <div class="home">
    <section class="hero" :style="{ backgroundImage: `linear-gradient(90deg, rgba(29, 78, 216, 0.82), rgba(16, 185, 129, 0.72)), url(${siteHeroUrl})` }">
      <div class="heroInner">
        <h1 class="h1">Premium Phone Accessories</h1>
        <p class="sub">Chargers, Earphones, Power Banks &amp; Phone Cases</p>
        <div class="cta">
          <button class="btnPrimary" type="button" @click="goPrimary">Browse Products</button>
          <button v-if="!auth.token" class="btnGhost" type="button" @click="goSecondary">Sign Up</button>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="sectionTitle">Why Shop With Us?</h2>
      <div class="features">
        <article class="feature">
          <div class="icon blue" aria-hidden="true">🛍</div>
          <div class="featureTitle">Wide Selection</div>
          <p class="featureText">Extensive range of phone accessories for all needs</p>
        </article>
        <article class="feature">
          <div class="icon green" aria-hidden="true">🚚</div>
          <div class="featureTitle">Fast Delivery</div>
          <p class="featureText">Quick and reliable shipping to your doorstep</p>
        </article>
        <article class="feature">
          <div class="icon purple" aria-hidden="true">🛡</div>
          <div class="featureTitle">Quality Assured</div>
          <p class="featureText">All products tested and verified for quality</p>
        </article>
        <article class="feature">
          <div class="icon orange" aria-hidden="true">🎧</div>
          <div class="featureTitle">24/7 Support</div>
          <p class="featureText">Customer service available anytime you need</p>
        </article>
      </div>
    </section>

    <section class="section">
      <h2 class="sectionTitle">Popular Categories</h2>
      <div class="cats">
        <RouterLink class="cat" :to="catLink" :style="{ backgroundImage: `url(${categoryImageUrl('chargers')})` }">
          <div class="catOverlay" />
          <div class="catLabel">Chargers</div>
        </RouterLink>
        <RouterLink class="cat" :to="catLink" :style="{ backgroundImage: `url(${categoryImageUrl('earphones')})` }">
          <div class="catOverlay" />
          <div class="catLabel">Earphones</div>
        </RouterLink>
        <RouterLink class="cat" :to="catLink" :style="{ backgroundImage: `url(${categoryImageUrl('powerbanks')})` }">
          <div class="catOverlay" />
          <div class="catLabel">Power Banks</div>
        </RouterLink>
        <RouterLink class="cat" :to="catLink" :style="{ backgroundImage: `url(${categoryImageUrl('cases')})` }">
          <div class="catOverlay" />
          <div class="catLabel">Phone Cases</div>
        </RouterLink>
      </div>
    </section>

    <section class="ctaBand">
      <div class="ctaTitle">Ready to Start Shopping?</div>
      <div class="ctaSub">Join thousands of satisfied customers and find the perfect accessories for your device</div>
      <RouterLink v-if="!auth.token" class="ctaBtn" :to="{ name: 'register' }">Create Account</RouterLink>
    </section>

    <footer class="footer">
      <div>© 2026 Al-Wakeel Al-Shamel Order Management System. All rights reserved.</div>
      <div class="footerSmall">Developed by: Osama Al-Hossam</div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { categoryImageUrl, siteHeroUrl } from '../utils/images'

const router = useRouter()
const auth = useAuthStore()
auth.hydrate()

const catLink = computed(() => {
  if (!auth.token) return { name: 'products' }
  if (auth.role === 'Customer' || auth.role === 'Warehouse Manager') return { name: 'products' }
  return { name: 'home' }
})

function goPrimary() {
  if (!auth.token) return router.push({ name: 'products' })
  if (auth.role === 'Customer') return router.push({ name: 'products' })
  if (auth.role === 'Warehouse Manager') return router.push({ name: 'warehouseDashboard' })
  if (auth.role === 'Retail Salesperson') return router.push({ name: 'salesDashboard' })
  if (auth.role === 'Admin') return router.push({ name: 'adminDashboard' })
  return router.push({ name: 'home' })
}

function goSecondary() {
  router.push({ name: 'register' })
}
</script>

<style scoped>
.home {
  display: grid;
  gap: 34px;
}

.hero {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  background-size: cover;
  background-position: center;
}
.heroInner {
  padding: 54px 22px;
  text-align: center;
  color: #ffffff;
}
.h1 {
  margin: 0;
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 950;
  letter-spacing: -1px;
  line-height: 1.05;
}
.sub {
  margin: 12px auto 0;
  max-width: 860px;
  font-size: 16px;
  opacity: 0.95;
}
.cta {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.btnPrimary {
  border: 0;
  cursor: pointer;
  background: #ffffff;
  color: #1d4ed8;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 950;
  box-shadow: var(--shadow-sm);
}
.btnGhost {
  border: 1px solid rgba(255, 255, 255, 0.65);
  cursor: pointer;
  background: transparent;
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 14px;
  font-weight: 950;
}

.section {
  display: grid;
  gap: 16px;
}
.sectionTitle {
  margin: 0;
  text-align: center;
  font-size: 22px;
  font-weight: 950;
  letter-spacing: -0.4px;
  color: var(--text-h);
}
.features {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 980px) {
  .features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  .features {
    grid-template-columns: 1fr;
  }
}
.feature {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: #fff;
  padding: 16px;
  box-shadow: var(--shadow-sm);
  text-align: center;
}
.icon {
  width: 54px;
  height: 54px;
  border-radius: 999px;
  margin: 0 auto 10px;
  display: grid;
  place-items: center;
  font-size: 22px;
}
.blue {
  background: rgba(37, 99, 235, 0.12);
}
.green {
  background: rgba(16, 185, 129, 0.12);
}
.purple {
  background: rgba(139, 92, 246, 0.12);
}
.orange {
  background: rgba(245, 158, 11, 0.14);
}
.featureTitle {
  font-weight: 950;
  color: var(--text-h);
}
.featureText {
  margin: 8px 0 0;
  color: var(--text);
  font-size: 14px;
}

.cats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 520px) {
  .cats {
    grid-template-columns: 1fr;
  }
  .heroInner {
    padding: 36px 16px;
  }
  .ctaBand {
    padding: 22px 14px;
  }
  .ctaTitle {
    font-size: 22px;
  }
}

.cat {
  position: relative;
  height: 170px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
  background-size: cover;
  background-position: center;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
}
.catOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0) 40%, rgba(15, 23, 42, 0.78) 100%);
}
.catLabel {
  position: absolute;
  left: 14px;
  bottom: 12px;
  color: #fff;
  font-weight: 950;
  letter-spacing: -0.2px;
}

.ctaBand {
  border: 1px solid var(--border);
  border-radius: 18px;
  background: #fff;
  padding: 26px 18px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}
.ctaTitle {
  font-size: 26px;
  font-weight: 950;
  letter-spacing: -0.6px;
  color: var(--text-h);
}
.ctaSub {
  margin: 10px auto 0;
  max-width: 860px;
  color: var(--text);
}
.ctaBtn {
  display: inline-flex;
  margin-top: 14px;
  text-decoration: none;
  background: var(--brand-blue);
  color: #fff;
  font-weight: 950;
  padding: 12px 16px;
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}

.footer {
  text-align: center;
  color: #e2e8f0;
  background: #0f172a;
  border-radius: 16px;
  padding: 18px 14px;
  line-height: 1.35;
}
.footerSmall {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(226, 232, 240, 0.72);
}
</style>

