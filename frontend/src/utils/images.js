export const siteLogoUrl = '/images/logo.jpg'
export const siteHeroUrl = '/images/hero.jpg'

const categoryImages = {
  chargers: '/images/products/charger.jpg',
  earphones: '/images/products/earphones.jpg',
  powerbanks: '/images/products/powerbank.jpg',
  cases: '/images/products/case.jpg',
}

const productDefaults = {
  'P-CHARGER-01': '/images/products/charger.jpg',
  'P-EARPH-01': '/images/products/earphones.jpg',
  'P-PBANK-01': '/images/products/powerbank.jpg',
  'P-CASE-01': '/images/products/case.jpg',
}

export function productImageUrl(product) {
  const url = String(product?.imageUrl || '').trim()
  if (url) return url

  const id = String(product?.productID || '').trim()
  if (productDefaults[id]) return productDefaults[id]

  const category = String(product?.category || '').toLowerCase()
  if (category.includes('charge')) return categoryImages.chargers
  if (category.includes('ear')) return categoryImages.earphones
  if (category.includes('power')) return categoryImages.powerbanks
  if (category.includes('case')) return categoryImages.cases

  const n = (id.charCodeAt(id.length - 1) || 7) % 16
  const idx = String(n + 1).padStart(2, '0')
  return `/mock/frame-${idx}.png`
}

export function categoryImageUrl(key) {
  return categoryImages[key] || '/mock/frame-01.png'
}
