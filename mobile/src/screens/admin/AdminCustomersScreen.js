import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { FlatList, Linking, StyleSheet, Text, TextInput, View } from 'react-native'
import { useApi } from '../../api/useApi'
import { Card, Empty, ErrorBox, Loading } from '../../components/ui'
import { colors, radius } from '../../theme'
import { tp } from '../../i18n'

export default function AdminCustomersScreen() {
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/admin/customers', { initial: [] })
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data || []).filter((u) => {
      if (q && !`${u.name} ${u.email} ${u.phoneNumber}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, query])

  if (loading) return <Loading />

  return (
    <FlatList
      data={rows}
      keyExtractor={(u) => u.email}
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
              placeholder={tp('Search name, email or phone')}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>
          <ErrorBox message={error} onRetry={reload} />
          <Text style={{ color: colors.textSoft, marginBottom: 8, fontSize: 13 }}>{rows.length} customer{rows.length === 1 ? '' : 's'}</Text>
        </View>
      }
      ListEmptyComponent={!error ? <Empty icon="people-outline" title={tp('No customers found')} /> : null}
      renderItem={({ item: u }) => (
        <Card style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.name} numberOfLines={1}>
              {u.name}
            </Text>
            <View style={styles.role}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryDark }}>{u.role}</Text>
            </View>
          </View>
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${u.email}`)}>
            {u.email}
          </Text>
          {u.phoneNumber ? (
            <Text style={styles.link} onPress={() => Linking.openURL(`tel:${u.phoneNumber}`)}>
              {u.phoneNumber}
            </Text>
          ) : null}
          {u.address ? <Text style={styles.soft}>{u.address}</Text> : null}
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
  name: { fontWeight: '800', color: colors.text, fontSize: 15, flex: 1, marginEnd: 8 },
  role: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  link: { color: colors.primary, marginTop: 4 },
  soft: { color: colors.textSoft, marginTop: 4, fontSize: 13 },
})
