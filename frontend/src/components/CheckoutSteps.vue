<template>
  <nav class="steps" aria-label="Checkout progress">
    <div
      v-for="(step, index) in steps"
      :key="step.key"
      class="step"
      :class="{
        done: index < currentIndex,
        active: index === currentIndex,
        upcoming: index > currentIndex,
      }"
    >
      <div class="dot" aria-hidden="true">
        <span v-if="index < currentIndex">✓</span>
        <span v-else>{{ index + 1 }}</span>
      </div>
      <div class="label">{{ step.label }}</div>
      <div v-if="index < steps.length - 1" class="line" aria-hidden="true" />
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: {
    type: String,
    required: true,
  },
})

const steps = [
  { key: 'details', label: 'Payment details' },
  { key: 'verify', label: 'Verification' },
  { key: 'confirm', label: 'Confirmation' },
  { key: 'invoice', label: 'Invoice' },
]

const currentIndex = computed(() => {
  const idx = steps.findIndex((s) => s.key === props.current)
  return idx >= 0 ? idx : 0
})
</script>

<style scoped>
.steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  margin-bottom: 18px;
}
.step {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 8px;
  text-align: center;
}
.dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 950;
  border: 2px solid var(--border);
  background: #fff;
  color: var(--muted);
  z-index: 1;
}
.step.done .dot,
.step.active .dot {
  border-color: var(--brand-blue);
  background: var(--brand-blue);
  color: #fff;
}
.step.upcoming .dot {
  background: #f8fafc;
}
.label {
  font-size: 11px;
  font-weight: 850;
  color: var(--muted);
  line-height: 1.25;
  max-width: 88px;
}
.step.active .label,
.step.done .label {
  color: var(--text-h);
}
.line {
  position: absolute;
  top: 17px;
  left: calc(50% + 18px);
  width: calc(100% - 36px);
  height: 2px;
  background: var(--border);
}
.step.done .line {
  background: var(--brand-blue);
}
.step:last-child .line {
  display: none;
}
@media (max-width: 640px) {
  .label {
    font-size: 10px;
    max-width: 72px;
  }
}
</style>
