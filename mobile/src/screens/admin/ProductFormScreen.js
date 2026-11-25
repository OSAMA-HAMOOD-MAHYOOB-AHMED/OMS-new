import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useLayoutEffect, useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useCategories } from '../../api/categories'
import { api, authHeader } from '../../api/client'
import { Button, Card, Chip, ErrorBox, InfoBox, Input, Screen } from '../../components/ui'
import { API_URL } from '../../config'
import { colors, fonts, radius } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { productImageSource } from '../../utils/images'
import { tp } from '../../i18n'

const MAX_BYTES = 5 * 1024 * 1024

// Sends the photo as multipart "file" to POST /api/admin/products/{id}/image.
// Uses XMLHttpRequest because Expo's fetch does not accept React Native's { uri, name, type } file parts.
function uploadPhoto(productID, asset) {
  const body = new FormData()
  body.append('file', {
    uri: asset.uri,
    name: asset.fileName || 'product.jpg',
    type: asset.mimeType || 'image/jpeg',
  })
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/api/admin/products/${encodeURIComponent(productID)}/image`)
    const auth = authHeader()
    if (auth.Authorization) xhr.setRequestHeader('Authorization', auth.Authorization)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.timeout = 90_000
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).imageUrl)
        } catch {
          resolve(null)
        }
      } else {
        reject(new Error(xhr.responseText || `Upload failed (${xhr.status}).`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error while uploading the photo.'))
    xhr.ontimeout = () => reject(new Error('The upload took too long. Try again.'))
    xhr.send(body)
  })
}

// Create or edit a product. The API upserts by productID; the photo is uploaded after saving.
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
  const [photo, setPhoto] = useState(null) // picked but not uploaded yet
  const { data: categories } = useCategories()
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useLayoutEffect(() => {
    navigation.setOptions({ title: tp(isEdit ? 'Edit product' : 'New product') })
  }, [navigation, isEdit])

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }))

  async function pickPhoto() {
    setError(null)
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      setError('Allow photo access to add a product photo.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    })
    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]
    const type = asset.mimeType || 'image/jpeg'
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      setError('Only JPEG, PNG or WebP photos are allowed.')
      return
    }
    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      setError('The photo is too large. The maximum size is 5 MB.')
      return
    }
    setPhoto(asset)
  }

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
    const productID = f.productID.trim()
    try {
      await api.post('/api/admin/products', {
        productID,
        name: f.name.trim(),
        category: f.category.trim(),
        price,
        stockLevel: stock,
        description: f.description.trim() || null,
        imageUrl: f.imageUrl.trim() || null,
      })
    } catch (e) {
      setError(formatApiError(e))
      setSaving(false)
      return
    }

    if (photo) {
      try {
        const url = await uploadPhoto(productID, photo)
        setF((x) => ({ ...x, imageUrl: url || x.imageUrl }))
        setPhoto(null)
      } catch (e) {
        setError(`Product saved, but the photo upload failed: ${e.message}`)
        setSaving(false)
        return
      }
    }
    setSaving(false)
    navigation.goBack()
  }

  const preview = photo ? { uri: photo.uri } : productImageSource({ imageUrl: f.imageUrl, category: f.category })

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Pressable onPress={pickPhoto} style={styles.photoBox} accessibilityRole="button" accessibilityLabel={tp('Choose product photo')}>
          {photo || f.imageUrl ? (
            <Image source={preview} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoEmpty}>
              <Ionicons name="image-outline" size={38} color={colors.muted} />
              <Text style={styles.photoEmptyText}>{tp('Tap to add a photo')}</Text>
            </View>
          )}
          <View style={styles.photoBadge}>
            <Ionicons name="camera-outline" size={16} color={colors.ink} />
            <Text style={styles.photoBadgeText}>{tp(photo || f.imageUrl ? 'Change photo' : 'Upload photo')}</Text>
          </View>
        </Pressable>
        {photo ? <InfoBox tone="info" message={tp('The new photo will be uploaded when you save.')} /> : null}

        <Card>
          <ErrorBox message={error} />
          <Input
            label={tp('Product ID')}
            value={f.productID}
            onChangeText={set('productID')}
            autoCapitalize="characters"
            editable={!isEdit}
            placeholder={tp('e.g. CHG-010')}
            error={errors.productID}
          />
          {isEdit ? <Text style={{ color: colors.muted, fontSize: 12, marginTop: -8, marginBottom: 12 }}>{tp('Product ID can\'t be changed.')}</Text> : null}
          <Input label={tp('Name')} value={f.name} onChangeText={set('name')} autoCapitalize="words" error={errors.name} />
          {(categories || []).length ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.fieldLabel}>{tp('Category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((c) => (
                  <Chip key={c.name} label={c.nameAr ? `${c.name} · ${c.nameAr}` : c.name} active={f.category === c.name} onPress={() => set('category')(c.name)} />
                ))}
              </ScrollView>
            </View>
          ) : null}
          <Input
            label={(categories || []).length ? tp('Or type a new category') : tp('Category')}
            value={f.category}
            onChangeText={set('category')}
            autoCapitalize="words"
            placeholder={tp('Charger, Earphones, Power Bank, Phone Case')}
            error={errors.category}
          />
          <Input label={tp('Price (USD)')} value={f.price} onChangeText={set('price')} keyboardType="decimal-pad" error={errors.price} />
          <Input label={tp('Stock level')} value={f.stockLevel} onChangeText={set('stockLevel')} keyboardType="number-pad" error={errors.stockLevel} />
          <Input label={tp('Description')} value={f.description} onChangeText={set('description')} multiline autoCapitalize="sentences" />
          <Button title={isEdit ? 'Save changes' : 'Create product'} onPress={save} loading={saving} />
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  photoBox: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: radius.lg,
    backgroundColor: colors.sand2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    marginBottom: 12,
  },
  photo: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoEmptyText: { color: colors.textSoft, fontFamily: fonts.medium, fontSize: 14 },
  photoBadge: {
    position: 'absolute',
    bottom: 10,
    end: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  photoBadgeText: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 13 },
  fieldLabel: { fontSize: 13, fontFamily: fonts.semibold, color: colors.text, marginBottom: 8 },
})
