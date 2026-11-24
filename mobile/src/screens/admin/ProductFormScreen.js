import { useLayoutEffect, useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Text } from 'react-native'
import { api } from '../../api/client'
import { Button, Card, ErrorBox, Input, Screen } from '../../components/ui'
import { colors, radius } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { productImageSource } from '../../utils/images'

// Create or edit a product. The API upserts by productID.
export default function ProductFormScreen({ navigation, route }) {
  const existing = route.params?.product
  const isEdit = !!existing
  const [f, setF] = useState({
    productID: existing?.productID || '',
    name: existing?.name || '',
    category: existing?.category || '',
    price: existing ? String(existing.price) : '',
    stockLevel: existing ? String(existing.stockLevel) : '',
    description: existing?.description || '',
    imageUrl: existing?.imageUrl || '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit product' : 'New product' })
  }, [navigation, isEdit])

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }))

  async function save() {
    const errs = {}
    if (!f.productID.trim()) errs.productID = 'Product ID is required.'
    if (!f.name.trim()) errs.name = 'Name is required.'
    if (!f.category.trim()) errs.category = 'Category is required.'
    const price = Number(f.price)
    if (!f.price || Number.isNaN(price) || price < 0) errs.price = 'Enter a valid price.'
    const stock = Number(f.stockLevel)
    if (f.stockLevel === '' || !Number.isInteger(stock) || stock < 0) errs.stockLevel = 'Enter a whole number (0 or more).'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    setError(null)
    try {
      await api.post('/api/admin/products', {
        productID: f.productID.trim(),
        name: f.name.trim(),
        category: f.category.trim(),
        price,
        stockLevel: stock,
        description: f.description.trim() || null,
        imageUrl: f.imageUrl.trim() || null,
      })
      navigation.goBack()
    } catch (e) {
      setError(formatApiError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Image
          source={productImageSource({ imageUrl: f.imageUrl, category: f.category })}
          style={{ width: '100%', aspectRatio: 2, borderRadius: radius.md, backgroundColor: '#eef2f7', marginBottom: 16 }}
          resizeMode="cover"
        />
        <Card>
          <ErrorBox message={error} />
          <Input
            label="Product ID"
            value={f.productID}
            onChangeText={set('productID')}
            autoCapitalize="characters"
            editable={!isEdit}
            placeholder="e.g. CHG-010"
            error={errors.productID}
          />
          {isEdit ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: -8, marginBottom: 12 }}>Product ID can't be changed.</Text> : null}
          <Input label="Name" value={f.name} onChangeText={set('name')} autoCapitalize="words" error={errors.name} />
          <Input label="Category" value={f.category} onChangeText={set('category')} autoCapitalize="words" placeholder="Charger, Earphones, Power Bank, Phone Case" error={errors.category} />
          <Input label="Price (USD)" value={f.price} onChangeText={set('price')} keyboardType="decimal-pad" error={errors.price} />
          <Input label="Stock level" value={f.stockLevel} onChangeText={set('stockLevel')} keyboardType="number-pad" error={errors.stockLevel} />
          <Input label="Description" value={f.description} onChangeText={set('description')} multiline autoCapitalize="sentences" />
          <Input label="Image URL" value={f.imageUrl} onChangeText={set('imageUrl')} keyboardType="url" placeholder="https://…" />
          <Button title={isEdit ? 'Save changes' : 'Create product'} onPress={save} loading={saving} />
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  )
}
