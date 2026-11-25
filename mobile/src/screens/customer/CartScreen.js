import { Ionicons } from '@expo/vector-icons'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Button, Card, Divider, Empty, Row, Screen } from '../../components/ui'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { colors, radius } from '../../theme'
import { SHIPPING } from '../../utils/format'
import { productImageSource } from '../../utils/images'
import { tp } from '../../i18n'

export default function CartScreen({ navigation }) {
  const { items, total, count, setQuantity, remove, clear } = useCart()
  const { format } = useCurrency()

  if (items.length === 0) {
    return (
      <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Empty
          icon="cart-outline"
          title={tp('Your cart is empty')}
          message={tp('Browse the shop and add some products.')}
          action={<Button title={tp('Start shopping')} onPress={() => navigation.navigate('Shop')} />}
        />
      </Screen>
    )
  }

  function confirmClear() {
    Alert.alert(tp('Clear cart?'), tp('Remove all items from your cart.'), [
      { text: tp('Cancel'), style: 'cancel' },
      { text: tp('Clear'), style: 'destructive', onPress: clear },
    ])
  }

  return (
    <Screen>
      {items.map((it) => (
        <Card key={it.productID} style={styles.item}>
          <Image source={productImageSource(it)} style={styles.thumb} />
          <View style={{ flex: 1, marginStart: 12 }}>
            <Text style={styles.name} numberOfLines={2}>
              {it.name}
            </Text>
            <Text style={styles.unit}>{format(it.price)} each</Text>
            <View style={styles.row}>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => (it.quantity <= 1 ? remove(it.productID) : setQuantity(it.productID, it.quantity - 1))}
                  style={styles.stepBtn}
                  accessibilityLabel={tp('Decrease quantity')}
                >
                  <Ionicons name={it.quantity <= 1 ? 'trash-outline' : 'remove'} size={18} color={colors.text} />
                </Pressable>
                <Text style={styles.qty}>{it.quantity}</Text>
                <Pressable
                  onPress={() => setQuantity(it.productID, it.quantity + 1)}
                  style={styles.stepBtn}
                  accessibilityLabel={tp('Increase quantity')}
                  disabled={it.stockLevel != null && it.quantity >= it.stockLevel}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                </Pressable>
              </View>
              <Text style={styles.subtotal}>{format(it.price * it.quantity)}</Text>
            </View>
          </View>
        </Card>
      ))}

      <Card>
        <Row label={`${tp('Items')} (${count})`} value={format(total)} />
        <Row label={tp('Shipping')} value={`${SHIPPING.carrier} — ${SHIPPING.costLabel}`} />
        <Divider />
        <Row label={tp('Total')} value={format(total)} bold />
      </Card>

      <Button title={tp('Proceed to checkout')} icon="lock-closed" onPress={() => navigation.navigate('Checkout')} />
      <Button title={tp('Clear cart')} variant="ghost" onPress={confirmClear} style={{ marginTop: 8 }} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', padding: 12 },
  thumb: { width: 72, height: 72, borderRadius: radius.sm, backgroundColor: '#F4F0E8' },
  name: { fontWeight: '700', color: colors.text },
  unit: { color: colors.textSoft, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  stepBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  qty: { minWidth: 28, textAlign: 'center', fontWeight: '700', color: colors.text },
  subtotal: { fontWeight: '800', color: colors.text },
})
