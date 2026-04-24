import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { ColorPalette } from '../../src/types/index.js'

const router = Router()

type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
const VALID_MIMES: ImageMime[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif)(\?.*)?$/i

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isDirectImageUrl(url: string): boolean {
  try { 
    const u = new URL(url)
    if (IMAGE_EXT_RE.test(u.pathname)) return true
    // Catch Cloudinary (Aritzia) & Scene7 URLs that often lack file extensions
    if (u.pathname.includes('/image/upload/') || u.pathname.includes('/is/image/')) return true
    return false
  } catch { return false }
}

function cleanUrl(url: string, base: string): string | null {
  if (!url) return null
  if (url.startsWith('//')) return 'https:' + url
  if (url.startsWith('http')) return url
  try { return new URL(url, base).href } catch { return null }
}

function extractMeta(html: string, patterns: RegExp[]): string | null {
  for (const p of patterns) { const m = html.match(p); if (m?.[1]) return m[1] }
  return null
}

async function remoteImageToBase64(url: string): Promise<{ data: string; mediaType: ImageMime } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
    const mediaType: ImageMime = VALID_MIMES.includes(ct as ImageMime) ? ct as ImageMime : 'image/jpeg'
    return { data: Buffer.from(await res.arrayBuffer()).toString('base64'), mediaType }
  } catch { return null }
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

interface ColorOption { name: string; hex?: string }

interface ScrapedProduct {
  name: string
  brand: string
  price?: number
  imageUrls: string[]
  colorOptions: ColorOption[]   // structured variants extracted from page data
  colorHints: string[]          // plain color name strings from text
}

async function scrapeProduct(pageUrl: string): Promise<ScrapedProduct | null> {
  if (isDirectImageUrl(pageUrl)) {
    return { name: '', brand: '', imageUrls: [pageUrl], colorOptions: [], colorHints: [] }
  }

  let html: string
  let finalUrl = pageUrl
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
    })
    const ct = res.headers.get('content-type') ?? ''
    if (ct.startsWith('image/')) return { name: '', brand: '', imageUrls: [pageUrl], colorOptions: [], colorHints: [] }
    if (!res.ok) return null
    finalUrl = res.url ?? pageUrl
    html = await res.text()
  } catch { return null }

  const imageUrls = new Set<string>()
  const colorOptions: ColorOption[] = []
  const colorHints: string[] = []
  let name = ''
  let brand = ''
  let price: number | undefined

  // ── 1. Next.js __NEXT_DATA__ (Sephora, many modern retail sites) ──────────
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/i)
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1])
      // Walk the props looking for product data
      const asStr = JSON.stringify(nd)
      // Product name patterns in Next.js state
      const nameMatch = asStr.match(/"(?:displayName|productName|name)"\s*:\s*"([^"]{3,150})"/)
      if (nameMatch) name = nameMatch[1]
      const brandMatch = asStr.match(/"(?:brand|brandName|manufacturer)"\s*:\s*"([^"]{2,80})"/)
      if (brandMatch) brand = brandMatch[1]
      // Look for variant/sku color arrays
      const variantMatch = asStr.match(/"(?:skus|variants|colorVariants|swatches)"\s*:\s*(\[[^\]]{0,4000}\])/)
      if (variantMatch) {
        try {
          const variants = JSON.parse(variantMatch[1]) as { colorName?: string; color?: string; hex?: string; hexCode?: string; swatchHex?: string }[]
          for (const v of variants.slice(0, 20)) {
            const n = v.colorName ?? v.color ?? ''
            const h = v.hex ?? v.hexCode ?? v.swatchHex
            if (n) colorOptions.push({ name: n, hex: h?.startsWith('#') ? h : h ? `#${h}` : undefined })
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  // ── 2. JSON-LD Product schema ─────────────────────────────────────────────
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const nodes = ((v: unknown) => Array.isArray(v) ? v : [v])(JSON.parse(m[1].trim()))
      for (const node of nodes as Record<string, unknown>[]) {
        if (node['@type'] !== 'Product' && !(Array.isArray(node['@type']) && (node['@type'] as string[]).includes('Product'))) continue
        if (!name && typeof node['name'] === 'string') name = node['name']
        if (!brand) {
          const b = node['brand'] as Record<string, string> | undefined
          if (b?.name) brand = b.name
        }

        // Images
        const imgs = Array.isArray(node['image']) ? node['image'] as string[] : typeof node['image'] === 'string' ? [node['image']] : []
        for (const i of imgs) { const u = cleanUrl(i, finalUrl); if (u) imageUrls.add(u) }

        // Single color on product
        if (typeof node['color'] === 'string') colorHints.push(node['color'])

        // Offer variants with color
        const offers = node['offers']
        const offArr = Array.isArray(offers) ? offers as Record<string, unknown>[] : offers ? [offers as Record<string, unknown>] : []
        for (const o of offArr) {
          if (typeof o['color'] === 'string' && o['color']) colorHints.push(o['color'])
          if (!price && (typeof o['price'] === 'number' || typeof o['price'] === 'string')) price = parseFloat(String(o['price']))
        }
      }
    } catch { /* skip */ }
  }

  // ── 3. OG / Twitter meta ─────────────────────────────────────────────────
  const ogImg = extractMeta(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ])
  if (ogImg) { const u = cleanUrl(ogImg, finalUrl); if (u) imageUrls.add(u) }

  if (!name) {
    name = extractMeta(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    ]) ?? html.match(/<h1[^>]*>([^<]{3,120})<\/h1>/i)?.[1]?.trim() ?? ''
  }

  // ── 4. Data-src / zoom-image attributes (lazy-loaded product images) ──────
  for (const m of html.matchAll(/data-(?:zoom-image|large-image|src|original|hi-res)=["'](https?[^"']+\.(?:jpe?g|png|webp)[^"']*)["']/gi)) {
    const u = cleanUrl(m[1], finalUrl); if (u) imageUrls.add(u)
  }

  // ── 5. Sephora-specific: shade swatch JSON inside inline script ───────────
  // Sephora embeds shade data as a JS variable: skuImages: [{...}]
  const sephoraShades = html.match(/"displayName"\s*:\s*"([^"]+)"[^}]*"hex(?:Code)?"\s*:\s*"([0-9A-Fa-f]{6})"/g)
  if (sephoraShades) {
    for (const s of sephoraShades.slice(0, 20)) {
      const nm = s.match(/"displayName"\s*:\s*"([^"]+)"/)
      const hx = s.match(/"hex(?:Code)?"\s*:\s*"([0-9A-Fa-f]{6})"/)
      if (nm && hx) colorOptions.push({ name: nm[1], hex: `#${hx[1]}` })
    }
  }

  // ── 6. Color keywords in visible text ────────────────────────────────────
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 10_000)

  for (const m of text.matchAll(/(?:colou?r|shade|hue|tone)[:\s]+([a-z][a-z\s\-]{2,28}?)(?:[,.\n(]|$)/gi)) {
    const hint = m[1].trim()
    if (hint.length < 30 && !/^(the|this|that|and|for|with|your|our)$/i.test(hint)) colorHints.push(hint)
  }

  const allImages = [...imageUrls].slice(0, 3)
  if (!allImages.length && !name) return null

  return {
    name: name.replace(/\s+/g, ' ').slice(0, 200),
    brand: brand.slice(0, 100),
    price,
    imageUrls: allImages,
    colorOptions: colorOptions.slice(0, 24),
    colorHints: [...new Set(colorHints)].slice(0, 10),
  }
}

