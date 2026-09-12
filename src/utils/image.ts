/**
 * Kompresi dan resize gambar avatar menjadi base64 ringan (~15-30KB)
 * Cocok untuk disimpan langsung di Supabase user metadata tanpa membebani bandwidth.
 */
export function compressAvatarImage(
  file: File,
  maxDimension = 240,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih harus berupa format gambar (JPG, PNG, WebP)'))
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Crop center square
        const minEdge = Math.min(width, height)
        const sx = (width - minEdge) / 2
        const sy = (height - minEdge) / 2

        canvas.width = maxDimension
        canvas.height = maxDimension

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(event.target?.result as string)
          return
        }

        ctx.drawImage(img, sx, sy, minEdge, minEdge, 0, 0, maxDimension, maxDimension)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}
