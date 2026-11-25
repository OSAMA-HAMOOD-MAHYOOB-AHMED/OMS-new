import { onUnmounted, ref } from 'vue'

export const CHECKOUT_RETURN_SECONDS = 40

export function useReturnTimer(onExpire, totalSeconds = CHECKOUT_RETURN_SECONDS) {
  const secondsLeft = ref(totalSeconds)
  let timer = null
  let expired = false

  function stop() {
    if (timer) {
      window.clearInterval(timer)
      timer = null
    }
  }

  function proceedNow() {
    if (expired) return
    expired = true
    stop()
    onExpire()
  }

  function start() {
    stop()
    expired = false
    secondsLeft.value = totalSeconds
    timer = window.setInterval(() => {
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) proceedNow()
    }, 1000)
  }

  onUnmounted(stop)

  return { secondsLeft, start, proceedNow, stop }
}
