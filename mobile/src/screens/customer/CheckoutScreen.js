import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { Button, Card, Divider, ErrorBox, Input, Row, Screen, SectionTitle } from '../../components/ui'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { colors, radius } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { SHIPPING } from '../../utils/format'
import { detectCardBrand, digitsOnly, formatCardNumber, formatExpiry, validateCardForm } from '../../utils/validation'

const METHODS = [
  { key: 'Cash', title: 'Cash on Delivery', subtitle: 'Pay when your order arrives', icon: 'cash-outline' },
  { key: 'CreditCard', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, Amex', icon: 'card-outline' },
]

export default function CheckoutScreen({ navigation }) {
  const { items, total, count, clear } = useCart()
  const { format } = useCurrency()
  const { data: profile } = useApi('/api/profile')
  const [method, setMethod] = useState('Cash')
  const [card, setCard] = useState({ cardName: '', cardNumber: '', cardExpiry: '', cardCvv: '' })
  const [cardErrors, setCardErrors] = useState({})
  const [error, setError] = useState(null)
  const [placing, setPlacing] = useState(false)

  const brand = detectCardBrand(card.cardNumber)

  async function placeOrder() {
    setError(null)
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }
    let paymentDetails = null
    if (method === 'CreditCard') {
      const { valid, errors } = validateCardForm(card)
      setCardErrors(errors)
      if (!valid) return
      paymentDetails = {
        creditCard: {
          cardNumber: digitsOnly(card.cardNumber),
          expiry: card.cardExpiry.trim(),
          cvv: card.cardCvv.trim(),
          cardholderName: card.cardName.trim(),
        },
        onlineBanking: null,
      }
    }

    setPlacing(true)
    try {
      const res = await api.post('/api/orders/checkout', {
        paymentMethod: method,
        items: items.map((i) => ({ productID: i.productID, quantity: i.quantity })),
        paymentDetails,
      })
      clear()
      navigation.replace('OrderConfirmation', { order: res.data })
    } catch (e) {
      setError(formatApiError(e))
    } finally {
      setPlacing(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <SectionTitle>Deliver to</SectionTitle>
        <Card>
          {profile ? (
            <>
              <Text style={styles.strong}>{profile.name}</Text>
              <Text style={styles.soft}>{profile.address}</Text>
              <Text style={styles.soft}>{profile.phoneNumber}</Text>
              <Text style={[styles.soft, { marginTop: 8, fontSize: 12 }]}>
                To change this address, edit your profile.
              </Text>
            </>
          ) : (
            <Text style={styles.soft}>Loading your address…</Text>
          )}
          <Divider />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="airplane-outline" size={18} color={colors.primary} />
            <Text style={[styles.soft, { marginLeft: 8 }]}>
              {SHIPPING.service} · {SHIPPING.costLabel} · {SHIPPING.estimatedDelivery}
            </Text>
          </View>
        </Card>

        <SectionTitle>Payment method</SectionTitle>
        {METHODS.map((m) => {
          const active = method === m.key
          return (
            <Pressable key={m.key} onPress={() => setMethod(m.key)} style={[styles.method, active && styles.methodActive]}>
              <Ionicons name={m.icon} size={24} color={active ? colors.primary : colors.textSoft} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.strong}>{m.title}</Text>
                <Text style={styles.soft}>{m.subtitle}</Text>
              </View>
              <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.primary : colors.muted} />
            </Pressable>
          )
        })}

        {method === 'CreditCard' ? (
          <Card style={{ marginTop: 4 }}>
            <Input
              label="Cardholder name"
              value={card.cardName}
              onChangeText={(v) => setCard((c) => ({ ...c, cardName: v }))}
              autoCapitalize="words"
              error={cardErrors.cardName}
            />
            <Input
              label={`Card number${brand && brand !== 'Card' ? ` · ${brand}` : ''}`}
              value={card.cardNumber}
              onChangeText={(v) => setCard((c) => ({ ...c, cardNumber: formatCardNumber(v) }))}
              keyboardType="number-pad"
              placeholder="1234 5678 9012 3456"
              maxLength={23}
              error={cardErrors.cardNumber}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Input
                style={{ flex: 1 }}
                label="Expiry"
                value={card.cardExpiry}
                onChangeText={(v) => setCard((c) => ({ ...c, cardExpiry: formatExpiry(v) }))}
                keyboardType="number-pad"
                placeholder="MM/YY"
                maxLength={5}
                error={cardErrors.cardExpiry}
              />
              <Input
                style={{ flex: 1 }}
                label="CVV"
                value={card.cardCvv}
                onChangeText={(v) => setCard((c) => ({ ...c, cardCvv: digitsOnly(v).slice(0, 4) }))}
                keyboardType="number-pad"
                placeholder="123"
                secure
                maxLength={4}
                error={cardErrors.cardCvv}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
              <Text style={[styles.soft, { marginLeft: 6, fontSize: 12 }]}>Card details are sent securely and never stored on this phone.</Text>
            </View>
          </Card>
        ) : null}

        <SectionTitle>Order summary</SectionTitle>
        <Card>
          {items.map((i) => (
            <Row key={i.productID} label={`${i.quantity} × ${i.name}`} value={format(i.price * i.quantity)} />
          ))}
          <Divider />
          <Row label={`Items (${count})`} value={format(total)} />
          <Row label="Shipping" value={SHIPPING.costLabel} />
          <Row label="Total" value={format(total)} bold />
        </Card>

        <ErrorBox message={error} />
        <Button
          title={placing ? 'Placing order…' : `Place order · ${format(total)}`}
          icon="checkmark-circle"
          onPress={placeOrder}
          loading={placing}
          disabled={items.length === 0}
        />
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  strong: { fontWeight: '700', color: colors.text, fontSize: 15 },
  soft: { color: colors.textSoft, fontSize: 13, marginTop: 2 },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },
  methodActive: { borderColor: colors.primary, backgroundColor: '#f5f8ff' },
})
