import { Ionicons } from '@expo/vector-icons'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useApi } from '../api/useApi'
import { tp, useI18n } from '../i18n'
import { colors, fonts } from '../theme'
import { Card, SectionTitle } from './ui'

/** Store contact details the admin sets in "Store settings" on the website. Hidden when empty. */
export default function ContactCard() {
  const { lang } = useI18n()
  const { data: s } = useApi('/api/settings', { initial: {} })
  if (!s) return null
  const pick = (key) => (lang === 'ar' ? s[`${key}Ar`] || s[`${key}En`] : s[`${key}En`] || s[`${key}Ar`]) || ''

  const rows = [
    s.whatsapp && { icon: 'logo-whatsapp', color: '#1F9E55', label: 'WhatsApp', value: `+${s.whatsapp}`, url: `https://wa.me/${s.whatsapp}` },
    s.phone && { icon: 'call-outline', label: tp('Phone'), value: s.phone, url: `tel:${String(s.phone).replace(/\s+/g, '')}` },
    s.email && { icon: 'mail-outline', label: tp('Email'), value: s.email, url: `mailto:${s.email}` },
    pick('address') && { icon: 'location-outline', label: tp('Our store'), value: pick('address'), url: s.mapUrl || null },
    pick('hours') && { icon: 'time-outline', label: tp('Opening hours'), value: pick('hours') },
  ].filter(Boolean)

  if (!rows.length) return null

  return (
    <>
      <SectionTitle>{tp('Contact us')}</SectionTitle>
      <Card>
        {rows.map((r, i) => (
          <Pressable
            key={r.label}
            disabled={!r.url}
            onPress={() => r.url && Linking.openURL(r.url).catch(() => {})}
            style={({ pressed }) => [styles.row, i > 0 && styles.border, pressed && { opacity: 0.7 }]}
            accessibilityRole={r.url ? 'link' : undefined}
          >
            <View style={styles.icon}>
              <Ionicons name={r.icon} size={20} color={r.color || colors.goldText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{r.label}</Text>
              <Text style={styles.value}>{/^[+\d]/.test(r.value) ? `‎${r.value}` : r.value}</Text>
            </View>
            {r.url ? <Ionicons name={lang === 'ar' ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} /> : null}
          </Pressable>
        ))}
      </Card>
    </>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSoft, textAlign: 'left' },
  value: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, textAlign: 'left' },
})
