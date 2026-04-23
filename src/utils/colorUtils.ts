function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  let rn = r / 255
  let gn = g / 255
  let bn = b / 255

  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92

  const x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047
  const y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.0
  const z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(x)
  const fy = f(y)
  const fz = f(z)

  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

function deltaE(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 100

  const lab1 = rgbToLab(rgb1.r, rgb1.g, rgb1.b)
  const lab2 = rgbToLab(rgb2.r, rgb2.g, rgb2.b)

  return Math.sqrt(
    Math.pow(lab2.l - lab1.l, 2) +
      Math.pow(lab2.a - lab1.a, 2) +
      Math.pow(lab2.b - lab1.b, 2)
  )
}

export function computeMatchScore(productHexes: string[], paletteHexes: string[]): number {
  if (!productHexes.length || !paletteHexes.length) return 50

  let minDistance = Infinity
  for (const pH of productHexes) {
    for (const palH of paletteHexes) {
      const d = deltaE(pH, palH)
      if (d < minDistance) minDistance = d
    }
  }

  // deltaE: 0=identical, ~10=similar, 50+=very different
  return Math.round(Math.max(0, 100 - minDistance * 1.8))
}

export function getMatchLabel(score: number): string {
  if (score >= 85) return 'Perfect'
  if (score >= 70) return 'Great'
  if (score >= 55) return 'Good'
  return 'Fair'
}

export function getMatchColor(score: number): string {
  if (score >= 85) return '#16A34A'
  if (score >= 70) return '#CA8A04'
  if (score >= 55) return '#EA580C'
  return '#9CA3AF'
}

export async function resizeImageToBase64(
  file: File,
  maxDim = 800
): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
      resolve({
        data: dataUrl.split(',')[1],
        mediaType: 'image/jpeg',
      })
    }
    img.src = url
  })
}
