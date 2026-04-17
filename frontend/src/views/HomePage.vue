<template>
  <section class="hero">
    <div class="heroCard">
      <div class="badge">Premium Phone Accessories</div>
      <h1>Chargers, Earphones, Power Banks & Phone Cases</h1>
      <p class="sub">
        Demo build of Al-Wakeel Al-Shamel Order Management System. Sign in to browse, order, and manage inventory.
      </p>
      <div class="cta">
        <button class="btn" @click="goPrimary">Browse Products</button>
        <button class="btn secondary" @click="goSecondary">Sign Up</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
auth.hydrate()

function goPrimary() {
  if (!auth.token) return router.push({ name: 'login' })
  if (auth.role === 'Customer') return router.push({ name: 'products' })
  if (auth.role === 'Warehouse Manager') return router.push({ name: 'warehouseDashboard' })
  if (auth.role === 'Retail Salesperson') return router.push({ name: 'salesDashboard' })
  return router.push({ name: 'home' })
}

function goSecondary() {
  router.push({ name: 'register' })
}
</script>

<style scoped>
.hero {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.12), rgba(0, 200, 150, 0.12));
}
.heroCard {
  text-align: left;
}
.badge {
  display: inline-flex;
  font-weight: 700;
  color: #0b3b2e;
  background: rgba(0, 200, 150, 0.18);
  border: 1px solid rgba(0, 200, 150, 0.35);
  padding: 6px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
}
h1 {
  margin: 10px 0 12px;
}
.sub {
  max-width: 720px;
  color: var(--text);
}
.cta {
  display: flex;
  gap: 10px;
  margin-top: 18px;
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
</style>

