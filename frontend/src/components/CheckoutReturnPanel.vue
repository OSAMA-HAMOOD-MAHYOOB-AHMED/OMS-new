<template>
  <div class="returnPanel">
    <div class="timerWrap" aria-hidden="true">
      <svg class="timerRing" viewBox="0 0 72 72">
        <circle class="track" cx="36" cy="36" r="30" />
        <circle
          class="progress"
          cx="36"
          cy="36"
          r="30"
          :style="{ strokeDashoffset: progressOffset }"
        />
      </svg>
      <div class="timerValue">{{ secondsLeft }}</div>
    </div>

    <p class="message">{{ message }}</p>
    <p class="hint">{{ hint }}</p>

    <button class="returnBtn" type="button" @click="$emit('proceed')">
      {{ buttonLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CHECKOUT_RETURN_SECONDS } from '../composables/useReturnTimer'

const props = defineProps({
  secondsLeft: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    default: 'You will be redirected automatically when the timer reaches zero.',
  },
  hint: {
    type: String,
    default: 'Please do not close or refresh this page.',
  },
  buttonLabel: {
    type: String,
    default: 'Return to merchant store',
  },
})

defineEmits(['proceed'])

const circumference = 2 * Math.PI * 30

const progressOffset = computed(() => {
  const ratio = props.secondsLeft / CHECKOUT_RETURN_SECONDS
  return circumference * (1 - ratio)
})
</script>

<style scoped>
.returnPanel {
  width: 100%;
  max-width: 420px;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px 16px;
  background: #f8fafc;
  display: grid;
  gap: 12px;
  justify-items: center;
  text-align: center;
}
.timerWrap {
  position: relative;
  width: 72px;
  height: 72px;
}
.timerRing {
  width: 72px;
  height: 72px;
  transform: rotate(-90deg);
}
.track {
  fill: none;
  stroke: #e2e8f0;
  stroke-width: 5;
}
.progress {
  fill: none;
  stroke: var(--brand-blue);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 188.5;
  transition: stroke-dashoffset 1s linear;
}
.timerValue {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 950;
  color: var(--text-h);
}
.message {
  margin: 0;
  font-size: 13px;
  color: var(--text);
  font-weight: 700;
  line-height: 1.45;
}
.hint {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
  font-weight: 650;
}
.returnBtn {
  width: 100%;
  border: 0;
  border-radius: 14px;
  padding: 13px 16px;
  background: var(--brand-blue);
  color: #fff;
  font-weight: 950;
  font-size: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.returnBtn:hover {
  filter: brightness(1.03);
}
</style>
