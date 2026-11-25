import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tp, useI18n } from '../i18n'
import { colors, fonts } from '../theme'

/**
 * Header for stack screens. The built-in native header always puts the back arrow and title on
 * the left; this one is drawn in JS, so in Arabic the back arrow and title sit on the right.
 */
export default function AppHeader({ navigation, options, route, back }) {
  const insets = useSafeAreaInsets()
  const { lang } = useI18n()
  const title = typeof options.title === 'string' ? options.title : route.name
  const showBack = !!back && options.headerBackVisible !== false

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={navigation.goBack}
            hitSlop={10}
            style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={tp('Back')}
          >
            <Ionicons name={lang === 'ar' ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.ink} />
          </Pressable>
        ) : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {options.headerRight ? options.headerRight({ tintColor: colors.ink }) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surface },
  row: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.text,
    textAlign: 'left',
    marginStart: 4,
  },
})
