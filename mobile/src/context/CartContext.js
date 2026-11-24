import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'

// The cart is saved per signed-in email so switching accounts never mixes carts.
const CartContext = createContext(null)

function keyFor(email) {
  return `oms_cart_${String(email || 'guest').toLowerCase()}`
}

export function CartProvider({ children }) {
  const { session } = useAuth()
  const email = session?.email
  const [items, setItems] = useState([])
  const [loadedFor, setLoadedFor] = useState(null)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(keyFor(email))
      .then((raw) => {
        if (cancelled) return
        const parsed = raw ? JSON.parse(raw) : []
        setItems(Array.isArray(parsed) ? parsed : [])
        setLoadedFor(email ?? null)
      })
      .catch(() => !cancelled && setItems([]))
    return () => {
      cancelled = true
    }
  }, [email])

  const persist = useCallback(
    (next) => {
      setItems(next)
      AsyncStorage.setItem(keyFor(email), JSON.stringify(next)).catch(() => {})
    },
    [email],
  )

  const add = useCallback(
    (product, qty = 1) => {
      const existing = items.find((x) => x.productID === product.productID)
      const max = Number(product.stockLevel ?? Infinity)
      const next = existing
        ? items.map((x) =>
            x.productID === product.productID ? { ...x, quantity: Math.min(x.quantity + qty, max) } : x,
          )
        : [
            ...items,
            {
              productID: product.productID,
              name: product.name,
              price: product.price,
              category: product.category,
              imageUrl: product.imageUrl || null,
              stockLevel: product.stockLevel,
              quantity: Math.min(qty, max),
            },
          ]
      persist(next)
    },
    [items, persist],
  )

  const setQuantity = useCallback(
    (productID, quantity) => {
      persist(
        items.map((x) => {
          if (x.productID !== productID) return x
          const max = Number(x.stockLevel ?? Infinity)
          return { ...x, quantity: Math.max(1, Math.min(Number(quantity) || 1, max)) }
        }),
      )
    },
    [items, persist],
  )

  const remove = useCallback((productID) => persist(items.filter((x) => x.productID !== productID)), [items, persist])
  const clear = useCallback(() => persist([]), [persist])

  const value = useMemo(() => {
    const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
    const count = items.reduce((acc, i) => acc + i.quantity, 0)
    return { items, total, count, add, setQuantity, remove, clear, loaded: loadedFor === (email ?? null) }
  }, [items, add, setQuantity, remove, clear, loadedFor, email])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
