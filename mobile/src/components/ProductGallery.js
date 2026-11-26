import { useRef, useState } from 'react'
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { tp } from '../i18n'
import { colors, fonts } from '../theme'

/**
 * Swipe through a product's photos; the other photos sit underneath as small thumbnails.
 * The strip always runs left to right so the photo order is the same in both languages.
 */
export default function ProductGallery({ sources, height = 340, children }) {
  const { width } = useWindowDimensions()
  const listRef = useRef(null)
  const [index, setIndex] = useState(0)
  const many = sources.length > 1

  function go(i) {
    setIndex(i)
    listRef.current?.scrollToIndex({ index: i, animated: true })
  }

  return (
    <View>
      <View style={{ height, backgroundColor: '#fff' }}>
        <FlatList
          ref={listRef}
          data={sources}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          style={{ direction: 'ltr' }}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => <Image source={item} style={{ width, height }} resizeMode="cover" />}
        />
        {children}
        {many ? (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{`\u200E${index + 1} / ${sources.length}`}</Text>
          </View>
        ) : null}
      </View>

      {many ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ direction: 'ltr', backgroundColor: '#fff' }}
          contentContainerStyle={styles.thumbs}
        >
          {sources.map((src, i) => (
            <Pressable
              key={i}
              onPress={() => go(i)}
              style={[styles.thumb, i === index && styles.thumbOn]}
              accessibilityRole="button"
              accessibilityLabel={`${tp('Photo')} ${i + 1}`}
            >
              <Image source={src} style={styles.thumbImg} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  counter: {
    position: 'absolute',
    bottom: 40,
    end: 16, // the sale badge is at the start corner
    backgroundColor: 'rgba(20,20,20,0.7)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  counterText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 12 },
  thumbs: { gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 26, backgroundColor: '#fff' },
  thumb: { width: 62, height: 62, borderRadius: 12, borderWidth: 2, borderColor: colors.border, overflow: 'hidden', backgroundColor: '#fff' },
  thumbOn: { borderColor: colors.gold },
  thumbImg: { width: '100%', height: '100%' },
})
