<template>
  <section class="page">
    <header class="head">
      <h1 class="h1">{{ tp('Contact us') }}</h1>
      <p class="sub">{{ tp('Questions about a product or an order? We are happy to help.') }}</p>
    </header>

    <div class="grid">
      <a v-if="whatsappLink" class="card link" :href="whatsappLink" target="_blank" rel="noopener">
        <span class="icon wa"><AppIcon name="whatsapp" :size="26" /></span>
        <span class="title">WhatsApp</span>
        <span class="value" dir="ltr">+{{ settings.whatsapp }}</span>
      </a>
      <a v-if="settings.phone" class="card link" :href="`tel:${settings.phone.replace(/\s+/g, '')}`">
        <span class="icon"><AppIcon name="phone" :size="24" /></span>
        <span class="title">{{ tp('Phone') }}</span>
        <span class="value" dir="ltr">{{ settings.phone }}</span>
      </a>
      <a v-if="settings.email" class="card link" :href="`mailto:${settings.email}`">
        <span class="icon"><AppIcon name="mail" :size="24" /></span>
        <span class="title">{{ tp('Email') }}</span>
        <span class="value" dir="ltr">{{ settings.email }}</span>
      </a>
      <div v-if="address" class="card">
        <span class="icon"><AppIcon name="pin" :size="24" /></span>
        <span class="title">{{ tp('Our store') }}</span>
        <span class="value">{{ address }}</span>
        <a v-if="settings.mapUrl" class="mapLink" :href="settings.mapUrl" target="_blank" rel="noopener">{{ tp('Open in Google Maps') }}</a>
      </div>
      <div v-if="hours" class="card">
        <span class="icon"><AppIcon name="clock" :size="24" /></span>
        <span class="title">{{ tp('Opening hours') }}</span>
        <span class="value">{{ hours }}</span>
      </div>
      <div class="card">
        <span class="icon"><AppIcon name="chat" :size="24" /></span>
        <span class="title">{{ tp('Store Assistant') }}</span>
        <span class="value">{{ tp('Ask our assistant any time with the chat button at the bottom of the page.') }}</span>
      </div>
    </div>

    <p v-if="!hasDetails" class="note">{{ tp('More contact details will be added soon.') }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { useI18n } from '../i18n'
import { loadSettings, localized, settings, whatsappLink } from '../stores/settings'

const { tp } = useI18n()
const address = computed(() => localized('address'))
const hours = computed(() => localized('hours'))
const hasDetails = computed(() => !!(whatsappLink.value || settings.value.phone || settings.value.email || address.value))

onMounted(() => loadSettings(true))
</script>

<style scoped>
.page {
  max-width: 980px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
}
.sub {
  margin: 6px 0 0;
  color: var(--text);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--ink);
  text-decoration: none;
}
.card.link:hover {
  border-color: var(--gold);
  box-shadow: var(--shadow-sm);
}
.icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--sand);
  color: var(--gold-text);
  display: grid;
  place-items: center;
  margin-bottom: 6px;
}
.icon.wa {
  background: #e3f4ea;
  color: #1f9e55;
}
.title {
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 17px;
}
.value {
  color: var(--text);
  line-height: 1.6;
}
[dir='rtl'] .value[dir='ltr'] {
  text-align: right;
}
.mapLink {
  color: var(--gold-text);
  font-weight: 600;
}
.note {
  color: var(--muted);
}
</style>
