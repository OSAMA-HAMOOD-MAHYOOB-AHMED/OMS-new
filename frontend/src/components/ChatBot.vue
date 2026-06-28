<template>
  <div class="chatRoot">
    <Transition name="window">
      <div v-if="isOpen" class="window">
        <div class="header">
          <div class="headerInfo">
            <div class="avatar">🤖</div>
            <div>
              <div class="headerTitle">Store Assistant</div>
              <div class="headerSub">Al-Wakeel Al-Shamel</div>
            </div>
          </div>
          <button class="closeBtn" type="button" @click="isOpen = false">✕</button>
        </div>

        <div class="messages" ref="messagesEl">
          <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role]">
            <div class="bubble">{{ msg.content }}</div>
          </div>
          <div v-if="loading" class="msg assistant">
            <div class="bubble typing">
              <span /><span /><span />
            </div>
          </div>
        </div>

        <div class="inputRow">
          <input
            ref="inputEl"
            v-model="input"
            class="input"
            type="text"
            placeholder="Ask about our products..."
            :disabled="loading"
            @keydown.enter="send"
          />
          <button class="sendBtn" type="button" :disabled="loading || !input.trim()" @click="send">
            ➤
          </button>
        </div>
      </div>
    </Transition>

    <button class="fab" :class="{ active: isOpen }" type="button" aria-label="Chat with us" @click="toggle">
      <span v-if="isOpen" class="fabIcon">✕</span>
      <span v-else class="fabIcon">💬</span>
      <span v-if="unread > 0 && !isOpen" class="unreadBadge">{{ unread }}</span>
    </button>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { api } from '../api/client'

const isOpen = ref(false)
const input = ref('')
const loading = ref(false)
const unread = ref(0)
const messagesEl = ref(null)
const inputEl = ref(null)

const messages = ref([
  { role: 'assistant', content: 'Hi! 👋 I\'m your shopping assistant. Ask me anything about our chargers, earphones, power banks, or phone cases!' }
])
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
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
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
  } catch {
    messages.value.push({ role: 'assistant', content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.' })
  } finally {
    loading.value = false
    await nextTick()
    scrollBottom()
  }
}
</script>

<style scoped>
.chatRoot {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: var(--brand-blue);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}
.fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.55);
}
.fab.active {
  background: #334155;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.fabIcon {
  font-size: 22px;
  line-height: 1;
}
.unreadBadge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 900;
  display: grid;
  place-items: center;
}

.window {
  width: 360px;
  height: 480px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: #fff;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--brand-blue);
  color: #fff;
  flex-shrink: 0;
}
.headerInfo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  font-size: 22px;
  line-height: 1;
}
.headerTitle {
  font-weight: 900;
  font-size: 15px;
}
.headerSub {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 600;
}
.closeBtn {
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 900;
  display: grid;
  place-items: center;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
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
  max-width: 78%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-wrap;
}
.msg.user .bubble {
  background: var(--brand-blue);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg.assistant .bubble {
  background: #f1f5f9;
  color: var(--text-h);
  border-bottom-left-radius: 4px;
}

.typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 16px;
}
.typing span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #94a3b8;
  animation: bounce 1.2s infinite;
}
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.inputRow {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.input {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-h);
  outline: none;
}
.input:focus {
  border-color: var(--brand-blue);
}
.sendBtn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--brand-blue);
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.sendBtn:disabled {
  opacity: 0.4;
  cursor: default;
}

/* slide-up animation */
.window-enter-active,
.window-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.window-enter-from,
.window-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

@media (max-width: 420px) {
  .chatRoot {
    bottom: 16px;
    right: 12px;
  }
  .window {
    width: calc(100vw - 24px);
    height: 420px;
  }
}
</style>
