import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { tp, useI18n } from '../../i18n'
import { colors, fonts, radius } from '../../theme'

const MAX_LENGTH = 1000
const SUGGESTIONS = ['Which power banks are in stock?', 'How do I track my order?', 'Can I pay cash on delivery?']
const WELCOME =
  'Hi! I am your shopping assistant. Ask me about our chargers, power banks, earphones or phone cases, or how to order.'

// The conversation survives leaving and reopening the screen, but not a different sign-in.
const store = { owner: null, messages: [], history: [] }

function ownerOf(user) {
  return user?.email || user?.userId || user?.id || 'guest'
}

export default function ChatScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { inputAlign, lang } = useI18n()
  const listRef = useRef(null)

  const owner = ownerOf(user)
  if (store.owner !== owner) {
    store.owner = owner
    store.messages = []
    store.history = []
  }

  const [messages, setMessages] = useState(store.messages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const { overlap: keyboardOverlap, onLayout } = useKeyboardOverlap()
  const keyboardOpen = keyboardOverlap > 0

  useEffect(() => {
    store.messages = messages
  }, [messages])

  function scrollToEnd() {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
  }

  async function send(textArg) {
    const text = String(textArg ?? input)
      .trim()
      .slice(0, MAX_LENGTH)
    if (!text || sending) return
    setInput('')
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', content: text }])
    setSending(true)
    scrollToEnd()
    try {
      const { data } = await api.post('/api/chat', {
        message: text,
        history: store.history,
      })
      const reply = String(data?.reply || '')
      store.history = [...store.history, { role: 'user', content: text }, { role: 'assistant', content: reply }].slice(
        -20,
      )
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: 'assistant', content: reply }])
    } catch (e) {
      const serverError = e?.response?.data?.error
      const msg = serverError || "Sorry, I'm having trouble connecting right now. Please try again in a moment."
      setMessages((m) => [
        ...m,
        {
          id: `e${Date.now()}`,
          role: 'assistant',
          content: tp(msg),
          error: true,
        },
      ])
    } finally {
      setSending(false)
      scrollToEnd()
    }
  }

  function newChat() {
    store.history = []
    setMessages([])
  }

  const welcome = { id: 'welcome', role: 'assistant', content: tp(WELCOME) }
  const data = [welcome, ...messages]
  const canSend = input.trim().length > 0 && !sending

  return (
    <View onLayout={onLayout} style={[styles.root, { paddingBottom: keyboardOverlap }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={tp('Back')}
        >
          <Ionicons name={lang === 'ar' ? 'arrow-forward' : 'arrow-back'} size={20} color="#fff" />
        </Pressable>
        <View style={styles.avatar}>
          <Ionicons name="chatbubbles" size={20} color={colors.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {tp('Store Assistant')}
          </Text>
          <View style={styles.subRow}>
            <View style={styles.online} />
            <Text style={styles.sub} numberOfLines={1}>
              {tp('Usually replies in seconds')}
            </Text>
          </View>
        </View>
        {messages.length > 0 ? (
          <Pressable
            onPress={newChat}
            hitSlop={10}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel={tp('New chat')}
          >
            <Ionicons name="refresh" size={19} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => <Bubble message={item} />}
          ListFooterComponent={
            <>
              {messages.length === 0 ? (
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => send(tp(s))}
                      style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: colors.gold }]}
                    >
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {tp(s)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {sending ? <Typing /> : null}
            </>
          }
        />

        <View style={[styles.inputRow, { paddingBottom: keyboardOpen ? 10 : Math.max(insets.bottom, 10) }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={tp('Ask about our products...')}
            placeholderTextColor={colors.muted}
            style={[styles.input, { textAlign: inputAlign }]}
            multiline
            maxLength={MAX_LENGTH}
            accessibilityLabel={tp('Ask about our products...')}
          />
          <Pressable
            onPress={() => send()}
            disabled={!canSend}
            style={({ pressed }) => [styles.sendBtn, !canSend && { opacity: 0.45 }, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={tp('Send')}
          >
            {sending ? (
              <ActivityIndicator color={colors.ink} size="small" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={colors.ink}
                style={lang === 'ar' && { transform: [{ scaleX: -1 }] }}
              />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  )
}

/**
 * How much of the screen's bottom the keyboard covers. Some Android setups shrink the window when
 * the keyboard opens and some (edge-to-edge) do not, so whatever the window already gave up is
 * subtracted from the keyboard height.
 */
function useKeyboardOverlap() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [height, setHeight] = useState(0)
  const baseHeight = useRef(0)
  useEffect(() => {
    // endCoordinates.height leaves out the navigation bar strip the keyboard also covers, so use
    // the distance from the keyboard's top edge to the bottom of the screen instead.
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(Math.max(e.endCoordinates.height, Dimensions.get('screen').height - e.endCoordinates.screenY)),
    )
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])
  const onLayout = (e) => {
    const h = e.nativeEvent.layout.height
    if (keyboardHeight === 0) baseHeight.current = h
    setHeight(h)
  }
  const shrunk = Math.max(0, baseHeight.current - height)
  return { overlap: keyboardHeight ? Math.max(0, Math.round(keyboardHeight - shrunk)) : 0, onLayout }
}

// Each message reads in its own script's direction, whatever language the app is in.
function isRtlText(text) {
  const m = String(text).match(/[A-Za-z֐-ࣿ]/)
  return !!m && !/[A-Za-z]/.test(m[0])
}

function Bubble({ message }) {
  const mine = message.role === 'user'
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs, message.error && styles.error]}>
      <Text
        selectable
        style={[
          styles.bubbleText,
          { direction: isRtlText(message.content) ? 'rtl' : 'ltr' },
          mine && { color: '#fff' },
          message.error && { color: colors.danger },
        ]}
      >
        {message.content}
      </Text>
    </View>
  )
}

function Typing() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current
  useEffect(() => {
    const loops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(v, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 160),
        ]),
      ),
    )
    loops.forEach((l) => l.start())
    return () => loops.forEach((l) => l.stop())
  }, [dots])
  return (
    <View style={[styles.bubble, styles.theirs, styles.typing]} accessibilityLabel={tp('Typing…')}>
      {dots.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              transform: [
                {
                  translateY: v.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: colors.ink,
    borderBottomWidth: 3,
    borderBottomColor: colors.gold,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#26221C',
    borderWidth: 1,
    borderColor: '#3A342B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontFamily: fonts.heading,
    fontSize: 16,
    textAlign: 'left',
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  online: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3FBF7F' },
  sub: {
    color: '#CFC7B8',
    fontFamily: fonts.regular,
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'left',
  },

  list: { padding: 14, gap: 10, flexGrow: 1 },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.ink,
    borderBottomEndRadius: 4,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomStartRadius: 4,
  },
  error: { backgroundColor: colors.dangerSoft, borderColor: '#F3C9BF' },
  bubbleText: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 23,
    textAlign: 'left',
  },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  suggestion: {
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.sand,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    color: colors.goldText,
    fontFamily: fonts.medium,
    fontSize: 13,
  },

  typing: { flexDirection: 'row', gap: 5, paddingVertical: 14, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
