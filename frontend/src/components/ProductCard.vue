<template>
  <article class="card">
    <RouterLink class="media" :to="{ name: 'productDetails', params: { id: product.productID } }" :aria-label="product.name">
      <img :src="productImageUrl(product)" :alt="product.name" loading="lazy" />
      <span v-if="sale" class="sale" dir="ltr">-{{ off }}%</span>
      <span v-if="product.stockLevel <= 0" class="flag out">{{ tp('Sold out') }}</span>
      <span v-else-if="product.stockLevel <= lowStock" class="flag low">{{ t('common.onlyLeft', { n: product.stockLevel }) }}</span>
    </RouterLink>
    <button class="quick" type="button" :aria-label="`${tp('Quick view')}: ${product.name}`" @click="quick = true">
      <AppIcon name="eye" :size="18" />
      <span>{{ tp('Quick view') }}</span>
    </button>
    <QuickView v-if="quick" :product="product" @close="quick = false" />
    <div class="body">
      <span class="cat">{{ categoryLabel(product.category) }}</span>
      <RouterLink class="name" :to="{ name: 'productDetails', params: { id: product.productID } }" dir="auto">{{ product.name }}</RouterLink>
      <StarRating v-if="product.reviewCount" :value="product.rating" :count="product.reviewCount" show-count />
      <span v-else-if="product.stockLevel > 0" class="stock"><span class="dot" />{{ t('common.inStock') }}</span>
      <div class="bottom">
        <span class="prices" dir="ltr">
          <span class="price">{{ format(product.price) }}</span>
          <s v-if="sale" class="was">{{ format(product.compareAtPrice) }}</s>
        </span>
        <button
          v-if="canBuy"
          class="add"
          type="button"
          :disabled="product.stockLevel <= 0"
          :aria-label="`${t('common.addToCart')}: ${product.name}`"
          @click="add"
        >
          <AppIcon :name="justAdded ? 'check' : 'plus'" :size="18" />
          <span class="addText">{{ justAdded ? t('common.added') : t('common.addToCart') }}</span>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import QuickView from './QuickView.vue'
import StarRating from './StarRating.vue'
import { discountPercent, isOnSale } from '../utils/pricing'
import { productImageUrl } from '../utils/images'
import { useCurrency } from '../composables/useCurrency'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useI18n } from '../i18n'

const props = defineProps({
  product: { type: Object, required: true },
  lowStock: { type: Number, default: 15 },
})

const { t, tp, categoryLabel } = useI18n()
const { format } = useCurrency()
const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const route = useRoute()
const justAdded = ref(false)
const quick = ref(false)
const sale = computed(() => isOnSale(props.product))
const off = computed(() => discountPercent(props.product))

// Guests see the button too; it sends them to sign in first.
const canBuy = computed(() => !auth.token || auth.role === 'Customer')

function add() {
  if (!auth.token) {
    router.push({ name: 'login', query: { next: route.fullPath } })
    return
  }
  cart.add(props.product, 1)
  justAdded.value = true
  setTimeout(() => (justAdded.value = false), 1400)
}
</script>

<style scoped>
.card {
  position: relative;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, transform 0.2s;
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.media {
  position: relative;
  height: 220px;
  display: block;
  overflow: hidden;
  background: #fff;
  border-bottom: 1px solid #f1ece2;
}
.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.flag {
  position: absolute;
  top: 12px;
  inset-inline-end: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.flag.low {
  background: #fcebe7;
  color: var(--danger);
}
.flag.out {
  background: #eeebe5;
  color: #57514a;
}
.sale {
  position: absolute;
  top: 12px;
  inset-inline-start: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
/* Quick view: appears over the photo on hover (always visible on touch screens). */
.quick {
  position: absolute;
  top: 170px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--ink);
  box-shadow: 0 4px 14px rgba(20, 20, 20, 0.15);
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
}
[dir='rtl'] .quick {
  transform: translateX(50%);
}
.card:hover .quick,
.quick:focus-visible {
  opacity: 1;
}
@media (hover: none) {
  .quick {
    opacity: 1;
    top: 118px;
    width: 36px;
    padding: 0;
    justify-content: center;
    inset-inline-start: auto;
    inset-inline-end: 10px;
    transform: none;
  }
  [dir='rtl'] .quick {
    transform: none;
  }
  .quick span {
    display: none;
  }
}
.prices {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.15;
}
.was {
  color: var(--muted);
  font-size: 13px;
}
.body {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.cat {
  font-size: 13px;
  font-weight: 500;
  color: var(--gold-text);
}
.name {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--ink);
  text-decoration: none;
  min-height: 46px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.name:hover {
  color: var(--gold-text);
}
.stock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--success);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: var(--success);
}
.bottom {
  margin-top: auto;
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.price {
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 21px;
  color: var(--ink);
}
.add {
  height: 42px;
  padding: 0 14px;
  border: 0;
  border-radius: 12px;
  background: var(--ink);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.add:hover:not(:disabled) {
  background: #2a2620;
}
.add:disabled {
  background: #d9d2c4;
  color: #57514a;
  cursor: not-allowed;
}
@media (max-width: 560px) {
  .media {
    height: 160px;
  }
  .body {
    padding: 12px;
  }
  .name {
    font-size: 14px;
    min-height: 40px;
  }
  .price {
    font-size: 17px;
  }
  .add {
    width: 40px;
    padding: 0;
    justify-content: center;
  }
  .addText {
    display: none;
  }
}
</style>
