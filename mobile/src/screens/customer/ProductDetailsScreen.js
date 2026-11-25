import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useApi } from '../../api/useApi'
import { ErrorBox, InfoBox, Loading, Screen } from '../../components/ui'
import { ROLES, useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { tp, useI18n } from '../../i18n'
import ProductTabs from '../../components/ProductTabs'
import { discountPercent, isOnSale } from '../../utils/pricing'
import { Stars } from './ProductsScreen'
import { colors, fonts, radius } from '../../theme'
import { SHIPPING } from '../../utils/format'
import { productImageSource } from '../../utils/images'

export default function ProductDetailsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { productID, product: initial } = route.params || {}
  const { role } = useAuth()
  const isCustomer = role === ROLES.Customer
  const { add, items } = useCart()
  const { format } = useCurrency()
  const { t, isRtl, textAlign, categoryLabel } = useI18n()
  const { data, error, loading, reload } = useApi(`/api/products/${encodeURIComponent(productID)}`, { initial })
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const p = data
  if (loading && !p) return <Loading />
  if (!p)
    return (
      <Screen>
        <ErrorBox message={error || t('product.notFound')} onRetry={reload} />
      </Screen>
    )

  const inCart = items.find((i) => i.productID === p.productID)?.quantity || 0
  const maxQty = Math.max(0, p.stockLevel - inCart)
  const out = p.stockLevel <= 0
  const low = !out && p.stockLevel <= 15
  const sale = isOnSale(p)

  function share() {
    // The website's product page, so the link opens for anyone.
    Share.share({ message: `${p.name}\nhttps://alwakeel-alshamel.vercel.app/products/${encodeURIComponent(p.productID)}` }).catch(() => {})
  }

  function onAdd() {
    add(p, qty)
    setAdded(true)
    setQty(1)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: isCustomer ? 120 : 32 }}>
        <View style={styles.hero}>
          <Image source={productImageSource(p)} style={styles.heroImg} resizeMode="cover" />
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.roundBtn, { top: insets.top + 10, start: 16 }]}
            accessibilityRole="button"
            accessibilityLabel={t('product.back')}
            hitSlop={6}
          >
            <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.ink} />
          </Pressable>
          <Pressable
            onPress={share}
            style={[styles.roundBtn, { top: insets.top + 10, end: 16 }]}
            accessibilityRole="button"
            accessibilityLabel={tp('Share')}
            hitSlop={6}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.ink} />
          </Pressable>
          {sale ? (
            <View style={styles.saleBadge}>
              <Text style={styles.saleText}>{`\u200E-${discountPercent(p)}%`}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sheet}>
          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{categoryLabel(p.category)}</Text>
            </View>
            <View style={styles.stockRow}>
              <View style={[styles.dot, (out || low) && { backgroundColor: colors.danger }]} />
              <Text style={[styles.stockText, (out || low) && { color: colors.danger }]}>
                {out ? t('common.outOfStock') : low ? t('common.onlyLeft', { n: p.stockLevel }) : t('common.available', { n: p.stockLevel })}
              </Text>
            </View>
          </View>

          <Text style={[styles.name, { textAlign }]}>{p.name}</Text>
          {p.reviewCount ? (
            <View style={{ marginTop: 4 }}>
              <Stars rating={p.rating} count={p.reviewCount} size={14} />
            </View>
          ) : null}
          {!isCustomer ? <Text style={[styles.priceBig, { textAlign }]}>{format(p.price)}</Text> : null}
          {sale ? (
            <View style={styles.saveRow}>
              <Text style={styles.wasBig}>{format(p.compareAtPrice)}</Text>
              <View style={styles.savePill}>
                <Text style={styles.saveText}>
                  {tp('You save')} {format(p.compareAtPrice - p.price)}
                </Text>
              </View>
            </View>
          ) : null}

          <ProductTabs product={p} onChanged={reload} />

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={20} color={colors.goldText} />
              <Text style={styles.infoText}>{t('product.cod')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={20} color={colors.goldText} />
              <Text style={styles.infoText}>
                {SHIPPING.service} · {tp(SHIPPING.estimatedDelivery)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={20} color={colors.goldText} />
              <Text style={styles.infoText}>
                {t('product.sku')}: {p.productID}
              </Text>
            </View>
          </View>

          {isCustomer && added ? (
            <View style={{ marginTop: 14 }}>
              <InfoBox tone="success" message={t('product.added')} />
              <Pressable onPress={() => navigation.navigate('CustomerHome', { screen: 'Cart' })} style={styles.linkBtn}>
                <Text style={styles.linkText}>{t('product.goToCart')}</Text>
              </Pressable>
            </View>
          ) : null}
          {isCustomer && inCart > 0 && !added ? (
            <Text style={[styles.inCart, { textAlign }]}>{t('product.inCart', { n: inCart })}</Text>
          ) : null}
        </View>
      </ScrollView>

      {isCustomer ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <View>
            <Text style={styles.priceLabel}>{t('product.price')}</Text>
            <Text style={styles.price}>{format(p.price)}</Text>
          </View>
          {!out ? (
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setQty((q) => Math.max(1, q - 1))}
                style={styles.stepBtn}
                accessibilityLabel={t('product.decrease')}
                hitSlop={4}
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </Pressable>
              <Text style={styles.qty}>{qty}</Text>
              <Pressable
                onPress={() => setQty((q) => Math.min(maxQty || 1, q + 1))}
                style={styles.stepBtn}
                accessibilityLabel={t('product.increase')}
                hitSlop={4}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </Pressable>
            </View>
          ) : null}
          <Pressable
            onPress={onAdd}
            disabled={out || maxQty <= 0}
            style={({ pressed }) => [styles.addBtn, (out || maxQty <= 0) && { backgroundColor: colors.border }, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            <Ionicons name="cart-outline" size={19} color={colors.ink} />
            <Text style={styles.addText} numberOfLines={1}>
              {out ? t('common.outOfStock') : t('common.addToCart')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  hero: { height: 340, backgroundColor: '#fff' },
  saleBadge: {
    position: 'absolute',
    bottom: 44,
    start: 16,
    backgroundColor: colors.danger,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  saleText: { color: '#fff', fontFamily: fonts.bold, fontSize: 13 },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  wasBig: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textDecorationLine: 'line-through' },
  savePill: { backgroundColor: colors.dangerSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  saveText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 12 },
  heroImg: { width: '100%', height: '100%' },
  roundBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(250,248,244,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -24,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chip: { backgroundColor: colors.sand, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  chipText: { color: colors.goldText, fontSize: 12, fontFamily: fonts.semibold },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  stockText: { color: colors.success, fontSize: 13, fontFamily: fonts.medium },
  name: { fontSize: 22, lineHeight: 34, fontFamily: fonts.headingHeavy, color: colors.text, marginTop: 12 },
  priceBig: { fontSize: 26, fontFamily: fonts.headingHeavy, color: colors.text, marginTop: 6 },
  h2: { fontSize: 15, fontFamily: fonts.semibold, color: colors.text, marginBottom: 4 },
  desc: { fontSize: 14, lineHeight: 24, fontFamily: fonts.regular, color: '#3A352D' },
  infoBox: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    gap: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 13, fontFamily: fonts.regular, color: colors.text, flexShrink: 1 },
  inCart: { marginTop: 12, color: colors.textSoft, fontFamily: fonts.regular },
  linkBtn: { alignSelf: 'flex-start', paddingVertical: 6 },
  linkText: { color: colors.goldText, fontFamily: fonts.semibold, fontSize: 14, textDecorationLine: 'underline' },
  bottomBar: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceLabel: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSoft },
  price: { fontSize: 20, fontFamily: fonts.headingHeavy, color: colors.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    height: 46,
  },
  stepBtn: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 20, textAlign: 'center', fontSize: 15, fontFamily: fonts.semibold, color: colors.text },
  addBtn: {
    flex: 1,
    height: 50,
    borderRadius: radius.sm,
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  addText: { color: colors.ink, fontFamily: fonts.bold, fontSize: 14, flexShrink: 1 },
})
