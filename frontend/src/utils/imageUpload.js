// Helpers for uploading product photos from the admin page.

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Checks the file and shrinks big photos (longest side 1200px, JPEG) so uploads stay fast.
 * Returns a Blob/File ready to send. Throws an Error with a readable message.
 */
export async function prepareProductPhoto(file, maxSide = 1200) {
  if (!file) throw new Error('Choose a photo first.')
  if (!ALLOWED.includes(file.type)) throw new Error('Only JPEG, PNG or WebP photos are allowed.')

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    if (file.size > MAX_BYTES) throw new Error('The photo is too large. The maximum size is 5 MB.')
    return file
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return file

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // transparent PNGs get a white background in JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (!blob) return file
  if (blob.size > MAX_BYTES) throw new Error('The photo is too large. The maximum size is 5 MB.')
  return new File([blob], 'product.jpg', { type: 'image/jpeg' })
}

export async function uploadProductPhoto(api, productID, file) {
  const body = new FormData()
  body.append('file', file)
  const res = await api.post(`/api/admin/products/${encodeURIComponent(productID)}/image`, body)
  return res.data?.imageUrl
}
