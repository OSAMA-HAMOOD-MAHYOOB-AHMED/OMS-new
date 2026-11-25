import { Ionicons } from '@expo/vector-icons'
import { useMemo, useRef, useState } from 'react'
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCategories } from '../../api/categories'
import { useApi } from '../../api/useApi'
import { Chip, Empty, ErrorBox, Loading } from '../../components/ui'
import { ROLES, useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { categoryGroup, tp, useI18n } from '../../i18n'
import { colors, fonts, radius } from '../../theme'
import { hero, logo, productImageSource } from '../../utils/images'

// Icons for the usual kinds of products; any new category the admin adds gets a generic one.
const GROUP_ICONS = {
  chargers: 'flash-outline',
  powerbanks: 'battery-charging-outline',
  earphones: 'headset-outline',
  cases: 'phone-portrait-outline',
}
const iconFor = (name) => GROUP_ICONS[categoryGroup(name)] || 'grid-outline'

const SORTS = ['featured', 'priceAsc', 'priceDesc', 'name']
const SORT_LABEL = { featured: 'home.sortFeatured', priceAsc: 'home.sortPriceAsc', priceDesc: 'home.sortPriceDesc', name: 'home.sortName' }

function ProductCard({ product: p, onOpen, onAdd, canBuy }) {
  const { t, categoryLabel, textAlign } = useI18n()
  const { format } = useCurrency()
  const [justAdded, setJustAdded] = useState(false)
  const out = p.stockLevel <= 0
  const low = !out && p.stockLevel <= 15

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]} onPress={onOpen}>
      <View>
        <Image source={productImageSource(p)} style={styles.image} resizeMode="cover" />
        {out || low ? (
          <View style={[styles.flag, out && { backgroundColor: '#EEEBE5' }]}>
            <Text style={[styles.flagText, out && { color: '#57514A' }]}>
              {out ? t('common.outOfStock') : t('common.onlyLeft', { n: p.stockLevel })}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cat, { textAlign }]}>{categoryLabel(p.category)}</Text>
        <Text style={[styles.name, { textAlign }]} numberOfLines={2}>
          {p.name}
        </Text>
        <View style={styles.cardBottom}>
          <Text style={styles.price}>{format(p.price)}</Text>
          {canBuy ? (
            <Pressable
              disabled={out}
              onPress={() => {
                onAdd()
                setJustAdded(true)
                setTimeout(() => setJustAdded(false), 1200)
              }}
              hitSlop={6}
              style={({ pressed }) => [styles.addBtn, out && { backgroundColor: colors.border }, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel={`${t('common.addToCart')}: ${p.name}`}
            >
              <Ionicons name={justAdded ? 'checkmark' : 'add'} size={18} color={out ? colors.muted : '#fff'} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

export default function ProductsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const listRef = useRef(null)
  const { role } = useAuth()
  const isCustomer = role === ROLES.Customer
  const { add } = useCart()
  const { t, textAlign, inputAlign, categoryLabel } = useI18n()
  const { data: catData } = useCategories()
  const cats = (catData || []).filter((c) => c.productCount > 0)
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/products', { initial: [] })

  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState('featured')
  const [inStockOnly, setInStockOnly] = useState(false)

  const products = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = (data || []).filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false
      if (inStockOnly && p.stockLevel <= 0) return false
      if (q && !`${p.name} ${p.category} ${p.productID} ${categoryLabel(p.category)}`.toLowerCase().includes(q)) return false
      return true
    })
    if (sort === 'priceAsc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'priceDesc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'featured') list = [...list].sort((a, b) => (b.stockLevel > 0) - (a.stockLevel > 0))
    return list
  }, [data, query, cat, sort, inStockOnly, categoryLabel])

  if (loading) return <Loading label={t('home.loadingProducts')} />

  const header = (
    <View>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={[styles.welcome, { textAlign }]}>{isCustomer ? t('home.welcome') : t('home.catalog')}</Text>
            <Text style={[styles.brand, { textAlign }]}>{t('home.offerTag')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={19} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('home.search')}
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { textAlign: inputAlign }]}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {!query && cat === 'all' ? (
        <View style={styles.banner}>
          <Image source={hero} style={styles.bannerImg} resizeMode="cover" />
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTag, { textAlign }]}>{t('home.offerTag')}</Text>
            <Text style={[styles.bannerTitle, { textAlign }]}>{t('home.offerTitle')}</Text>
            <Pressable
              style={styles.bannerBtn}
              onPress={() => listRef.current?.scrollToOffset({ offset: 420, animated: true })}
              accessibilityRole="button"
            >
              <Text style={styles.bannerBtnText}>{t('home.shopNow')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
        {cats.map((c) => {
          const active = cat === c.name
          return (
            <Pressable
              key={c.name}
              style={styles.catItem}
              onPress={() => setCat(active ? 'all' : c.name)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.catIcon, active && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
                <Ionicons name={iconFor(c.name)} size={24} color={active ? colors.gold : colors.goldText} />
              </View>
              <Text style={[styles.catLabel, active && { fontFamily: fonts.bold }]} numberOfLines={1}>
                {categoryLabel(c.name)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <Chip label={t('home.inStockOnly')} active={inStockOnly} onPress={() => setInStockOnly((v) => !v)} />
        {SORTS.map((s) => (
          <Chip key={s} label={t(SORT_LABEL[s])} active={sort === s} onPress={() => setSort(s)} />
        ))}
      </ScrollView>

      <ErrorBox message={error} onRetry={reload} />

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{cat === 'all' ? t('home.allProducts') : categoryLabel(cat)}</Text>
        <Text style={styles.count}>{t('home.count', { n: products.length })}</Text>
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        ref={listRef}
        data={products}
        keyExtractor={(p) => p.productID}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: isCustomer ? 96 : 32 }}
        style={{ backgroundColor: colors.bg }}
        ListHeaderComponent={header}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={!error ? <Empty icon="search" title={t('home.noResults')} message={t('home.noResultsHint')} /> : null}
        renderItem={({ item: p }) => (
          <ProductCard
            product={p}
            canBuy={isCustomer}
            onOpen={() => navigation.navigate('ProductDetails', { productID: p.productID, product: p })}
            onAdd={() => add(p, 1)}
          />
        )}
      />
      {isCustomer ? (
        <Pressable
          onPress={() => navigation.navigate('Chat')}
          style={({ pressed }) => [styles.chatFab, pressed && { transform: [{ scale: 0.95 }] }]}
          accessibilityRole="button"
          accessibilityLabel={tp('Ask our assistant')}
        >
          <Ionicons name="chatbubbles" size={24} color={colors.gold} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  chatFab: {
    position: 'absolute',
    bottom: 18,
    end: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  welcome: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSoft },
  brand: { fontSize: 17, fontFamily: fonts.heading, color: colors.text },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: { flex: 1, minHeight: 48, fontSize: 15, fontFamily: fonts.regular, color: colors.text },
  banner: { height: 160, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.ink, marginBottom: 18 },
  bannerImg: { position: 'absolute', top: 0, bottom: 0, end: 0, width: '40%', height: '100%', opacity: 0.85 },
  bannerText: { flex: 1, padding: 18, justifyContent: 'space-between', width: '62%', maxWidth: '62%' },
  bannerTag: { color: colors.gold, fontSize: 12, fontFamily: fonts.medium },
  bannerTitle: { color: '#fff', fontSize: 19, lineHeight: 30, fontFamily: fonts.headingHeavy },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 38,
    justifyContent: 'center',
  },
  bannerBtnText: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 13 },
  cats: { gap: 14, paddingBottom: 16, paddingHorizontal: 2 },
  catItem: { alignItems: 'center', width: 72, gap: 6 },
  catIcon: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.text },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontFamily: fonts.heading, color: colors.text },
  count: { color: colors.textSoft, fontSize: 13, fontFamily: fonts.regular },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
    maxWidth: '48.5%',
  },
  // Fixed height: local (bundled) images ignore aspectRatio and would stretch the card.
  image: { width: '100%', height: 165, backgroundColor: colors.sand2 },
  flag: {
    position: 'absolute',
    top: 8,
    start: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  flagText: { color: colors.danger, fontSize: 11, fontFamily: fonts.semibold },
  cardBody: { padding: 12, paddingTop: 10, flex: 1 },
  cat: { fontSize: 11, color: colors.goldText, fontFamily: fonts.medium },
  name: { fontSize: 13, lineHeight: 20, fontFamily: fonts.semibold, color: colors.text, marginTop: 2, minHeight: 40 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { fontSize: 16, fontFamily: fonts.headingHeavy, color: colors.text, flexShrink: 1 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
