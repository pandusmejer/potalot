/**
 * Klient-side billed-komprimering via Canvas.
 *
 * Reducerer billed-størrelse FØR upload — sparer båndbredde + forhindrer
 * Netlify Functions OOM/timeout på store iPhone-fotos. Beholder
 * orientation og kvalitet acceptabel for haveapp-brug.
 *
 * Fallback: hvis browseren ikke kan dekode formatet (fx HEIC på desktop),
 * returneres originalen så server-siden kan tage over.
 */

interface CompressOptions {
  /** Maks pixel-størrelse på den længste side (default 2400). */
  maxDimension?: number
  /** JPEG-kvalitet 0-1 (default 0.85). */
  quality?: number
  /** Skip kompression hvis filen er under denne størrelse i bytes (default 500 KB). */
  skipBelowBytes?: number
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxDimension = 2400,
    quality = 0.85,
    skipBelowBytes = 500 * 1024,
  } = options

  // Tidlig exit: ikke et billede
  if (!file.type.startsWith('image/') && !/\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name)) {
    return file
  }

  // For små filer er det ikke værd
  if (file.size < skipBelowBytes) {
    return file
  }

  try {
    const compressed = await compressViaCanvas(file, maxDimension, quality)
    // Hvis kompression ikke gjorde filen mindre, brug originalen
    if (compressed.size >= file.size) {
      return file
    }
    return compressed
  } catch (e) {
    // Browser kunne ikke dekode (ofte HEIC på desktop) — lad serveren håndtere
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[compressImage] kunne ikke komprimere, sender original:', e)
    }
    return file
  }
}

function compressViaCanvas(file: File, maxDimension: number, quality: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      try {
        const { naturalWidth: w, naturalHeight: h } = img
        if (w === 0 || h === 0) {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('Billedet har ingen dimensioner'))
          return
        }

        const scale = Math.min(1, maxDimension / Math.max(w, h))
        const targetW = Math.round(w * scale)
        const targetH = Math.round(h * scale)

        const canvas = document.createElement('canvas')
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('Canvas context ikke tilgængelig'))
          return
        }
        ctx.drawImage(img, 0, 0, targetW, targetH)

        canvas.toBlob(
          blob => {
            URL.revokeObjectURL(objectUrl)
            if (!blob) {
              reject(new Error('Canvas toBlob returnerede null'))
              return
            }
            const newName = file.name.replace(/\.[a-z0-9]+$/i, '.jpg') || 'upload.jpg'
            resolve(new File([blob], newName, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          quality,
        )
      } catch (e) {
        URL.revokeObjectURL(objectUrl)
        reject(e instanceof Error ? e : new Error(String(e)))
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Browseren kunne ikke indlæse billedet'))
    }

    img.src = objectUrl
  })
}
