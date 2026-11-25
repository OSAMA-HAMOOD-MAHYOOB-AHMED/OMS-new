import {
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo'
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic'
import { NavigationContainer } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { StatusBar } from 'expo-status-bar'
import { useRef } from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import { CurrencyProvider } from './src/context/CurrencyContext'
import { LanguageProvider, useI18n } from './src/i18n'
import RootNavigator from './src/navigation/RootNavigator'
import { colors, fonts } from './src/theme'

const navTheme = {
  dark: false,
  colors: {
    primary: colors.ink,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.gold,
  },
  fonts: {
    regular: { fontFamily: fonts.regular, fontWeight: 'normal' },
    medium: { fontFamily: fonts.medium, fontWeight: 'normal' },
    bold: { fontFamily: fonts.heading, fontWeight: 'normal' },
    heavy: { fontFamily: fonts.headingHeavy, fontWeight: 'normal' },
  },
}

// Applies the reading direction to everything below it (Arabic = right to left).
function Directional({ children }) {
  const { isRtl, ready } = useI18n()
  if (!ready) return null
  return <View style={{ flex: 1, direction: isRtl ? 'rtl' : 'ltr' }}>{children}</View>
}

// Remounts the screens when the language changes (so every label is redrawn) while keeping
// the user on the same screen by restoring the saved navigation state.
function Navigation() {
  const { lang } = useI18n()
  const navState = useRef(undefined)
  return (
    <NavigationContainer
      key={lang}
      theme={navTheme}
      initialState={navState.current}
      onStateChange={(state) => {
        navState.current = state
      }}
    >
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_700Bold,
    Cairo_800ExtraBold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  })

  // Keep the splash screen until fonts are ready (fall back to system fonts on error).
  if (!fontsLoaded && !fontError) return null

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <Directional>
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>
                <Navigation />
              </CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </Directional>
      </LanguageProvider>
    </SafeAreaProvider>
  )
}
