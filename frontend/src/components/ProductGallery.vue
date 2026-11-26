<template>
  <!-- Swipe (or use the arrows) through the photos; the other photos sit underneath as thumbnails. -->
  <div class="gallery" :aria-label="tp('Product photos')" aria-roledescription="carousel">
    <div class="stage">
      <div ref="track" class="track" dir="ltr" @scroll.passive="onScroll">
        <div v-for="(src, i) in images" :key="src + i" class="slide" :aria-label="`${i + 1} / ${images.length}`" role="group">
          <img :src="src" :alt="i === 0 ? alt : `${alt} (${i + 1})`" :loading="i === 0 ? 'eager' : 'lazy'" draggable="false" />
        </div>
      </div>
      <slot />
      <template v-if="images.length > 1">
        <button class="arrow prev" type="button" :aria-label="tp('Previous photo')" :disabled="index === 0" @click="go(index - 1)">
          <AppIcon name="chevron" :size="20" style="transform: scaleX(-1)" />
        </button>
        <button class="arrow next" type="button" :aria-label="tp('Next photo')" :disabled="index === images.length - 1" @click="go(index + 1)">
          <AppIcon name="chevron" :size="20" />
        </button>
        <span class="counter" dir="ltr">{{ index + 1 }} / {{ images.length }}</span>
      </template>
    </div>

    <div v-if="images.length > 1" class="thumbs" dir="ltr">
      <button
        v-for="(src, i) in images"
        :key="'t' + src + i"
        type="button"
        class="thumb"
        :class="{ on: i === index }"
        :aria-label="`${tp('Photo')} ${i + 1}`"
        :aria-current="i === index ? 'true' : undefined"
        @click="go(i)"
      >
        <img :src="src" alt="" loading="lazy" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { useI18n } from '../i18n'

const props = defineProps({
  images: { type: Array, required: true },
  alt: { type: String, default: '' },
})

const { tp } = useI18n()
const track = ref(null)
const index = ref(0)

// The track is always left-to-right (dir="ltr") so the photo order is the same in both languages.
function go(i) {
  const el = track.value
  if (!el) return
  const target = Math.max(0, Math.min(props.images.length - 1, i))
  el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' })
  index.value = target
}

let raf = 0
function onScroll() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const el = track.value
    if (el && el.clientWidth) index.value = Math.round(el.scrollLeft / el.clientWidth)
  })
}

// A different product starts again at its first photo.
watch(
  () => props.images.join('|'),
  () => {
    index.value = 0
    if (track.value) track.value.scrollLeft = 0
  },
)
</script>

<style scoped>
.gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.stage {
  position: relative;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 28px;
  overflow: hidden;
}
.track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}
.track::-webkit-scrollbar {
  display: none;
}
.slide {
  flex: 0 0 100%;
  scroll-snap-align: center;
  height: 460px;
  display: grid;
  place-items: center;
  padding: 24px;
}
.slide img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
}
.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.92);
  color: var(--ink);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(20, 20, 20, 0.12);
}
.arrow:disabled {
  opacity: 0;
  pointer-events: none;
}
.arrow.prev {
  left: 12px;
}
.arrow.next {
  right: 12px;
}
.counter {
  position: absolute;
  bottom: 14px;
  right: 16px;
  background: rgba(20, 20, 20, 0.7);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}
.thumbs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: thin;
  padding-bottom: 2px;
}
.thumb {
  flex: 0 0 76px;
  height: 76px;
  border-radius: 14px;
  border: 2px solid var(--border);
  background: #fff;
  padding: 4px;
  cursor: pointer;
  overflow: hidden;
}
.thumb.on {
  border-color: var(--gold);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
@media (max-width: 900px) {
  .slide {
    height: 340px;
  }
}
@media (hover: none) {
  .arrow {
    display: none;
  }
}
</style>
