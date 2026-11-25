<template>
  <!-- Display mode: filled stars for the average. Input mode: buttons to pick 1–5. -->
  <div v-if="!editable" class="stars" :class="size" :aria-label="label">
    <span class="row" aria-hidden="true">
      <span v-for="i in 5" :key="i" class="star">
        <AppIcon name="star" :size="px" :stroke="1.4" class="empty" />
        <span class="fill" :style="{ width: fillWidth(i) }">
          <AppIcon name="star" :size="px" :stroke="1.4" class="full" />
        </span>
      </span>
    </span>
    <span v-if="showCount" class="count">({{ count }})</span>
  </div>
  <div v-else class="stars input" :class="size" role="radiogroup" :aria-label="tp('Your rating')">
    <button
      v-for="i in 5"
      :key="i"
      type="button"
      class="pick"
      role="radio"
      :aria-checked="modelValue === i ? 'true' : 'false'"
      :aria-label="`${i} / 5`"
      @click="$emit('update:modelValue', i)"
      @mouseenter="hover = i"
      @mouseleave="hover = 0"
    >
      <AppIcon name="star" :size="px" :stroke="1.4" :class="i <= (hover || modelValue) ? 'on' : 'empty'" />
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { useI18n } from '../i18n'

const props = defineProps({
  value: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  showCount: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  modelValue: { type: Number, default: 0 },
  size: { type: String, default: 'sm' },
})
defineEmits(['update:modelValue'])

const { tp } = useI18n()
const hover = ref(0)
const px = computed(() => ({ sm: 14, md: 18, lg: 28 })[props.size] || 14)
const label = computed(() => `${tp('Rated')} ${Number(props.value).toFixed(1)} / 5`)

function fillWidth(i) {
  const part = Math.max(0, Math.min(1, props.value - (i - 1)))
  return `${part * 100}%`
}
</script>

<style scoped>
.stars {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.row {
  display: inline-flex;
  gap: 1px;
  direction: ltr; /* stars fill from the left in both languages */
}
.star {
  position: relative;
  display: inline-flex;
}
.fill {
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
  display: inline-flex;
}
.empty {
  color: #d9d2c4;
}
.full,
.on {
  color: var(--gold);
  fill: var(--gold);
}
.count {
  font-size: 12px;
  color: var(--muted);
}
.pick {
  border: 0;
  background: none;
  padding: 2px;
  cursor: pointer;
  line-height: 0;
}
.pick .on {
  fill: var(--gold);
}
.stars.input {
  direction: ltr;
}
</style>
