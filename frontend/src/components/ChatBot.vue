<template>
  <div class="chatRoot">
    <Transition name="window">
      <section v-if="isOpen" class="window" role="dialog" :aria-label="tp('Store Assistant')">
        <header class="header">
          <div class="headerInfo">
            <span class="avatar"><AppIcon name="chat" :size="20" /></span>
            <div>
              <div class="headerTitle">{{ tp('Store Assistant') }}</div>
              <div class="headerSub"><span class="online" />{{ tp('Usually replies in seconds') }}</div>
            </div>
          </div>
          <button class="closeBtn" type="button" :aria-label="tp('Close chat')" @click="isOpen = false">
            <AppIcon name="close" :size="18" />
          </button>
        </header>

        <div ref="messagesEl" class="messages" aria-live="polite">
          <div class="msg assistant">
            <div class="bubble" dir="auto">{{ tp('Hi! I am your shopping assistant. Ask me about our chargers, power banks, earphones or phone cases, or how to order.') }}</div>
          </div>

          <div v-if="!messages.length" class="suggestions">
            <button v-for="s in suggestions" :key="s" class="suggestion" type="button" @click="ask(tp(s))">
              {{ tp(s) }}
            </button>
          </div>

          <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role, { error: msg.error }]">
            <div class="bubble" dir="auto">{{ msg.content }}</div>
          </div>

          <div v-if="loading" class="msg assistant">
            <div class="bubble typing" :aria-label="tp('Typing…')">
              <span /><span /><span />
            </div>
          </div>
        </div>

        <form class="inputRow" @submit.prevent="send">
          <label class="srOnly" for="chatInput">{{ tp('Ask about our products...') }}</label>
          <input
            id="chatInput"
            ref="inputEl"
            v-model="input"
            class="input"
            type="text"
            dir="auto"
            maxlength="1000"
            autocomplete="off"
            :placeholder="tp('Ask about our products...')"
            :disabled="loading"
          />
          <button class="sendBtn" type="submit" :disabled="loading || !input.trim()" :aria-label="tp('Send')">
            <AppIcon name="arrow" :size="18" :style="isRtl ? 'transform: scaleX(-1)' : ''" />
          </button>
        </form>
      </section>
    </Transition>

    <button
      class="fab"
      :class="{ active: isOpen }"
      type="button"
      :aria-label="tp(isOpen ? 'Close chat' : 'Chat with us')"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click="toggle"
    >
      <AppIcon :name="isOpen ? 'close' : 'chat'" :size="24" />
      <span v-if="unread > 0 && !isOpen" class="unreadBadge">{{ unread }}</span>
    </button>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { api } from '../api/client'
import { useI18n } from '../i18n'
import AppIcon from './AppIcon.vue'

const { tp, isRtl } = useI18n()

const isOpen = ref(false)
const input = ref('')
const loading = ref(false)
const unread = ref(0)
const messagesEl = ref(null)
const inputEl = ref(null)

// Shown until the first question is asked.
const suggestions = ['Which power banks are in stock?', 'How do I track my order?', 'Can I pay cash on delivery?']

const messages = ref([])
const history = ref([])

async function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unread.value = 0
    await nextTick()
    scrollBottom()
    inputEl.value?.focus()
  }
}

function scrollBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function ask(text) {
  input.value = text
  send()
}

async function send() {
  const text = input.value.trim()
  if (!text || loading.value) return

  input.value = ''
  messages.value.push({ role: 'user', content: text })
  loading.value = true
  await nextTick()
  scrollBottom()

  try {
    const { data } = await api.post('/api/chat', { message: text, history: history.value })
    const reply = data.reply
    history.value.push({ role: 'user', content: text }, { role: 'assistant', content: reply })
    if (history.value.length > 20) history.value = history.value.slice(-20)
    messages.value.push({ role: 'assistant', content: reply })
    if (!isOpen.value) unread.value++
  } catch (e) {
    const serverError = e?.response?.data?.error
    const msg = serverError || "Sorry, I'm having trouble connecting right now. Please try again in a moment."
    messages.value.push({ role: 'assistant', content: tp(msg), error: true })
  } finally {
    loading.value = false
    await nextTick()
    scrollBottom()
    inputEl.value?.focus()
  }
}
</script>

<style scoped>
.chatRoot {
  position: fixed;
  bottom: 24px;
  inset-inline-end: 24px; /* bottom-right in English, bottom-left in Arabic */
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.fab {
  width: 58px;
  height: 58px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--gold);
  border: 2px solid var(--gold);
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(20, 20, 20, 0.3);
  display: grid;
  place-items: center;
  position: relative;
  transition: transform 0.2s;
}
.fab:hover {
  transform: scale(1.06);
}
.fab.active {
  background: var(--gold);
  color: var(--ink);
}
.unreadBadge {
  position: absolute;
  top: -4px;
  inset-inline-end: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.window {
  width: 370px;
  height: min(540px, calc(100svh - 120px));
  border-radius: 22px;
  border: 1px solid var(--border);
  background: #fff;
  box-shadow: 0 16px 48px rgba(20, 20, 20, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  background: var(--ink);
  border-bottom: 3px solid var(--gold);
  color: #fff;
  flex-shrink: 0;
}
.headerInfo {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--gold);
  color: var(--ink);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.headerTitle {
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 16px;
}
.headerSub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #cfc7b8;
}
.online {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: #3fbf7f;
}
.closeBtn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #3a342b;
  background: #26221c;
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg);
}
.msg {
  display: flex;
}
.msg.user {
  justify-content: flex-end;
}
.msg.assistant {
  justify-content: flex-start;
}
.bubble {
  max-width: 84%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere; /* long words/links never push the bubble wider than the window */
  min-width: 0;
}
.msg.user .bubble {
  background: var(--ink);
  color: #fff;
  border-end-end-radius: 4px;
}
.msg.assistant .bubble {
  background: #fff;
  color: var(--ink);
  border: 1px solid var(--border);
  border-end-start-radius: 4px;
}
.msg.error .bubble {
  background: #fcebe7;
  border-color: #f3c9bf;
  color: var(--danger);
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.suggestion {
  border: 1px solid var(--gold);
  background: var(--sand);
  color: var(--gold-text);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: start;
}
.suggestion:hover {
  background: var(--gold);
  color: var(--ink);
}

.typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 16px;
}
.typing span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--gold);
  animation: bounce 1.2s infinite;
}
.typing span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

.inputRow {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  background: #fff;
  flex-shrink: 0;
}
.input {
  flex: 1;
  min-width: 0;
  height: 44px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--ink);
  outline: none;
  background: #fff;
}
.input:focus {
  border-color: var(--gold);
}
.sendBtn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--gold);
  border: none;
  color: var(--ink);
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.sendBtn:disabled {
  opacity: 0.45;
  cursor: default;
}

.window-enter-active,
.window-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.window-enter-from,
.window-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

@media (max-width: 480px) {
  .chatRoot {
    bottom: 14px;
    inset-inline-end: 12px;
  }
  .window {
    width: calc(100vw - 24px);
    height: min(560px, calc(100svh - 100px));
  }
}
</style>
