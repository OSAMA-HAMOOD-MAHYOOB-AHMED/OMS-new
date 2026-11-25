// Sale prices: compareAtPrice is the original price, shown crossed out when it is above price.
export function isOnSale(p) {
  return Number(p?.compareAtPrice) > Number(p?.price)
}

/** Whole-number percentage off, e.g. 23 for 23% off. */
export function discountPercent(p) {
  if (!isOnSale(p)) return 0
  return Math.round((1 - Number(p.price) / Number(p.compareAtPrice)) * 100)
}
