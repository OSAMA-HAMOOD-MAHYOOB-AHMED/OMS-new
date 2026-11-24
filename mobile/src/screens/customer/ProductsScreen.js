import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useApi } from '../../api/useApi'
import { Chip, Empty, ErrorBox, Loading } from '../../components/ui'
import { ROLES, useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCurrency } from '../../context/CurrencyContext'
import { colors, radius, shadow } from '../../theme'
import { productImageSource } from '../../utils/images'

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'priceAsc', label: 'Price ↑' },
  { key: 'priceDesc', label: 'Price ↓' },
  { key: 'name', label: 'Name' },
]

export default function ProductsScreen({ navigation }) {
  const { role } = useAuth()
  const isCustomer = role === ROLES.Customer
  const { add } = useCart()
  const { format } = useCurrency()
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/products', { initial: [] })

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [inStockOnly, setInStockOnly] = useState(false)

  const categories = useMemo(() => {
    const s = new Set((data || []).map((p) => p.category).filter(Boolean))
    return ['All', ...Array.from(s).sort()]
  }, [data])

  const products = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = (data || []).filter((p) => {
      if (category !== 'All' && p.category !== category) return false
      if (inStockOnly && p.stockLevel <= 0) return false
      if (q && !`${p.name} ${p.category} ${p.productID}`.toLowerCase().includes(q)) return false
      return true
    })
    if (sort === 'priceAsc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'priceDesc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [data, query, category, sort, inStockOnly])

  if (loading) return <Loading label="Loading products…" />

  const header = (
    <View>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search products"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {categories.map((c) => (
          <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <Chip label="In stock" active={inStockOnly} onPress={() => setInStockOnly((v) => !v)} />
        {SORTS.map((s) => (
          <Chip key={s.key} label={s.label} active={sort === s.key} onPress={() => setSort(s.key)} />
        ))}
      </ScrollView>
      <ErrorBox message={error} onRetry={reload} />
      <Text style={styles.count}>
        {products.length} product{products.length === 1 ? '' : 's'}
      </Text>
    </View>
  )

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => p.productID}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      style={{ backgroundColor: colors.bg }}
      ListHeaderComponent={header}
      refreshing={refreshing}
      onRefresh={refresh}
      ListEmptyComponent={
        !error ? <Empty icon="search" title="No products found" message="Try a different search or category." /> : null
      }
      renderItem={({ item: p }) => {
        const out = p.stockLevel <= 0
        return (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate('ProductDetails', { productID: p.productID, product: p })}
          >
            <Image source={productImageSource(p)} style={styles.image} resizeMode="cover" />
            <View style={{ padding: 10, flex: 1 }}>
              <Text style={styles.cat}>{p.category}</Text>
              <Text style={styles.name} numberOfLines={2}>
                {p.name}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.price}>{format(p.price)}</Text>
              <Text style={[styles.stock, out && { color: colors.danger }, p.stockLevel > 0 && p.stockLevel <= 10 && { color: colors.warning }]}>
                {out ? 'Out of stock' : p.stockLevel <= 10 ? `Only ${p.stockLevel} left` : `${p.stockLevel} in stock`}
              </Text>
              {isCustomer ? (
                <Pressable
                  disabled={out}
                  onPress={() => add(p, 1)}
                  style={({ pressed }) => [styles.addBtn, out && { backgroundColor: colors.border }, pressed && { opacity: 0.8 }]}
                  accessibilityLabel={`Add ${p.name} to cart`}
                >
                  <Ionicons name="add" size={16} color={out ? colors.muted : '#fff'} />
                  <Text style={[styles.addText, out && { color: colors.muted }]}>Add</Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, minHeight: 44, marginLeft: 8, fontSize: 15, color: colors.text },
  count: { color: colors.textSoft, marginBottom: 8, fontSize: 13 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
    maxWidth: '48.5%',
    ...shadow,
  },
  image: { width: '100%', aspectRatio: 1, backgroundColor: '#eef2f7' },
  cat: { fontSize: 11, color: colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  name: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2, marginBottom: 6 },
  price: { fontSize: 16, fontWeight: '800', color: colors.text },
  stock: { fontSize: 12, color: colors.success, marginTop: 2 },
  addBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
  },
  addText: { color: '#fff', fontWeight: '700', marginLeft: 4 },
})
