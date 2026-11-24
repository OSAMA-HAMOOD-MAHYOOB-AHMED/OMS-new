import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useApi } from '../../api/useApi'
import { Button, Card, ErrorBox, InfoBox, Loading, Row, Screen } from '../../components/ui'
import { ROLES, useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { colors, radius } from '../../theme'
import { SHIPPING } from '../../utils/format'
import { productImageSource } from '../../utils/images'

export default function ProductDetailsScreen({ navigation, route }) {
  const { productID, product: initial } = route.params || {}
  const { role } = useAuth()
  const isCustomer = role === ROLES.Customer
  const { add, items } = useCart()
  const { format } = useCurrency()
  const { data, error, loading, reload } = useApi(`/api/products/${encodeURIComponent(productID)}`, { initial })
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const p = data
  if (loading && !p) return <Loading />
  if (!p) return <Screen><ErrorBox message={error || 'Product not found.'} onRetry={reload} /></Screen>

  const inCart = items.find((i) => i.productID === p.productID)?.quantity || 0
  const maxQty = Math.max(0, p.stockLevel - inCart)
  const out = p.stockLevel <= 0

  function onAdd() {
    add(p, qty)
    setAdded(true)
    setQty(1)
  }

  return (
    <Screen>
      <Image source={productImageSource(p)} style={styles.image} resizeMode="cover" />
      <Text style={styles.cat}>{p.category}</Text>
      <Text style={styles.name}>{p.name}</Text>
      <Text style={styles.price}>{format(p.price)}</Text>
      <Text style={[styles.stock, out && { color: colors.danger }]}>
        {out ? 'Out of stock' : `${p.stockLevel} in stock`}
      </Text>

      {p.description ? (
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={{ color: colors.textSoft, lineHeight: 21 }}>{p.description}</Text>
        </Card>
      ) : null}

      <Card>
        <Row label="Product ID" value={p.productID} />
        <Row label="Shipping" value={`${SHIPPING.service} — ${SHIPPING.costLabel}`} />
        <Row label="Delivery" value={SHIPPING.estimatedDelivery} />
      </Card>

      {isCustomer ? (
        <>
          {added ? <InfoBox tone="success" message="Added to your cart." /> : null}
          {!out ? (
            <View style={styles.qtyRow}>
              <Text style={{ fontWeight: '700', color: colors.text }}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.stepBtn} accessibilityLabel="Decrease quantity">
                  <Ionicons name="remove" size={20} color={colors.text} />
                </Pressable>
                <Text style={styles.qty}>{qty}</Text>
                <Pressable
                  onPress={() => setQty((q) => Math.min(maxQty || 1, q + 1))}
                  style={styles.stepBtn}
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={20} color={colors.text} />
                </Pressable>
              </View>
            </View>
          ) : null}
          {inCart > 0 ? <Text style={{ color: colors.textSoft, marginBottom: 8 }}>{inCart} already in your cart.</Text> : null}
          <Button title={out ? 'Out of stock' : 'Add to cart'} icon="cart" onPress={onAdd} disabled={out || maxQty <= 0} />
          {added ? (
            <Button title="Go to cart" variant="secondary" style={{ marginTop: 8 }} onPress={() => navigation.navigate('CustomerHome', { screen: 'Cart' })} />
          ) : null}
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 1.2, borderRadius: radius.lg, backgroundColor: '#eef2f7', marginBottom: 16 },
  cat: { fontSize: 12, color: colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  price: { fontSize: 24, fontWeight: '800', color: colors.primary, marginTop: 8 },
  stock: { color: colors.success, marginTop: 4, fontWeight: '600' },
  sectionTitle: { fontWeight: '700', color: colors.text, marginBottom: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface },
  stepBtn: { padding: 10 },
  qty: { minWidth: 36, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
})
