import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { Button, Card, ErrorBox, InfoBox, Input, Loading, Row, Screen, SectionTitle } from '../../components/ui'
import ContactCard from '../../components/ContactCard'
import { API_URL } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useI18n, tp } from '../../i18n'
import { colors } from '../../theme'
import { formatApiError } from '../../utils/apiError'
import { formatDate } from '../../utils/format'
import { validateAddress, validateName, validatePassword, validatePhone } from '../../utils/validation'

export default function ProfileScreen() {
  const { logout, role } = useAuth()
  const { t, lang, setLanguage } = useI18n()
  const { data: profile, error, loading, refreshing, refresh, reload, setData } = useApi('/api/profile')

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phoneNumber: '', address: '' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [actionError, setActionError] = useState(null)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwOpen, setPwOpen] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  const [avatarBusy, setAvatarBusy] = useState(false)

  useEffect(() => {
    if (profile && !editing) setForm({ name: profile.name, phoneNumber: profile.phoneNumber, address: profile.address })
  }, [profile, editing])

  async function saveProfile() {
    const errs = Object.fromEntries(
      Object.entries({
        name: validateName(form.name),
        phoneNumber: validatePhone(form.phoneNumber),
        address: validateAddress(form.address),
      }).filter(([, v]) => v),
    )
    setFormErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    setActionError(null)
    try {
      const body = { name: form.name.trim(), phoneNumber: form.phoneNumber.trim(), address: form.address.trim() }
      await api.put('/api/profile', body)
      setData({ ...profile, ...body })
      setEditing(false)
      setMessage('Profile updated.')
    } catch (e) {
      setActionError(formatApiError(e))
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    const errs = {}
    if (!pw.current) errs.current = 'Enter your current password.'
    const nextErr = validatePassword(pw.next)
    if (nextErr) errs.next = nextErr
    if (pw.next !== pw.confirm) errs.confirm = 'Passwords do not match.'
    setPwErrors(errs)
    if (Object.keys(errs).length) return
    setPwSaving(true)
    setActionError(null)
    try {
      await api.post('/api/profile/password', { currentPassword: pw.current, newPassword: pw.next })
      setPw({ current: '', next: '', confirm: '' })
      setPwOpen(false)
      setMessage('Password changed.')
    } catch (e) {
      setActionError(formatApiError(e))
    } finally {
      setPwSaving(false)
    }
  }

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      setActionError('Allow photo access to change your profile picture.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    })
    if (result.canceled || !result.assets?.[0]?.base64) return
    const asset = result.assets[0]
    const dataUrl = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
    if (dataUrl.length > 2_000_000) {
      setActionError('Image too large. Please choose a smaller picture.')
      return
    }
    setAvatarBusy(true)
    setActionError(null)
    try {
      await api.put('/api/profile/avatar', { avatarUrl: dataUrl })
      setData({ ...profile, avatarUrl: dataUrl })
      setMessage('Profile picture updated.')
    } catch (e) {
      setActionError(formatApiError(e))
    } finally {
      setAvatarBusy(false)
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true)
    try {
      await api.delete('/api/profile/avatar')
      setData({ ...profile, avatarUrl: null })
    } catch (e) {
      setActionError(formatApiError(e))
    } finally {
      setAvatarBusy(false)
    }
  }

  function confirmLogout() {
    Alert.alert(tp('Sign out?'), tp('You will need to sign in again.'), [
      { text: tp('Cancel'), style: 'cancel' },
      { text: tp('Sign out'), style: 'destructive', onPress: logout },
    ])
  }

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePw, setDeletePw] = useState('')
  const [deleting, setDeleting] = useState(false)

  function deleteAccount() {
    setMessage(null)
    setDeleteOpen(true)
  }

  async function doDelete(password) {
    setDeleting(true)
    setActionError(null)
    try {
      await api.post('/api/profile/delete', { password })
      logout()
    } catch (e) {
      setActionError(formatApiError(e))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loading />
  if (!profile) return <Screen><ErrorBox message={error || 'Could not load your profile.'} onRetry={reload} /></Screen>

  const initials = String(profile.name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Pressable onPress={pickAvatar} disabled={avatarBusy} accessibilityLabel={tp('Change profile picture')}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={{ fontSize: 30, fontWeight: '800', color: colors.primary }}>{initials}</Text>
            </View>
          )}
          <View style={styles.camera}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </Pressable>
        {profile.avatarUrl ? (
          <Text onPress={removeAvatar} style={{ color: colors.textSoft, fontSize: 12, marginTop: 6 }}>{tp('Remove picture')}</Text>
        ) : null}
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={{ color: colors.textSoft }}>{profile.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={{ color: colors.primaryDark, fontWeight: '700', fontSize: 12 }}>{tp(role)}</Text>
        </View>
      </View>

      <InfoBox tone="success" message={message} />
      <ErrorBox message={actionError} />

      <SectionTitle
        right={
          !editing ? (
            <Text style={styles.link} onPress={() => { setEditing(true); setMessage(null) }}>
              {tp('Edit')}
            </Text>
          ) : null
        }
      >
        Account details
      </SectionTitle>
      <Card>
        {editing ? (
          <>
            <Input label={tp('Full name')} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} autoCapitalize="words" error={formErrors.name} />
            <Input label={tp('Phone')} value={form.phoneNumber} onChangeText={(v) => setForm((f) => ({ ...f, phoneNumber: v }))} keyboardType="phone-pad" error={formErrors.phoneNumber} />
            <Input label={tp('Address')} value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} multiline autoCapitalize="sentences" error={formErrors.address} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title={tp('Cancel')} variant="secondary" style={{ flex: 1 }} onPress={() => { setEditing(false); setFormErrors({}) }} />
              <Button title={tp('Save')} style={{ flex: 1 }} onPress={saveProfile} loading={saving} />
            </View>
          </>
        ) : (
          <>
            <Row label={tp('Phone')} value={profile.phoneNumber} />
            <Row label={tp('Address')} value={profile.address} />
            <Row label={tp('Email verified')} value={tp(profile.emailVerified ? 'Yes' : 'No')} />
            <Row label={tp('Member since')} value={formatDate(profile.createdAt)} />
          </>
        )}
      </Card>

      <SectionTitle>{t('profile.language')}</SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title={t('profile.arabic')}
            variant={lang === 'ar' ? 'primary' : 'secondary'}
            style={{ flex: 1 }}
            onPress={() => setLanguage('ar')}
          />
          <Button
            title={t('profile.english')}
            variant={lang === 'en' ? 'primary' : 'secondary'}
            style={{ flex: 1 }}
            onPress={() => setLanguage('en')}
          />
        </View>
      </Card>

      <ContactCard />

      <SectionTitle>Security</SectionTitle>
      <Card>
        {pwOpen ? (
          <>
            <Input label={tp('Current password')} value={pw.current} onChangeText={(v) => setPw((p) => ({ ...p, current: v }))} secure error={pwErrors.current} />
            <Input label={tp('New password')} value={pw.next} onChangeText={(v) => setPw((p) => ({ ...p, next: v }))} secure error={pwErrors.next} />
            <Input label={tp('Confirm new password')} value={pw.confirm} onChangeText={(v) => setPw((p) => ({ ...p, confirm: v }))} secure error={pwErrors.confirm} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title={tp('Cancel')} variant="secondary" style={{ flex: 1 }} onPress={() => { setPwOpen(false); setPwErrors({}) }} />
              <Button title={tp('Update')} style={{ flex: 1 }} onPress={changePassword} loading={pwSaving} />
            </View>
          </>
        ) : (
          <Button title={tp('Change password')} icon="key-outline" variant="secondary" onPress={() => { setPwOpen(true); setMessage(null) }} />
        )}
      </Card>

      <Button title={tp('Sign out')} icon="log-out-outline" variant="secondary" onPress={confirmLogout} />

      <View style={{ marginTop: 24 }}>
        {deleteOpen ? (
          <Card style={{ borderColor: '#fecaca' }}>
            <Text style={{ color: colors.danger, fontWeight: '700', marginBottom: 8 }}>{tp('Delete account permanently')}</Text>
            <Text style={{ color: colors.textSoft, marginBottom: 12 }}>{tp('This cannot be undone. Enter your password to confirm.')}</Text>
            <Input label={tp('Password')} value={deletePw} onChangeText={setDeletePw} secure />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title={tp('Cancel')} variant="secondary" style={{ flex: 1 }} onPress={() => { setDeleteOpen(false); setDeletePw('') }} />
              <Button title={tp('Delete')} variant="danger" style={{ flex: 1 }} onPress={() => doDelete(deletePw)} loading={deleting} disabled={!deletePw} />
            </View>
          </Card>
        ) : (
          <Text style={styles.danger} onPress={deleteAccount}>{tp('Delete my account')}</Text>
        )}
      </View>

      <Text style={styles.footer}>Server: {API_URL}</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 10 },
  roleBadge: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  link: { color: colors.primary, fontWeight: '700' },
  danger: { color: colors.danger, textAlign: 'center', fontWeight: '600' },
  footer: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 24 },
})
