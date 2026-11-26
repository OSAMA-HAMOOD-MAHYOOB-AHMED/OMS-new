<template>
  <Teleport to="body">
    <div class="backdrop" role="presentation" @click.self="$emit('close')">
      <section ref="dialog" class="dialog" role="dialog" aria-modal="true" :aria-label="product.name" tabindex="-1">
        <button class="close" type="button" :aria-label="tp('Close')" @click="$emit('close')">
          <AppIcon name="close" :size="20" />
        </button>

        <div class="media">
          <img :src="productImageUrl(product)" :alt="product.name" />
          <span v-if="sale" class="badge" dir="ltr">-{{ off }}%</span>
        </div>

        <div class="info">
          <span class="cat">{{ categoryLabel(product.category) }}</span>
          <h2 class="name" dir="auto">{{ product.name }}</h2>
          <StarRating v-if="product.reviewCount" :value="product.rating" :count="product.reviewCount" show-count size="md" />

          <div class="prices" dir="ltr">
            <span class="price">{{ format(product.price) }}</span>
            <s v-if="sale" class="was">{{ format(product.compareAtPrice) }}</s>
          </div>

          <p class="stock" :class="{ out: product.stockLevel <= 0 }">
            {{ product.stockLevel > 0 ? t('common.inStock') : t('common.outOfStock') }}
          </p>
          <p v-if="description" class="desc" dir="auto">{{ description }}</p>

          <div v-if="canBuy && product.stockLevel > 0" class="buy">
            <div class="qty">
              <button type="button" :aria-label="tp('Decrease quantity')" @click="qty = Math.max(1, qty - 1)">−</button>
              <span>{{ qty }}</span>
              <button type="button" :aria-label="tp('Increase quantity')" @click="qty = Math.min(product.stockLevel, qty + 1)">+</button>
            </div>
            <button class="add" type="button" @click="add">
              <AppIcon :name="added ? 'check' : 'cart'" :size="18" />
              {{ added ? t('common.added') : t('common.addToCart') }}
            </button>
          </div>

          <RouterLink class="more" :to="{ name: 'productDetails', params: { id: product.productID } }" @click="$emit('close')">
            {{ tp('View full details') }}
            <AppIcon name="chevron" :size="16" :style="isRtl ? 'transform: scaleX(-1)' : ''" />
          </RouterLink>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import StarRating from './StarRating.vue'
import { productImageUrl } from '../utils/images'
import { discountPercent, isOnSale } from '../utils/pricing'
import { useCurrency } from '../composables/useCurrency'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useI18n } from '../i18n'

const props = defineProps({ product: { type: Object, required: true } })
const emit = defineEmits(['close'])

const { t, tp, categoryLabel, isRtl, locale } = useI18n()
const description = computed(() =>
  locale.value === 'ar'
    ? props.product.descriptionAr || props.product.description
    : props.product.description || props.product.descriptionAr,
)
const { format } = useCurrency()
const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const route = useRoute()
const dialog = ref(null)
const qty = ref(1)
const added = ref(false)

const sale = computed(() => isOnSale(props.product))
const off = computed(() => discountPercent(props.product))
const canBuy = computed(() => !auth.token || auth.role === 'Customer')

function add() {
  if (!auth.token) {
    emit('close')
    router.push({ name: 'login', query: { next: route.fullPath } })
    return
  }
  cart.add(props.product, qty.value)
  added.value = true
  setTimeout(() => (added.value = false), 1400)
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(async () => {
  document.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
  await nextTick()
  dialog.value?.focus()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(20, 20, 20, 0.55);
  display: grid;
  place-items: center;
  padding: 16px;
}
.dialog {
  position: relative;
  width: min(820px, 100%);
  max-height: calc(100svh - 32px);
  overflow: auto;
  background: #fff;
  border-radius: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  outline: none;
  box-shadow: 0 24px 60px rgba(20, 20, 20, 0.3);
}
.close {
  position: absolute;
  top: 12px;
  inset-inline-end: 12px;
  z-index: 2;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.media {
  position: relative;
  background: var(--bg);
  min-height: 320px;
}
.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.badge {
  position: absolute;
  top: 14px;
  inset-inline-start: 14px;
  background: var(--danger);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 999px;
}
.info {
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cat {
  color: var(--gold-text);
  font-size: 13px;
  font-weight: 500;
}
.name {
  margin: 0;
  font-family: var(--font-head);
  font-size: 22px;
  line-height: 1.4;
}
.prices {
  display: flex;
  align-items: baseline;
  gap: 10px;
  justify-content: flex-start;
}
[dir='rtl'] .prices {
  justify-content: flex-end;
}
.price {
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 26px;
}
.was {
  color: var(--muted);
  font-size: 16px;
}
.stock {
  margin: 0;
  color: var(--success);
  font-size: 14px;
  font-weight: 500;
}
.stock.out {
  color: var(--muted);
}
.desc {
  margin: 0;
  color: var(--text);
  line-height: 1.7;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.buy {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}
.qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  overflow: hidden;
}
.qty button {
  width: 40px;
  height: 46px;
  border: 0;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
}
.qty span {
  min-width: 34px;
  text-align: center;
  font-weight: 600;
}
.add {
  flex: 1;
  height: 48px;
  border: 0;
  border-radius: 12px;
  background: var(--ink);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}
.more {
  margin-top: auto;
  color: var(--gold-text);
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
@media (max-width: 680px) {
  .dialog {
    grid-template-columns: 1fr;
  }
  .media {
    min-height: 0;
    height: 240px;
  }
}
</style>
