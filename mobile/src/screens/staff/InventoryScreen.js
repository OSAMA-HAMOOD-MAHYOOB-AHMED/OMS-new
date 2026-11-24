import { Ionicons } from '@expo/vector-icons'
import { useMemo, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { Button, Card, Empty, ErrorBox, InfoBox, Input, Loading } from '../../components/ui'
import { colors, radius } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { formatDate } from '../../utils/format'

export default function InventoryScreen({ navigation }) {
  const { data, error, loading, refreshing, refresh, reload } = useApi('/api/inventory', { initial: [] })
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState(null)

  // Modal state: { mode: 'receive' | 'checkup', row }
  const [modal, setModal] = useState(null)
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data || []).filter((r) => !q || `${r.productName} ${r.productID} ${r.location}`.toLowerCase().includes(q))
  }, [data, query])

  function openModal(mode, row) {
    setModal({ mode, row })
    setQty('')
    setNote('')
    setModalError(null)
    setMessage(null)
  }

  async function submit() {
    const { mode, row } = modal
    setModalError(null)
    if (mode === 'receive') {
      const n = Number(qty)
      if (!Number.isInteger(n) || n <= 0) {
        setModalError('Enter a whole number greater than 0.')
        return
      }
    }
    setSaving(true)
    try {
      if (mode === 'receive') {
        await api.post('/api/inventory/receive', { productID: row.productID, quantity: Number(qty), note: note.trim() || null })
        setMessage(`Received ${qty} × ${row.productName}.`)
      } else {
        await api.post('/api/inventory/checkup', { inventoryID: row.inventoryID, note: note.trim() || null })
        setMessage(`Stock check recorded for ${row.productName}.`)
      }
      setModal(null)
      reload()
    } catch (e) {
      setModalError(formatApiError(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading label="Loading inventory…" />

  const header = (
    <View>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search product or location"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>
      <ErrorBox message={error} onRetry={reload} />
      <InfoBox tone="success" message={message} />
    </View>
  )

  return (
    <>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.inventoryID}
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={header}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={!error ? <Empty icon="cube-outline" title="No inventory records" /> : null}
        renderItem={({ item: r }) => {
          const low = r.quantityAvailable <= 10
          return (
            <Card style={{ padding: 14 }}>
              <Text style={styles.name} numberOfLines={2}>
                {r.productName}
              </Text>
              <Text style={styles.soft}>
                {r.productID} · {r.location}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, low && { color: r.quantityAvailable === 0 ? colors.danger : colors.warning }]}>
                    {r.quantityAvailable}
                  </Text>
                  <Text style={styles.statLabel}>Available</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{r.quantityReserved}</Text>
                  <Text style={styles.statLabel}>Reserved</Text>
                </View>
                <View style={[styles.stat, { flex: 1.6 }]}>
                  <Text style={[styles.statValue, { fontSize: 13 }]}>{r.lastCheckupDate ? formatDate(r.lastCheckupDate) : 'Never'}</Text>
                  <Text style={styles.statLabel}>Last check</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button title="Receive" icon="add-circle-outline" small style={{ flex: 1 }} onPress={() => openModal('receive', r)} />
                <Button title="Check" icon="clipboard-outline" small variant="secondary" style={{ flex: 1 }} onPress={() => openModal('checkup', r)} />
                <Button
                  title="History"
                  icon="time-outline"
                  small
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={() => navigation.navigate('InventoryAudit', { inventoryID: r.inventoryID, productName: r.productName })}
                />
              </View>
            </Card>
          )
        }}
      />

      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={{ flex: 1 }} onPress={() => setModal(null)} />
          {modal ? (
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>{modal.mode === 'receive' ? 'Receive stock' : 'Record stock check'}</Text>
              <Text style={[styles.soft, { marginBottom: 16 }]}>{modal.row.productName}</Text>
              <ErrorBox message={modalError} />
              {modal.mode === 'receive' ? (
                <Input label="Quantity received" value={qty} onChangeText={(v) => setQty(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="e.g. 25" autoFocus />
              ) : (
                <Text style={[styles.soft, { marginBottom: 12 }]}>
                  Confirms a physical count matches the system ({modal.row.quantityAvailable} available).
                </Text>
              )}
              <Input label="Note (optional)" value={note} onChangeText={setNote} placeholder="Supplier, batch, remarks…" autoCapitalize="sentences" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setModal(null)} />
                <Button title="Save" style={{ flex: 1 }} onPress={submit} loading={saving} />
              </View>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  name: { fontWeight: '800', color: colors.text, fontSize: 15 },
  soft: { color: colors.textSoft, marginTop: 2, fontSize: 13 },
  statsRow: { flexDirection: 'row', marginTop: 12, backgroundColor: colors.bg, borderRadius: radius.sm, padding: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSoft, marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
})