// ─── Barcode lookup ───────────────────────────────────────────────────────────

async function lookupBarcode(barcode: string): Promise<{ name: string; imageUrl?: string } | null> {
  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`, {
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return null
    const data = await res.json() as { items?: { title?: string; images?: string[] }[] }
    const item = data.items?.[0]
    if (!item) return null
    return { name: item.title ?? 'Unknown product', imageUrl: item.images?.[0] }
  } catch { return null }
}

// ─── Claude prompt ────────────────────────────────────────────────────────────

function buildPrompt(
  palette: ColorPalette | undefined | null,
  bodyType: string | undefined | null,
  product: { name: string; brand: string; colorOptions: ColorOption[]; colorHints: string[] },
): string {
  const paletteSection = palette
    ? `USER COLOR PROFILE:
Seasonal Type: ${palette.seasonalType}
Undertone: ${palette.undertone}
Best / Statement Colors (hex): ${palette.dominantColors.slice(0, 8).join(', ')}
Neutrals (hex): ${palette.neutrals.slice(0, 6).join(', ')}
Colors to Avoid (hex): ${palette.toAvoid.slice(0, 6).join(', ')}
Full Flattering Palette (hex): ${palette.allHexCodes.slice(0, 28).join(', ')}`
    : 'USER COLOR PROFILE: No palette on file — do your best with the visible colors.'

  const bodySection = bodyType
    ? `USER BODY TYPE: ${bodyType}`
    : 'USER BODY TYPE: Not provided.'

  const knownOptions = product.colorOptions.length
    ? `KNOWN COLOR OPTIONS (from page data):\n${product.colorOptions.map((o) => `- ${o.name}${o.hex ? ` (${o.hex})` : ''}`).join('\n')}`
    : ''

  const hints = product.colorHints.length
    ? `COLOR HINTS FROM PAGE TEXT: ${product.colorHints.join(', ')}`
    : ''

  return `You are an expert personal stylist specializing in seasonal color theory and body-type dressing.

${paletteSection}

${bodySection}

PRODUCT CONTEXT:
${product.name ? `Name: ${product.name}` : ''}
${product.brand ? `Brand: ${product.brand}` : ''}
${knownOptions}
${hints}

TASK:
1. Identify the product (name, brand, category: clothing | makeup | jewelry | shoes | bags).
2. Find ALL available color/shade options by:
   - Using the "KNOWN COLOR OPTIONS" list above if provided (treat as authoritative)
   - Looking carefully in the image for color swatches, shade testers, or colorway chips
   - Reading any shade names / color names visible in the image
   - If no swatches are visible and no options are listed, treat the single visible color as the only option
3. For EACH option, compute a match score (0-100) against the user's seasonal palette.
4. For clothing items, also assess silhouette/fit against the body type.
5. Sort options from highest to lowest matchScore.

Return ONLY valid JSON (no markdown, no extra text):
{
  "productName": "<concise product name>",
  "productBrand": "<brand name or empty string>",
  "productCategory": "<clothing | makeup | jewelry | shoes | bags>",
  "options": [
    {
      "name": "<shade or color name>",
      "hex": "<best-guess hex code for this specific shade>",
      "matchScore": <integer 0-100>,
      "verdict": "<perfect | great | good | fair | skip>",
      "colorReasoning": "<1-2 sentences: why this color works or doesn't for their season — be specific>",
      "fitReasoning": "<1-2 sentences on silhouette/fit for clothing, or null for makeup/accessories>"
    }
  ],
  "bestOption": "<name of the highest-scoring option>",
  "overallRecommendation": "<one sentence: your top recommendation and why>"
}

Scoring guide: perfect ≥ 88 · great ≥ 75 · good ≥ 60 · fair ≥ 45 · skip < 45`
}

// ─── Router ───────────────────────────────────────────────────────────────────

type ImageBlock = {
  type: 'image'
  source: { type: 'base64'; media_type: ImageMime; data: string }
}

router.post('/', async (req: Request, res: Response) => {
  const { type, data, mediaType, palette, bodyType } = req.body as {
    type: 'image' | 'url' | 'barcode'
    data: string
    mediaType?: string
    palette?: ColorPalette
    bodyType?: string
  }

  if (!type || !data) { res.status(400).json({ error: 'type and data are required' }); return }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { res.status(503).json({ error: 'API key not configured on server' }); return }

  const imageBlocks: ImageBlock[] = []
  let productMeta: { name: string; brand: string; colorOptions: ColorOption[]; colorHints: string[] } = {
    name: '', brand: '', colorOptions: [], colorHints: [],
  }
  let productImageUrl: string | null = null  // stable URL to use for pin thumbnail

  // ── Build image blocks by input type ────────────────────────────────────
  if (type === 'image') {
    const mime = VALID_MIMES.includes(mediaType as ImageMime) ? mediaType as ImageMime : 'image/jpeg'
    imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: mime, data } })

  } else if (type === 'url') {
    const scraped = await scrapeProduct(data)
    if (!scraped || scraped.imageUrls.length === 0) {
      res.status(422).json({
        error: "Couldn't load a product image from that URL.",
        hint: "Most big retailers block automated image loading. Try right-clicking the product photo → 'Copy image address' → paste that direct image URL here instead.",
      })
      return
    }
    productMeta = { name: scraped.name, brand: scraped.brand, colorOptions: scraped.colorOptions, colorHints: scraped.colorHints }
    productImageUrl = scraped.imageUrls[0]

    const fetched = await Promise.all(scraped.imageUrls.slice(0, 2).map(remoteImageToBase64))
    for (const f of fetched) {
      if (f) imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: f.mediaType, data: f.data } })
    }
    if (imageBlocks.length === 0) {
      res.status(422).json({
        error: "Found the page but couldn't fetch any images.",
        hint: "Right-click the product photo → 'Copy image address' → paste that URL here instead.",
      })
      return
    }

  } else if (type === 'barcode') {
    const lookup = await lookupBarcode(data)
    if (!lookup) {
      res.status(422).json({ error: "Barcode not found. Try pasting the product URL or uploading a photo." })
      return
    }
    productMeta.name = lookup.name
    if (lookup.imageUrl) {
      productImageUrl = lookup.imageUrl
      const f = await remoteImageToBase64(lookup.imageUrl)
      if (f) imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: f.mediaType, data: f.data } })
    }
    if (imageBlocks.length === 0) {
      res.status(422).json({ error: `Found "${lookup.name}" but couldn't load an image. Try uploading a product photo instead.` })
      return
    }
  }

  if (imageBlocks.length === 0) { res.status(400).json({ error: 'No image to analyze.' }); return }

  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [...imageBlocks, { type: 'text', text: buildPrompt(palette, bodyType, productMeta) }],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in Claude response')
    const result = JSON.parse(match[0])

    res.json({ ...result, productImageUrl })
  } catch (err) {
    console.error('[product-check]', err)
    res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
})

export default router
