import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { ColorPalette } from '../../src/types/index.js'
import puppeteer from 'puppeteer'

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
  let fullUrl: string
  if (url.startsWith('//')) fullUrl = 'https:' + url
  else if (url.startsWith('http')) fullUrl = url
  else {
    try { fullUrl = new URL(url, base).href } catch { return null }
  }

  try {
    const u = new URL(fullUrl)
    // Fix for Demandware / Salesforce Commerce "Product-Variation" HTML fragments (Aritzia, Sephora, etc.)
    if (u.pathname.includes('Product-Variation') || u.pathname.includes('UpdateItem') || u.pathname.includes('Product-Hit')) {
      const baseObj = new URL(base)
      let modified = false
      for (const [key, val] of u.searchParams.entries()) {
        const k = key.toLowerCase()
        if (k.includes('color') || k.includes('shade') || k.includes('variant') || k.includes('sku') || k === 'pid' || k.startsWith('dwvar_')) {
          baseObj.searchParams.set(key, val)
          if (k.endsWith('_color')) baseObj.searchParams.set('color', val) // Guarantee ?color= exists for the frontend
          modified = true
        }
      }
      if (modified) return baseObj.href
    }
    return u.href
  } catch { return fullUrl }
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

interface ColorOption { name: string; hex?: string; imageUrl?: string; url?: string }

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

  let html = ''
  let finalUrl = pageUrl
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8_000), // reduced timeout to fail fast and trigger fallback
      redirect: 'follow',
    })
    const ct = res.headers.get('content-type') ?? ''
    if (ct.startsWith('image/')) return { name: '', brand: '', imageUrls: [pageUrl], colorOptions: [], colorHints: [] }
    if (res.ok && res.status !== 403 && res.status !== 401) {
      finalUrl = res.url ?? pageUrl
      html = await res.text()
    }
  } catch { /* let fallback handle it */ }

  // Fallback to headless browser to bypass bot protection (Cloudflare/Akamai)
  if (!html) {
    try {
      const browser = await puppeteer.launch({ headless: true })
      const page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 })
      html = await page.content()
      await browser.close()
    } catch (err) {
      console.error('Puppeteer scraping failed:', err)
      return null
    }
  }

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
      // Look for variant/sku color arrays recursively (bypasses regex length limits on massive stores)
      const findVariants = (obj: any, results: any[] = []): any[] => {
        if (!obj || typeof obj !== 'object') return results
        for (const k of ['skus', 'variants', 'colorVariants', 'swatches', 'colors']) {
          if (Array.isArray(obj[k]) && obj[k].length > 0 && typeof obj[k][0] === 'object' && (obj[k][0].colorName || obj[k][0].color || obj[k][0].name || obj[k][0].hex || obj[k][0].image)) {
            results.push(...obj[k])
          }
        }
        for (const val of Object.values(obj)) {
          if (val && typeof val === 'object') findVariants(val, results)
        }
        return results
      }

      const variants = findVariants(nd)
      if (variants.length > 0) {
        for (const v of variants.slice(0, 50)) {
          const n = v.colorName ?? v.color ?? v.name ?? ''
          const h = v.hex ?? v.hexCode ?? v.swatchHex
          let img = v.imageUrl ?? v.image ?? (Array.isArray(v.images) ? v.images[0] : undefined)
          if (img) img = cleanUrl(img, finalUrl) ?? undefined
          let u = v.url ?? v.link ?? v.productUrl ?? v.product_url
          if (!u && (v.colorId || v.code || v.id || v.skuId || v.sku)) {
            const idVal = String(v.colorId || v.code || v.id || v.skuId || v.sku)
            if (idVal && idVal !== '[object Object]') {
              try { 
                const temp = new URL(finalUrl); 
                const param = v.skuId || v.sku ? 'skuId' : 'color';
                temp.searchParams.set(param, idVal); 
                u = temp.href 
              } catch {}
            }
          }
          if (u) u = cleanUrl(u, finalUrl) ?? undefined
          if (n) colorOptions.push({ name: n, hex: h?.startsWith('#') ? h : h ? `#${h}` : undefined, imageUrl: img, url: u })
        }
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
          const offImg = typeof o['image'] === 'string' ? o['image'] : Array.isArray(o['image']) ? (o['image'] as string[])[0] : undefined
          const offUrl = typeof o['url'] === 'string' ? cleanUrl(o['url'], finalUrl) : undefined
          if (typeof o['color'] === 'string' && o['color'] && offImg) {
            const cln = cleanUrl(offImg, finalUrl); if (cln) colorOptions.push({ name: o['color'], imageUrl: cln, url: offUrl ?? undefined })
          }
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
  for (const m of html.matchAll(/\{([^{}]*"displayName"\s*:\s*"[^"]+"[^{}]*)\}/gi)) {
    const block = m[1]
    const nm = block.match(/"displayName"\s*:\s*"([^"]+)"/)
    const hx = block.match(/"hex(?:Code)?"\s*:\s*"([0-9A-Fa-f]{6})"/)
    const sku = block.match(/"skuId"\s*:\s*"([^"]+)"/)
    if (nm && hx) {
      let u = undefined
      if (sku) {
         try { const t = new URL(finalUrl); t.searchParams.set('skuId', sku[1]); u = t.href } catch {}
      }
      colorOptions.push({ name: nm[1], hex: `#${hx[1]}`, url: u })
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

  // ── 7. Common aria-label / title attributes for color swatches ───────────
  for (const m of html.matchAll(/(?:aria-label|title|alt)=["'][^"']*(?:Color|Shade)[:\s-]*([^"']{2,40})["']/gi)) {
    const hint = m[1].replace(/selected|swatch/i, '').trim()
    const skipList = /^(logo|image|product|quick|view|add|cart|close|search|menu)$/i
    if (hint && hint.length < 30 && !skipList.test(hint) && !colorHints.includes(hint)) colorHints.push(hint)
  }

  // ── 8. Anchor tags with color names (Aritzia, Sephora, etc.) ────────────
  for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*data-color-name=["']([^"']+)["']/gi)) {
    const u = cleanUrl(m[1], finalUrl)
    if (u) colorOptions.push({ name: m[2].trim(), url: u })
  }
  for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*aria-label=["'][^"']*(?:Color|Shade)[:\s-]*([^"']{2,40})["']/gi)) {
    const hint = m[2].replace(/selected|swatch/i, '').trim()
    const u = cleanUrl(m[1], finalUrl)
    const skipList = /^(logo|image|product|quick|view|add|cart|close|search|menu)$/i
    if (u && hint && hint.length < 30 && !skipList.test(hint)) colorOptions.push({ name: hint, url: u })
  }

  // ── 9. Robust Swatch Link Catch (Demandware/Aritzia/Sephora) ────────────
  for (const m of html.matchAll(/<a([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = m[1]
    const inner = m[2]
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i)
    if (hrefMatch) {
      const rawUrl = hrefMatch[1]
      let hint = (attrs.match(/(?:title|aria-label|alt|data-color-name|data-color)=["']([^"']{2,40})["']/i)?.[1] || '').replace(/selected|swatch/i, '').trim()
      
      if (!hint) hint = (inner.match(/(?:title|alt)=["']([^"']{2,40})["']/i)?.[1] || '').replace(/selected|swatch/i, '').trim()
      if (!hint && inner.length > 1 && inner.length < 40 && !inner.includes('<')) hint = inner.trim()

      if (hint && !/^(logo|image|product|quick|view|add|cart|close|search|menu)$/i.test(hint) && rawUrl.length > 5) {
        if (!rawUrl.startsWith('javascript:') && !rawUrl.startsWith('#')) {
          const u = cleanUrl(rawUrl, finalUrl)
          if (u && (u.includes('color') || u.includes('shade') || u.includes('variant') || u.includes('sku') || u.includes('?'))) {
            colorOptions.push({ name: hint, url: u })
          }
        }
      }
    }
  }

  // ── 10. Hex extraction from swatch inline styles and data attributes ───────
  // Enrich existing colorOptions with actual hex values so analysis uses real color, not just name
  for (const m of html.matchAll(/<(?:a|button|span|div|li)\s([^>]{0,600})>/gi)) {
    const attrs = m[1]
    const nameMatch = attrs.match(/(?:aria-label|title|data-(?:color-name|color|name|swatch-name))=["']([^"']{2,50})["']/i)
    if (!nameMatch) continue
    const rawName = nameMatch[1].replace(/^\s*(?:colou?r|shade)[\s:-]*/i, '').replace(/\s*(?:selected|swatch)\s*/gi, '').trim()
    if (!rawName || rawName.length > 45) continue

    let extractedHex: string | undefined

    // background-color: #XXXXXX or background-color: rgb(R,G,B)
    const bgMatch = attrs.match(/style=["'][^"']*background(?:-color)?\s*:\s*(?:rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)[^)]*\)|#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b)/i)
    if (bgMatch) {
      if (bgMatch[4]) {
        const h = bgMatch[4]
        extractedHex = h.length === 3
          ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
          : `#${h}`
      } else if (bgMatch[1]) {
        const r = parseInt(bgMatch[1]).toString(16).padStart(2, '0')
        const g = parseInt(bgMatch[2]).toString(16).padStart(2, '0')
        const b = parseInt(bgMatch[3]).toString(16).padStart(2, '0')
        extractedHex = `#${r}${g}${b}`
      }
    }

    // data-hex, data-color, data-swatch-hex attributes
    if (!extractedHex) {
      const dataHexMatch = attrs.match(/data-(?:hex|color-hex|swatch-hex|swatch-color|bg-color)=["']#?([0-9A-Fa-f]{6})["']/i)
      if (dataHexMatch) extractedHex = `#${dataHexMatch[1]}`
    }

    if (!extractedHex) continue

    const existing = colorOptions.find((o) => {
      const a = o.name.toLowerCase().replace(/\s+/g, ' ').trim()
      const b = rawName.toLowerCase().replace(/\s+/g, ' ').trim()
      return a === b || a.includes(b) || b.includes(a)
    })
    if (existing) {
      if (!existing.hex) existing.hex = extractedHex
    } else {
      colorOptions.push({ name: rawName, hex: extractedHex })
    }
  }

  // ── 11. Color swatch URLs from data-url / data-href / data-product-url ─────
  for (const m of html.matchAll(/<(?:button|div|li|span)\s([^>]{0,600})>/gi)) {
    const attrs = m[1]
    const nameMatch = attrs.match(/(?:aria-label|title|data-(?:color-name|color|name|swatch))=["']([^"']{2,50})["']/i)
    if (!nameMatch) continue
    const rawName = nameMatch[1].replace(/selected|swatch/gi, '').trim()
    if (!rawName || rawName.length > 45) continue
    const urlMatch = attrs.match(/data-(?:url|href|link|product-url|swatch-url|variant-url|pdp-url)=["']([^"']+)["']/i)
    let u: string | null = null
    if (urlMatch) {
      u = cleanUrl(urlMatch[1], finalUrl)
    } else {
      const idMatch = attrs.match(/data-(?:color-id|sku-id|variant-id|pid|id|value)=["']([^"']{1,20})["']/i)
      if (idMatch) {
        try {
          const temp = new URL(finalUrl)
          const param = attrs.includes('sku') ? 'skuId' : 'color'
          temp.searchParams.set(param, idMatch[1])
          u = temp.href
        } catch {}
      }
    }
    if (!u) continue
    const existing = colorOptions.find((o) => {
      const a = o.name.toLowerCase().trim()
      const b = rawName.toLowerCase().trim()
      return a === b || a.includes(b) || b.includes(a)
    })
    if (existing) {
      if (!existing.url || !existing.url.includes('?')) existing.url = u
    } else {
      colorOptions.push({ name: rawName, url: u })
    }
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

// ─── Click-through variant agent ─────────────────────────────────────────────
// Launches a headless browser, navigates to the product page (JS fully executed),
// then clicks each color swatch one-by-one and captures the resulting URL.
// Most modern stores update the URL via history.pushState on color click, so the
// same page stays loaded between clicks — making this fast and reliable.
// Shopify stores get an extra extraction pass from window JS globals.

const SWATCH_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const SWATCH_SEL = [
  '[data-color-name]', '[data-color]', '[data-swatch-value]',
  'button[aria-label][class*="swatch" i]', 'button[aria-label][class*="color" i]',
  '[role="radio"][aria-label]', '[role="option"][aria-label]',
  '[class*="colorSwatch"] a', '[class*="colorSwatch"] button',
  '[class*="ColorSwatch"] a', '[class*="ColorSwatch"] button',
  '[class*="color-swatch"] a', '[class*="color-swatch"] button',
  '[class*="SwatchButton"]', '[class*="swatch-button"]',
  'li[class*="color"] a', 'li[class*="swatch"] a',
].join(', ')


async function clickThroughColorVariants(pageUrl: string): Promise<ColorOption[]> {
  let browser
  try {
    browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setUserAgent(SWATCH_UA)
    await page.setViewport({ width: 1280, height: 900 })
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 20_000 })

    // Use final URL after redirects (handles www → apex redirects etc.)
    const finalUrl = page.url()
    const baseOrigin = new URL(finalUrl).origin

    const variants: ColorOption[] = []
    const seen = new Set<string>()

    function addVariant(name: string, url: string | null | undefined, hex: string | null | undefined) {
      const key = name.toLowerCase()
      if (seen.has(key)) {
        const existing = variants.find(v => v.name.toLowerCase() === key)
        if (existing && url && !existing.url) existing.url = url
        if (existing && hex && !existing.hex) existing.hex = hex
        return
      }
      seen.add(key)
      variants.push({ name, url: url ?? undefined, hex: hex ?? undefined })
    }

    function isValidVariantUrl(url: string): boolean {
      try { return url.startsWith('http') && new URL(url).origin === baseOrigin } catch { return false }
    }

    // ── Strategy 1: Shopify product JSON API ─────────────────────────────
    // The /products/{handle}.json endpoint is public on all Shopify stores and gives
    // every variant ID + option values, letting us construct direct variant URLs.
    const shopifyHandle = finalUrl.match(/\/products\/([^/?#]+)/)?.[1]
    if (shopifyHandle) {
      const shopifyJson = await page.evaluate(async (handle: string): Promise<Record<string, unknown> | null> => {
        try {
          const res = await fetch(`/products/${handle}.json`, { headers: { 'Accept': 'application/json' } })
          if (!res.ok) return null
          return await res.json() as Record<string, unknown>
        } catch { return null }
      }, shopifyHandle)

      const product = shopifyJson?.['product'] as Record<string, unknown> | undefined
      if (product && Array.isArray(product['variants'])) {
        const options = (product['options'] as Array<Record<string, unknown>> | undefined) || []
        const colorIdx = options.findIndex(o => /^colou?r$/i.test(String(o['name'] || '')))
        const colorKey = colorIdx >= 0 ? `option${colorIdx + 1}` : 'option1'
        for (const v of product['variants'] as Record<string, unknown>[]) {
          const colorName = String(v[colorKey] || '').trim()
          if (!colorName) continue
          addVariant(colorName, `${baseOrigin}/products/${shopifyHandle}?variant=${v['id']}`, null)
        }
      }
    }

    // ── Strategy 2: Shopify window globals + embedded JSON scripts ────────
    const globalsVariants = await page.evaluate((): Array<{ name: string; url: string }> => {
      const results: Array<{ name: string; url: string }> = []
      const origin = window.location.origin
      const sources: unknown[] = []
      try { const w = window as unknown as Record<string, unknown>; const sa = w['ShopifyAnalytics'] as Record<string, unknown>; const prod = (sa?.['meta'] as Record<string, unknown>)?.['product']; if (prod) sources.push(prod) } catch { /* skip */ }
      for (const k of ['product', '__product', 'currentProduct']) { try { const w = window as unknown as Record<string, unknown>; const d = w[k] as Record<string, unknown>; if (d?.['variants'] && d?.['handle']) sources.push(d) } catch { /* skip */ } }
      document.querySelectorAll('script[type="application/json"]').forEach(s => { try { const d = JSON.parse(s.textContent || '') as Record<string, unknown>; if (d['variants'] && d['handle']) sources.push(d) } catch { /* skip */ } })
      for (const product of sources as Record<string, unknown>[]) {
        const handle = product['handle'] as string
        if (!handle || !Array.isArray(product['variants'])) continue
        const opts = (product['options'] as string[] | undefined) || []
        const ci = opts.findIndex(o => /^colou?r$/i.test(String(o)))
        for (const v of product['variants'] as Record<string, unknown>[]) {
          const color = ci >= 0 ? String(v[`option${ci + 1}`] || '') : String(v['option1'] || v['color'] || '')
          if (!color) continue
          const base = handle.startsWith('/') ? handle : `/products/${handle}`
          results.push({ name: color.trim(), url: `${origin}${base}?variant=${v['id']}` })
        }
      }
      return results
    })
    for (const sv of globalsVariants) addVariant(sv.name, sv.url, null)

    // ── Strategy 3: Scan swatch DOM elements for hex colors + anchor hrefs ─
    type SwatchMeta = { name: string; hex: string | null; href: string | null; dataUrl: string | null }
    const metas: SwatchMeta[] = await page.evaluate((swatchSel: string): SwatchMeta[] => {
      const rgbToHex = (rgb: string): string | null => {
        const m = rgb.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)/)
        if (!m) return null
        const hex = '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
        return ['#ffffff', '#000000', '#f5f5f5', '#eeeeee', '#e5e5e5', '#d9d9d9'].includes(hex) ? null : hex
      }
      const swatchHex = (el: Element): string | null => {
        for (const t of [el, ...Array.from(el.querySelectorAll('span,i,div,em')).slice(0, 4)]) {
          const bg = window.getComputedStyle(t).backgroundColor
          if (bg && bg !== 'rgba(0, 0, 0, 0)') { const h = rgbToHex(bg); if (h) return h }
        }
        return null
      }
      const swatchName = (el: Element): string => {
        const raw = el.getAttribute('data-color-name') || el.getAttribute('data-color') ||
          el.getAttribute('data-swatch-value') ||
          ((el.getAttribute('aria-label') || '').replace(/\s*(selected|swatch)\s*/gi, '').trim()) ||
          el.getAttribute('title') || ''
        return raw.replace(/^\s*(?:colou?r|shade)[:\s/-]*/i, '').replace(/\s*(selected|swatch)\s*/gi, '').trim()
      }
      const skip = /^(add to|cart|close|search|menu|size|quantity|wishlist|share|zoom|back|next|prev)/i
      const seen = new Set<string>()
      const out: SwatchMeta[] = []
      
      // Target explicit color anchors and general swatches
      const allSwatches = Array.from(document.querySelectorAll(swatchSel + ', a[href*="color="], a[href*="shade="], [data-color-id]'))
      for (const el of allSwatches) {
        const name = swatchName(el)
        if (!name || name.length < 2 || name.length > 60 || skip.test(name)) continue
        const key = name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        let href: string | null = null
        if (el.tagName === 'A') {
          const h = (el as HTMLAnchorElement).href
          if (h && h.startsWith('http')) href = h
        } else {
          // Catch swatches wrapped inside an anchor tag
          const parentA = el.closest('a')
          if (parentA && parentA.href && parentA.href.startsWith('http')) href = parentA.href
        }
        let dataUrl = el.getAttribute('data-url') || el.getAttribute('data-href') ||
          el.getAttribute('data-product-url') || el.getAttribute('data-variant-url') ||
          el.getAttribute('data-pdp-url') || el.getAttribute('data-swatch-url') || null
        if (!dataUrl && el.getAttribute('data-color-id')) {
          dataUrl = `?color=${el.getAttribute('data-color-id')}`
        }
        out.push({ name, hex: swatchHex(el), href, dataUrl })
      }
      return out
    }, SWATCH_SEL)

    // Merge hex colors from swatches into variants already found via Shopify API,
    // and add any new variants found only in the DOM (non-Shopify sites).
    for (const m of metas) {
      if (seen.has(m.name.toLowerCase())) {
        // Already know this variant — just fill in hex if missing
        addVariant(m.name, null, m.hex)
        continue
      }
      // New variant (non-Shopify): try to get its URL from anchor href or data-url
      let url: string | null = null
      if (m.href && isValidVariantUrl(m.href)) {
        url = m.href
      } else if (m.dataUrl) {
        try {
          const resolved = new URL(m.dataUrl, finalUrl).href
          if (isValidVariantUrl(resolved)) url = resolved
        } catch { /* skip */ }
      }
      addVariant(m.name, url, m.hex)
    }

    // ── Strategy 4: Click-through for variants that still have no URL ─────
    // Only runs when Shopify strategies didn't find URLs (non-Shopify sites
    // where clicking a swatch updates the URL via pushState or full navigation).
    const noUrl = variants.filter(v => !v.url)
    const toClick = metas.filter(m => noUrl.some(v => v.name.toLowerCase() === m.name.toLowerCase()) && !m.href && !m.dataUrl)

    for (const meta of toClick.slice(0, 14)) {
      try {
        const urlBefore = page.url()
        const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => null)

        await page.evaluate((sel: string, targetName: string): void => {
          const getName = (el: Element): string => {
            const raw = el.getAttribute('data-color-name') || el.getAttribute('data-color') ||
              el.getAttribute('data-swatch-value') ||
              ((el.getAttribute('aria-label') || '').replace(/\s*(selected|swatch)\s*/gi, '').trim()) ||
              el.getAttribute('title') || ''
            return raw.replace(/^\s*(?:colou?r|shade)[:\s/-]*/i, '').replace(/\s*(selected|swatch)\s*/gi, '').trim()
          }
          for (const el of Array.from(document.querySelectorAll(sel))) {
            if (getName(el).toLowerCase() === targetName.toLowerCase()) {
              (el as HTMLElement).scrollIntoView({ block: 'center' });
              (el as HTMLElement).click()
              return
            }
          }
        }, SWATCH_SEL, meta.name).catch(() => {})

        await Promise.race([
          navPromise,
          page.waitForFunction(
            (prev: string) => window.location.href !== prev,
            { timeout: 3000 },
            urlBefore
          ).catch(() => null),
          new Promise(resolve => setTimeout(resolve, 3100)),
        ])

        const urlAfter = page.url()
        if (urlAfter !== urlBefore && isValidVariantUrl(urlAfter)) {
          addVariant(meta.name, urlAfter, meta.hex)
          if (new URL(urlAfter).pathname !== new URL(urlBefore).pathname) {
            await page.goto(finalUrl, { waitUntil: 'domcontentloaded', timeout: 12_000 })
          }
        }
      } catch { /* skip broken swatch */ }
    }

    await browser.close()
    return variants.filter(v => v.name && v.name.length > 1).slice(0, 24)
  } catch (err) {
    console.error('[click-through-variants]', err)
    try { await browser?.close() } catch { /* ignore */ }
    return []
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
    ? `KNOWN COLOR OPTIONS (from page data):\n${product.colorOptions.map((o) => `- ${o.name}${o.hex ? ` (${o.hex})` : ''}${o.imageUrl ? ` (Image: ${o.imageUrl})` : ''}${o.url ? ` (Link: ${o.url})` : ''}`).join('\n')}`
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
2. Analyze the CURRENTLY SHOWN color in the provided image(s).
   - colorScore (0-100): how well the currently shown color matches the user's palette.
   - bodyTypeScore (0-100): how well the silhouette/cut suits their body type. Set to null for non-clothing.
3. suggestedStyling: 1-2 sentences of specific, actionable styling advice for this item given their body type (e.g., tuck, belt, layer, hem length). Set to null if body type is not provided.
5. Evaluate EVERY color listed in KNOWN COLOR OPTIONS against the user's palette. Put them all in allOptions, sorted highest to lowest matchScore. Only include real scraped options — do NOT invent colors.
6. topColorPicks: choose exactly 3 entries from KNOWN COLOR OPTIONS (REAL product variants only — never invent a color). Each pick must come from a CLEARLY DIFFERENT hue family (e.g., one green, one blue, one blush — NOT three shades of brown). Pick the best representative from each distinct hue group. ONLY include picks that have a Link (url) in KNOWN COLOR OPTIONS — if fewer than 3 have links, return only those that do. Copy the exact url and imageUrl from KNOWN COLOR OPTIONS for each pick.

Return ONLY valid JSON (no markdown, no extra text):
{
  "productName": "<concise product name>",
  "productBrand": "<brand name or empty string>",
  "productCategory": "<clothing | makeup | jewelry | shoes | bags>",
  "colorScore": <integer 0-100>,
  "bodyTypeScore": <integer 0-100 or null>,
  "colorVerdict": "<perfect | great | good | fair | skip>",
  "bodyTypeVerdict": "<perfect | great | good | fair | skip | null>",
  "colorReasoning": "<1-2 sentences about the currently shown color vs the user's palette>",
  "fitReasoning": "<1-2 sentences about the silhouette/cut for clothing, or null>",
  "suggestedStyling": "<1-2 sentences of specific styling advice, or null>",
  "topColorPicks": [
    {
      "name": "<color name — must be from allOptions>",
      "hex": "<hex code>",
      "matchScore": <integer 0-100>,
      "verdict": "<perfect | great | good | fair | skip>",
      "reasoning": "<1 sentence why this hue works for them>",
      "url": "<exact Link from KNOWN COLOR OPTIONS or null>",
      "imageUrl": "<exact Image URL from KNOWN COLOR OPTIONS or null>"
    }
  ],
  "allOptions": [
    {
      "name": "<shade or color name>",
      "hex": "<best-guess hex code>",
      "url": "<exact Link from KNOWN COLOR OPTIONS or null>",
      "imageUrl": "<exact Image URL from KNOWN COLOR OPTIONS or null>",
      "matchScore": <integer 0-100>,
      "verdict": "<perfect | great | good | fair | skip>",
      "colorReasoning": "<1-2 sentences>",
      "fitReasoning": "<1-2 sentences for clothing or null>"
    }
  ],
  "overallRecommendation": "<one sentence summary>"
}

Scoring: perfect ≥ 88 · great ≥ 75 · good ≥ 60 · fair ≥ 45 · skip < 45
topColorPicks rules:
- ONLY use colors that appear verbatim in KNOWN COLOR OPTIONS — never make up a color.
- ONLY include a pick if it has a Link (url) from KNOWN COLOR OPTIONS.
- The 3 picks must be from clearly different hue families (not three variants of the same color).
- If fewer than 3 linkable options exist, return only those you have — do not pad with made-up entries.`
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
  let productMeta: { name: string; brand: string; price?: number; colorOptions: ColorOption[]; colorHints: string[] } = {
    name: '', brand: '', colorOptions: [], colorHints: [],
  }
  let productImageUrl: string | null = null  // stable URL to use for pin thumbnail

  // ── Build image blocks by input type ────────────────────────────────────
  if (type === 'image') {
    const mime = VALID_MIMES.includes(mediaType as ImageMime) ? mediaType as ImageMime : 'image/jpeg'
    imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: mime, data } })

  } else if (type === 'url') {
    // Run static scrape and Puppeteer color-URL discovery concurrently
    const [scraped, puppeteerColors] = await Promise.all([
      scrapeProduct(data),
      // Cap at 25s — click-through is thorough but bounded
      Promise.race([
        clickThroughColorVariants(data),
        new Promise<ColorOption[]>(resolve => setTimeout(() => resolve([]), 25_000)),
      ]),
    ])

    if (!scraped || scraped.imageUrls.length === 0) {
      res.status(422).json({
        error: "Couldn't load a product image from that URL.",
        hint: "Most big retailers block automated image loading. Try right-clicking the product photo → 'Copy image address' → paste that direct image URL here instead.",
      })
      return
    }

    // Merge Puppeteer-discovered color data into the static scrape results.
    // Puppeteer wins for URLs (JS-rendered hrefs) and hex (getComputedStyle).
    for (const pc of puppeteerColors) {
      const existing = scraped.colorOptions.find((o: ColorOption) => {
        const a = o.name.toLowerCase().replace(/\s+/g, ' ').trim()
        const b = pc.name.toLowerCase().replace(/\s+/g, ' ').trim()
        return a === b || a.includes(b) || b.includes(a)
      })
      if (existing) {
        if (pc.url) existing.url = pc.url        // always prefer Puppeteer URL
        if (pc.hex && !existing.hex) existing.hex = pc.hex
        if (pc.imageUrl && !existing.imageUrl) existing.imageUrl = pc.imageUrl
      } else {
        scraped.colorOptions.push(pc)
      }
    }

    productMeta = { name: scraped.name, brand: scraped.brand, price: scraped.price, colorOptions: scraped.colorOptions, colorHints: scraped.colorHints }
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
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: [...imageBlocks, { type: 'text', text: buildPrompt(palette, bodyType, productMeta) }],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in Claude response')
    const result = JSON.parse(match[0])

    const productUrl = type === 'url' ? data : null

    // Post-process: guarantee URLs are attached by matching AI output back to our scraped data
    const matchUrlsFromScrape = (opt: { name: string; url?: string | null; imageUrl?: string | null }) => {
      if (opt.url === 'null') opt.url = null
      if (opt.imageUrl === 'null') opt.imageUrl = null
      const scrapedMatch = productMeta.colorOptions.find((o) => {
        const oName = o.name.toLowerCase().trim()
        const aiName = opt.name.toLowerCase().trim()
        return oName === aiName || oName.includes(aiName) || aiName.includes(oName)
      })
      if (scrapedMatch) {
        if (scrapedMatch.url && (scrapedMatch.url.includes('?') || !opt.url || !opt.url.includes('?'))) {
          opt.url = scrapedMatch.url
        }
        if (scrapedMatch.imageUrl) opt.imageUrl = scrapedMatch.imageUrl
      }
      
      // Fallback: If no specific variant URL was found, provide the main product URL
      if (!opt.url && productUrl) {
        try {
          const u = new URL(productUrl)
          u.searchParams.set('color', opt.name)
          opt.url = u.href
        } catch {
          opt.url = productUrl
        }
      } else if (opt.url && productUrl) {
        try {
          const u1 = new URL(opt.url)
          const u2 = new URL(productUrl)
          if (u1.pathname === u2.pathname && !u1.search) {
            u1.searchParams.set('color', opt.name)
            opt.url = u1.href
          }
        } catch {}
      }
    }

    if (Array.isArray(result.allOptions)) {
      for (const opt of result.allOptions) matchUrlsFromScrape(opt)
      result.allOptions.sort((a: { matchScore: number }, b: { matchScore: number }) => b.matchScore - a.matchScore)
    }
    if (Array.isArray(result.topColorPicks)) {
      for (const pick of result.topColorPicks) matchUrlsFromScrape(pick)
      // Sort so the highest match score is always index 0 (badge target)
      result.topColorPicks.sort((a: { matchScore: number }, b: { matchScore: number }) => b.matchScore - a.matchScore)
    }

    res.json({ ...result, productImageUrl, productUrl, productPrice: productMeta.price ?? null })
  } catch (err) {
    console.error('[product-check]', err)
    res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
})

export default router
