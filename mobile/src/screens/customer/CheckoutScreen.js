import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { Button, Card, Divider, ErrorBox, Input, Row, Screen, SectionTitle } from '../../components/ui'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { colors, fonts, radius } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { SHIPPING } from '../../utils/format'
import { detectCardBrand, digitsOnly, formatCardNumber, formatExpiry, validateCardForm } from '../../utils/validation'
import { tp } from '../../i18n'

const METHODS = [
  { key: 'Cash', title: 'Cash on Delivery', subtitle: 'Pay when your order arrives', icon: 'cash-outline' },
  { key: 'CreditCard', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, Amex', icon: 'card-outline' },
]

export default function CheckoutScreen({ navigation }) {
  const { items, total, clear } = useCart()
  const { format } = useCurrency()
  const { data: profile } = useApi('/api/profile')
  const [method, setMethod] = useState('Cash')
  const [card, setCard] = useState({ cardName: '', cardNumber: '', cardExpiry: '', cardCvv: '' })
  const [cardErrors, setCardErrors] = useState({})
  const [error, setError] = useState(null)
  const [placing, setPlacing] = useState(false)
  // Discount code: checked now, and again by the server when the order is placed.
  const [codeInput, setCodeInput] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState(null)
  const [checking, setChecking] = useState(false)
  const discount = coupon ? Math.round(total * coupon.percent) / 100 : 0
  const grandTotal = Math.max(0, total - discount)

  async function applyCoupon() {
    setCouponError(null)
    if (!codeInput.trim()) return
    setChecking(true)
    try {
      const res = await api.post('/api/coupons/check', { code: codeInput.trim(), subtotal: total })
      setCoupon({ code: res.data.code, percent: res.data.percent })
      setCodeInput('')
    } catch (e) {
      setCouponError(formatApiError(e))
    } finally {
      setChecking(false)
    }
  }

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
        couponCode: coupon?.code || null,
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
              <Text style={styles.soft}>{`\u200E${profile.phoneNumber || ''}`}</Text>
              <Text style={[styles.soft, { marginTop: 8, fontSize: 12 }]}>{tp('To change this address, edit your profile.')}</Text>
            </>
          ) : (
            <Text style={styles.soft}>{tp('Loading your address…')}</Text>
          )}
          <Divider />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="airplane-outline" size={18} color={colors.primary} />
            <Text style={[styles.soft, { marginStart: 8 }]}>
              {SHIPPING.service} · {tp(SHIPPING.costLabel)} · {tp(SHIPPING.estimatedDelivery)}
            </Text>
          </View>
        </Card>

        <SectionTitle>Payment method</SectionTitle>
        {METHODS.map((m) => {
          const active = method === m.key
          return (
            <Pressable key={m.key} onPress={() => setMethod(m.key)} style={[styles.method, active && styles.methodActive]}>
              <Ionicons name={m.icon} size={24} color={active ? colors.goldText : colors.textSoft} />
              <View style={{ flex: 1, marginStart: 12 }}>
                <Text style={styles.strong}>{tp(m.title)}</Text>
                <Text style={styles.soft}>{tp(m.subtitle)}</Text>
              </View>
              <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.ink : colors.muted} />
            </Pressable>
          )
        })}

        {method === 'CreditCard' ? (
          <Card style={{ marginTop: 4 }}>
            <Input
              label={tp('Cardholder name')}
              value={card.cardName}
              onChangeText={(v) => setCard((c) => ({ ...c, cardName: v }))}
              autoCapitalize="words"
              error={cardErrors.cardName}
            />
            <Input
              label={`${tp('Card Number')}${brand && brand !== 'Card' ? ` · ${brand}` : ''}`}
              value={card.cardNumber}
              onChangeText={(v) => setCard((c) => ({ ...c, cardNumber: formatCardNumber(v) }))}
              keyboardType="number-pad"
              ltr
              placeholder="1234 5678 9012 3456"
              maxLength={23}
              error={cardErrors.cardNumber}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Input
                style={{ flex: 1 }}
                label={tp('Expiry')}
                value={card.cardExpiry}
                onChangeText={(v) => setCard((c) => ({ ...c, cardExpiry: formatExpiry(v) }))}
                keyboardType="number-pad"
                ltr
                placeholder={tp('MM/YY')}
                maxLength={5}
                error={cardErrors.cardExpiry}
              />
              <Input
                style={{ flex: 1 }}
                label={tp('CVV')}
                value={card.cardCvv}
                onChangeText={(v) => setCard((c) => ({ ...c, cardCvv: digitsOnly(v).slice(0, 4) }))}
                keyboardType="number-pad"
                ltr
                placeholder="123"
                secure
                maxLength={4}
                error={cardErrors.cardCvv}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
              <Text style={[styles.soft, { marginStart: 6, fontSize: 12 }]}>{tp('Card details are sent securely and never stored on this phone.')}</Text>
            </View>
          </Card>
        ) : null}

        <SectionTitle>Order summary</SectionTitle>
        <Card>
          {items.map((i) => (
            <Row key={i.productID} label={`${i.quantity} × ${i.name}`} value={format(i.price * i.quantity)} />
          ))}
          <Divider />
          <Row label={tp('Subtotal')} value={format(total)} />
          <Row label={tp('Shipping')} value={tp(SHIPPING.costLabel)} />
          {coupon ? <Row label={`${tp('Discount')} (${coupon.code})`} value={`-${format(discount)}`} /> : null}
          <Row label={tp('Total')} value={format(grandTotal)} bold />

          <Divider />
          {coupon ? (
            <View style={styles.couponOn}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.couponOnText}>
                {coupon.code} · {coupon.percent}% {tp('off')}
              </Text>
              <Pressable onPress={() => setCoupon(null)} hitSlop={8}>
                <Text style={styles.couponRemove}>{tp('Remove')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <Ionicons name="pricetag-outline" size={18} color={colors.goldText} />
              <TextInput
                value={codeInput}
                onChangeText={setCodeInput}
                placeholder={tp('Discount code')}
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={40}
                style={styles.couponInput}
              />
              <Pressable onPress={applyCoupon} disabled={checking || !codeInput.trim()} style={[styles.couponBtn, (checking || !codeInput.trim()) && { opacity: 0.5 }]}>
                <Text style={styles.couponBtnText}>{checking ? tp('Checking…') : tp('Apply')}</Text>
              </Pressable>
            </View>
          )}
          {couponError ? <Text style={styles.couponError}>{tp(couponError)}</Text> : null}
        </Card>

        <ErrorBox message={error} />
        <Button
          title={placing ? tp('Placing order…') : `${tp('Place order')} · ${format(grandTotal)}`}
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
  strong: { fontFamily: fonts.bold, color: colors.text, fontSize: 15, textAlign: 'left' },
  soft: { fontFamily: fonts.regular, color: colors.textSoft, fontSize: 13, marginTop: 2, textAlign: 'left' },
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
  methodActive: { borderColor: colors.gold, backgroundColor: colors.sand },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.gold,
    backgroundColor: colors.sand,
    borderRadius: radius.sm,
    paddingStart: 12,
    padding: 4,
  },
  couponInput: { flex: 1, height: 40, fontFamily: fonts.semibold, fontSize: 14, color: colors.text, textAlign: 'left', writingDirection: 'ltr' },
  couponBtn: { backgroundColor: colors.ink, borderRadius: 10, paddingHorizontal: 14, height: 38, justifyContent: 'center' },
  couponBtnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 13 },
  couponOn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successSoft, borderRadius: radius.sm, padding: 10 },
  couponOnText: { flex: 1, color: colors.success, fontFamily: fonts.semibold, fontSize: 13, textAlign: 'left' },
  couponRemove: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 13 },
  couponError: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13, marginTop: 6, textAlign: 'left' },
})
