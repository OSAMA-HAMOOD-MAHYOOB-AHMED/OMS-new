// Product images are either absolute URLs (Unsplash etc.) or paths like
// "/images/products/charger.jpg" that the website serves. The app bundles
// those few site images so they work offline and without the website.
const bundled = {
  '/images/products/charger.jpg': require('../../assets/images/charger.jpg'),
  '/images/products/earphones.jpg': require('../../assets/images/earphones.jpg'),
  '/images/products/powerbank.jpg': require('../../assets/images/powerbank.jpg'),
  '/images/products/case.jpg': require('../../assets/images/case.jpg'),
}

export const logo = require('../../assets/images/logo.jpg')

function byCategory(category) {
  const c = String(category || '').toLowerCase()
  if (c.includes('charge')) return bundled['/images/products/charger.jpg']
  if (c.includes('ear')) return bundled['/images/products/earphones.jpg']
  if (c.includes('power')) return bundled['/images/products/powerbank.jpg']
  if (c.includes('case')) return bundled['/images/products/case.jpg']
  return bundled['/images/products/charger.jpg']
}

// Returns a value usable as <Image source={...} />.
export function productImageSource(product) {
  const url = String(product?.imageUrl || '').trim()
  if (/^https?:\/\//i.test(url)) return { uri: url }
  if (url.startsWith('data:image/')) return { uri: url }
  if (bundled[url]) return bundled[url]
  return byCategory(product?.category)
}
