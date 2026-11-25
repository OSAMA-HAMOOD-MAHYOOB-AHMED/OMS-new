import { Ionicons } from '@expo/vector-icons'
import { useLayoutEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { Card, Empty, ErrorBox, InfoBox, Loading } from '../../components/ui'
import { useCurrency } from '../../context/CurrencyContext'
import { colors, radius } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { productImageSource } from '../../utils/images'
import { tp } from '../../i18n'

export default function AdminProductsScreen({ navigation }) {
  const { format } = useCurrency()
  const { data, error, loading, refreshing, refresh, reload, setData } = useApi('/api/admin/products', { initial: [] })
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState(null)
  const [actionError, setActionError] = useState(null)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('ProductForm')} hitSlop={10} style={{ marginEnd: 16 }} accessibilityLabel={tp('Add product')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>
      ),
    })
  }, [navigation])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data || []).filter((p) => !q || `${p.name} ${p.productID} ${p.category}`.toLowerCase().includes(q))
  }, [data, query])

  function confirmDelete(p) {
    Alert.alert(tp('Delete product?'), `"${p.name}" ${tp('will be removed from the catalog.')}`, [
      { text: tp('Cancel'), style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionError(null)
          try {
            await api.delete(`/api/admin/products/${encodeURIComponent(p.productID)}`)
            setData((list) => list.filter((x) => x.productID !== p.productID))
            setMessage(`Deleted ${p.name}.`)
          } catch (e) {
            setActionError(formatApiError(e))
          }
        },
      },
    ])
  }

  if (loading) return <Loading label={tp('Loading products…')} />

  return (
    <FlatList
      data={rows}
      keyExtractor={(p) => p.productID}
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshing={refreshing}
      onRefresh={refresh}
      ListHeaderComponent={
        <View>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={tp('Search products')}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
          </View>
          <ErrorBox message={error} onRetry={reload} />
          <ErrorBox message={actionError} />
          <InfoBox tone="success" message={message} />
        </View>
      }
      ListEmptyComponent={!error ? <Empty icon="pricetags-outline" title={tp('No products')} /> : null}
      renderItem={({ item: p }) => (
        <Card style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }} onPress={() => navigation.navigate('ProductForm', { product: p })}>
          <Image source={productImageSource(p)} style={styles.thumb} />
          <View style={{ flex: 1, marginStart: 12 }}>
            <Text style={styles.name} numberOfLines={2}>
              {p.name}
            </Text>
            <Text style={styles.soft}>
              {p.category} · {p.productID}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontWeight: '800', color: colors.text }}>{format(p.price)}</Text>
              <Text style={{ fontWeight: '700', color: p.stockLevel <= 10 ? colors.warning : colors.success }}>{tp('Stock')} {p.stockLevel}</Text>
            </View>
          </View>
          <Pressable onPress={() => confirmDelete(p)} hitSlop={10} style={{ marginStart: 10 }} accessibilityLabel={`Delete ${p.name}`}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </Card>
      )}
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
  searchInput: { flex: 1, minHeight: 44, marginStart: 8, fontSize: 15, color: colors.text },
  thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#F4F0E8' },
  name: { fontWeight: '700', color: colors.text },
  soft: { color: colors.textSoft, fontSize: 12, marginTop: 2 },
})
