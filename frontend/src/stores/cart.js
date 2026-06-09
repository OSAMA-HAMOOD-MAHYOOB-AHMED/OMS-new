import { defineStore } from 'pinia'

const STORAGE_KEY = 'oms_cart'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
  }),
  actions: {
    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        this.items = Array.isArray(parsed.items) ? parsed.items : []
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: this.items }))
    },
    add(product, qty = 1) {
      const existing = this.items.find((x) => x.productID === product.productID)
      if (existing) existing.quantity += qty
      else this.items.push({
        productID: product.productID,
        name: product.name,
        price: product.price,
        quantity: qty,
        imageUrl: product.imageUrl || null,
      })
      this.persist()
    },
    remove(productID) {
      this.items = this.items.filter((x) => x.productID !== productID)
      this.persist()
    },
    setQuantity(productID, quantity) {
      const it = this.items.find((x) => x.productID === productID)
      if (!it) return
      it.quantity = Math.max(1, Number(quantity) || 1)
      this.persist()
    },
    clear() {
      this.items = []
      this.persist()
    },
    setItems(items) {
      this.items = Array.isArray(items) ? items : []
      this.persist()
    },
  },
  getters: {
    total: (s) => s.items.reduce((acc, i) => acc + i.price * i.quantity, 0),
  },
})

