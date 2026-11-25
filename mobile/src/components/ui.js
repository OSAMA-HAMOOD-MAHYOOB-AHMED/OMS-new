import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { tp, useI18n } from '../i18n'
import { colors, fonts, radius, shadow, spacing, statusColors } from '../theme'

export function Screen({ children, scroll = true, refreshing, onRefresh, contentStyle }) {
  if (!scroll) return <View style={[styles.screen, contentStyle]}>{children}</View>
  return (
    <ScrollView
      style={styles.screenBg}
      contentContainerStyle={[styles.screenContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[colors.primary]} /> : undefined
      }
    >
      {children}
    </ScrollView>
  )
}

export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, style]}>{children}</View>
}

export function Title({ children, style }) {
  return <Text style={[styles.title, style]}>{children}</Text>
}

export function Subtitle({ children, style }) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>
}

export function SectionTitle({ children, right }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{typeof children === 'string' ? tp(children.trim()) : children}</Text>
      {right}
    </View>
  )
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, small }) {
  const v = buttonVariants[variant] || buttonVariants.primary
  const isDisabled = disabled || loading
  const { isRtl } = useI18n()
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} style={{ marginEnd: 6 }} /> : null}
          {/* Explicit writing direction + one line: Android otherwise measures Arabic as LTR and drops the last word. */}
          <Text
            numberOfLines={1}
            style={[styles.buttonText, small && { fontSize: 14 }, { color: v.fg, writingDirection: isRtl ? 'rtl' : 'ltr' }]}
          >
            {tp(title)}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const buttonVariants = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
  danger: { bg: colors.danger, fg: '#fff', border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  success: { bg: colors.success, fg: '#fff', border: colors.success },
}

// `ltr` keeps numbers such as card numbers left to right even in Arabic.
export function Input({ label, error, secure, style, ltr, ...props }) {
  const [hidden, setHidden] = useState(!!secure)
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label ? <Text style={styles.label}>{tp(label)}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          props.editable === false && { backgroundColor: colors.bg },
          error && { borderColor: colors.danger },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            props.multiline && { minHeight: 80, textAlignVertical: 'top' },
            ltr && { textAlign: 'left', writingDirection: 'ltr', direction: 'ltr' },
          ]}
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityLabel="Toggle password visibility">
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSoft} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{tp(error)}</Text> : null}
    </View>
  )
}

export function Loading({ label }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={[styles.subtitle, { marginTop: 12 }]}>{tp(label)}</Text> : null}
    </View>
  )
}

export function ErrorBox({ message, onRetry }) {
  const { t } = useI18n()
  if (!message) return null
  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} style={{ marginEnd: 8, marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.danger, fontFamily: fonts.regular }}>{tp(message)}</Text>
        {onRetry ? (
          <Text onPress={onRetry} style={{ color: colors.danger, fontFamily: fonts.semibold, marginTop: 6 }}>
            {t('common.retry')}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

export function InfoBox({ message, tone = 'info' }) {
  if (!message) return null
  const tone_ = {
    info: { bg: colors.primarySoft, fg: colors.primaryDark, icon: 'information-circle' },
    success: { bg: colors.successSoft, fg: '#166534', icon: 'checkmark-circle' },
    warning: { bg: colors.warningSoft, fg: '#92400e', icon: 'warning' },
  }[tone]
  const t = tone_
  return (
    <View style={[styles.errorBox, { backgroundColor: t.bg, borderColor: 'transparent' }]}>
      <Ionicons name={t.icon} size={18} color={t.fg} style={{ marginEnd: 8, marginTop: 1 }} />
      <Text style={{ color: t.fg, flex: 1, fontFamily: fonts.regular }}>{tp(message)}</Text>
    </View>
  )
}

export function Empty({ icon = 'file-tray-outline', title, message, action }) {
  return (
    <View style={[styles.center, { paddingVertical: 48 }]}>
      <Ionicons name={icon} size={48} color={colors.muted} />
      <Text style={[styles.sectionTitle, { marginTop: 12, textAlign: 'center' }]}>{tp(title)}</Text>
      {message ? <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 4 }]}>{tp(message)}</Text> : null}
      {action ? <View style={{ marginTop: 16, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  )
}

export function StatusBadge({ status }) {
  const { statusLabel } = useI18n()
  const c = statusColors[status] || { bg: colors.border, fg: colors.textSoft }
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{status ? statusLabel(status) : '—'}</Text>
    </View>
  )
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {/* One line: Android sometimes measures Arabic a little short and would wrap the last word away. */}
      <Text style={[styles.chipText, active && { color: '#fff' }]} numberOfLines={1}>
        {tp(label)}
      </Text>
    </Pressable>
  )
}

export function StatCard({ icon, label, value, tint = colors.primary }) {
  return (
    <View style={[styles.card, styles.stat]}>
      <View style={[styles.statIcon, { backgroundColor: tint + '1a' }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{tp(label)}</Text>
    </View>
  )
}

// Android cuts off a trailing "(1)" after Arabic words; an end RTL mark keeps it inside the box.
function withRtlMark(text) {
  return typeof text === 'string' && /[\u0600-\u06FF]/.test(text) ? text + '\u200F' : text
}

export function Row({ label, value, bold }) {
  // Keep a leading "+" (phone numbers) in place when the layout is right to left.
  const shown = typeof value === 'string' && /^[+\-\d]/.test(value) ? '\u200E' + value : value
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{withRtlMark(tp(label))}</Text>
      <Text style={[styles.kvValue, bold && { fontFamily: fonts.bold }]} selectable>
        {shown}
      </Text>
    </View>
  )
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenBg: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow,
  },
  title: { fontSize: 24, fontFamily: fonts.headingHeavy, color: colors.text },
  subtitle: { fontSize: 14, fontFamily: fonts.regular, color: colors.textSoft },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontFamily: fonts.heading, color: colors.text },
  button: {
    minHeight: 50,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonSmall: { minHeight: 38, paddingHorizontal: spacing.md },
  buttonInner: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { fontSize: 15, fontFamily: fonts.semibold },
  label: { fontSize: 13, fontFamily: fonts.semibold, color: colors.text, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, minHeight: 48, fontSize: 15, fontFamily: fonts.regular, color: colors.text, paddingVertical: 10 },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  errorBox: {
    flexDirection: 'row',
    backgroundColor: colors.dangerSoft,
    borderColor: '#F3C9BF',
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontFamily: fonts.semibold },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.sand2,
    borderWidth: 1,
    borderColor: colors.sand2,
    marginEnd: 8,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  stat: { flex: 1, marginHorizontal: 4, padding: spacing.md },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontFamily: fonts.headingHeavy, color: colors.text },
  statLabel: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSoft, marginTop: 2 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  kvLabel: { color: colors.textSoft, fontSize: 14, fontFamily: fonts.regular, marginEnd: 12, flexShrink: 1, textAlign: 'left' },
  kvValue: { color: colors.text, fontSize: 14, fontFamily: fonts.semibold, flexShrink: 0, maxWidth: '65%' },
})
