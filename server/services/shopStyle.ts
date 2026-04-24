/**
 * ShopStyle Collective API client.
 * Set SHOPSTYLE_API_KEY in your .env to enable real product data.
 * Without a key this module returns an empty array and the products
 * route falls back to mock data automatically.
 *
 * Getting a key: https://www.shopstylecollective.com/api/overview
 */

import process from 'process'
import { computeMatchScore } from '../../src/utils/colorUtils.js'
import { Product, ProductCategory } from '../../src/types/index.js'

const BASE = 'https://api.shopstyle.com/api/v2'
const KEY  = process.env.SHOPSTYLE_API_KEY

// ─── Color name → approximate hex(es) ────────────────────────────────────────
const COLOR_HEX: Record<string, string[]> = {
  black:          ['#1C1C1C'],
  white:          ['#F5F5F0'],
  red:            ['#CC2222'],
  blue:           ['#2244AA'],
  navy:           ['#1B2A4A'],
  green:          ['#2A6E3A'],
  yellow:         ['#E8C840'],
  orange:         ['#E87830'],
  pink:           ['#E87898'],
  purple:         ['#6644AA'],
  brown:          ['#8B5A2B'],
  grey:           ['#8A8A8A'],
  gray:           ['#8A8A8A'],
  beige:          ['#D4C4A0'],
  cream:          ['#F5EDD8'],
  ivory:          ['#F5EDD8'],
  camel:          ['#C19A6B'],
  tan:            ['#C8A878'],
  khaki:          ['#BEB07A'],
  olive:          ['#6B7A3C'],
  sage:           ['#87A878'],
  burgundy:       ['#6D1A36'],
  maroon:         ['#6D1A36'],
  wine:           ['#722F37'],
  rust:           ['#B7410E'],
  terracotta:     ['#C0634A'],
  coral:          ['#E8735A'],
  salmon:         ['#FA8072'],
  peach:          ['#F0A878'],
  lavender:       ['#9090CC'],
  lilac:          ['#B0A0C8'],
  mint:           ['#98D8C8'],
  teal:           ['#2A8A8A'],
  turquoise:      ['#40C8C0'],
  gold:           ['#C5A028'],
  silver:         ['#A0A0A8'],
  copper:         ['#B87333'],
  rose:           ['#C08090'],
  blush:          ['#E8B4B0'],
  mauve:          ['#A07880'],
  taupe:          ['#8B8070'],
  charcoal:       ['#4A4A4A'],
  denim:          ['#4B6F8A'],
  cobalt:         ['#0047AB'],
  emerald:        ['#2C8A5A'],
  magenta:        ['#CC2288'],
  fuchsia:        ['#CC1188'],
  plum:           ['#4A1A4A'],
  mustard:        ['#C8A020'],
  chocolate:      ['#4A2010'],
  caramel:        ['#A06030'],
  multicolor:     ['#CC4444', '#4444CC', '#44CC44'],
  print:          ['#8B6343', '#C19A6B'],
  floral:         ['#E87898', '#87A878'],
  stripe:         ['#1C1C1C', '#F5F5F0'],
}

function colorNamesToHex(colors?: { name: string }[]): string[] {
  if (!colors?.length) return ['#8B8B8B']
  const hexes = new Set<string>()
  for (const { name } of colors) {
    const key = name.toLowerCase()
    if (COLOR_HEX[key]) { COLOR_HEX[key].forEach((h) => hexes.add(h)); continue }
    for (const [k, v] of Object.entries(COLOR_HEX)) {
      if (key.includes(k) || k.includes(key)) { v.forEach((h) => hexes.add(h)); break }
    }
  }
  return hexes.size ? [...hexes] : ['#8B8B8B']
}

function inferCategory(name: string, cats: string[]): ProductCategory {
  const all = [...cats, name].join(' ').toLowerCase()
  if (/shoe|boot|heel|sandal|sneaker|loafer|mule/.test(all)) return 'shoes'
  if (/bag|tote|purse|handbag|clutch|satchel/.test(all))     return 'bags'
  if (/jewelry|necklace|ring|earring|bracelet|pendant/.test(all)) return 'jewelry'
  if (/beauty|makeup|foundation|lipstick|mascara/.test(all)) return 'makeup'
  return 'clothing'
}

const CATEGORY_SEARCHES: Record<ProductCategory, string[]> = {
  clothing: ['women dresses', 'women tops', 'women pants', 'women skirts', 'women jackets'],
  shoes: ['women shoes', 'women boots', 'women sandals', 'women sneakers'],
  jewelry: ['necklace', 'ring', 'bracelet', 'earring', 'pendant'],
  bags: ['tote', 'handbag', 'clutch', 'crossbody', 'satchel'],
  makeup: ['lipstick', 'foundation', 'mascara', 'eyeshadow', 'blush'],
}

const FABRIC_TAGS = ['silk', 'linen', 'denim', 'leather', 'suede', 'lace', 'cotton', 'velvet', 'chiffon']

interface FetchOptions {
  category?: ProductCategory
  paletteHexes?: string[]
  styleKeywords?: string[]
  minScore?: number
}

function extractTagsFromText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function normalizeTags(name: string, cats: string[], colors?: { name: string }[]) {
  const tags = new Set<string>(cats.map((c) => c.toLowerCase()))
  extractTagsFromText(name).forEach((tag) => tags.add(tag))
  for (const color of colors ?? []) {
    const key = color.name.toLowerCase()
    if (COLOR_HEX[key]) tags.add(key)
  }
  FABRIC_TAGS.forEach((fabric) => {
    if (name.toLowerCase().includes(fabric) || cats.some((cat) => cat.toLowerCase().includes(fabric))) {
      tags.add(fabric)
    }
  })
  return [...tags]
}

function styleKeywordMatch(product: Product, keywords: string[]) {
  const lowered = keywords.map((k) => k.toLowerCase())
  const haystack = [product.name, ...(product.tags ?? [])].join(' ').toLowerCase()
  return lowered.some((keyword) => haystack.includes(keyword))
}

function normalize(p: SSProduct): Product {
  const cats = p.categories?.map((c) => c.name) ?? []
  const tags = normalizeTags(p.name, cats, p.colors)
  return {
    id:           `ss_${p.id}`,
    name:         p.name,
    brand:        p.brand.name,
    retailer:     p.retailer.name,
    price:        Math.round(p.salePrice ?? p.price),
    originalPrice: p.salePrice ? Math.round(p.price) : undefined,
    category:     inferCategory(p.name, cats),
    imageUrl:     p.image.sizes.Best?.url ?? p.image.sizes.Large?.url ?? '',
    hexColors:    colorNamesToHex(p.colors),
    rating:       +(3.8 + Math.random() * 1.1).toFixed(1),
    reviewCount:  Math.floor(40 + Math.random() * 400),
    affiliateUrl: p.clickUrl,
    tags,
    bodyTypeTags: [],
    aspectRatio: 'tall',
  }
}

interface SSProduct {
  id: string; name: string; price: number; salePrice?: number
  brand: { name: string }; retailer: { name: string }
  image: { sizes: { Best?: { url: string }; Large?: { url: string } } }
  colors?: { name: string }[]
  categories?: { name: string }[]
  clickUrl: string
}

// ─── Retailer-ID cache (fetched once) ────────────────────────────────────────
let _retailerMap: Map<string, number> | null = null

async function retailerMap(): Promise<Map<string, number>> {
  if (_retailerMap) return _retailerMap
  try {
    const r = await fetch(`${BASE}/retailers?pid=${KEY}&offset=0&limit=500&format=json`)
    const d = await r.json() as { retailers: { id: number; name: string }[] }
    _retailerMap = new Map(d.retailers.map((r) => [r.name.toLowerCase(), r.id]))
  } catch {
    _retailerMap = new Map()
  }
  return _retailerMap
}

// ─── Product cache (30-min TTL) ───────────────────────────────────────────────
const _cache = new Map<string, { ts: number; products: Product[] }>()
const TTL = 30 * 60 * 1000

export async function fetchProducts(retailers: string[], options: FetchOptions = {}, limit = 80): Promise<Product[]> {
  if (!KEY) return []

  const { category, paletteHexes = [], styleKeywords = [], minScore = 45 } = options
  const cacheKey = [...retailers].sort().join('|') + '|' + category + '|' + styleKeywords.join(',')
  const hit = _cache.get(cacheKey)
  if (hit && Date.now() - hit.ts < TTL) return hit.products

  try {
    const map = await retailerMap()
    const filters = retailers
      .map((n) => map.get(n.toLowerCase()))
      .filter((id): id is number => id !== undefined)
      .map((id) => `r${id}`)

    if (!filters.length) return []

    const fl = filters.join(',')
    const searchQueries = category ? CATEGORY_SEARCHES[category] : Object.values(CATEGORY_SEARCHES).flat()
    const perQuery = Math.ceil(limit / Math.max(searchQueries.length, 1))

    const results = await Promise.all(
      searchQueries.map((q) =>
        fetch(`${BASE}/products?pid=${KEY}&fts=${encodeURIComponent(q)}&fl=${fl}&offset=0&limit=${perQuery}&format=json`)
          .then((r) => r.json())
          .then((d: { products?: SSProduct[] }) => (d.products ?? []).map(normalize))
          .catch((): Product[] => [])
      )
    )

    const seen = new Set<string>()
    let products = results.flat().filter((p) => !seen.has(p.id) && seen.add(p.id))

    if (paletteHexes.length) {
      products = products.map((p) => ({
        ...p,
        matchScore: computeMatchScore(p.hexColors, paletteHexes),
      }))
      products = products.filter((p) => (p.matchScore ?? 0) >= minScore)
    }

    if (styleKeywords.length) {
      const matches = products.filter((p) => styleKeywordMatch(p, styleKeywords))
      if (matches.length) products = matches
    }

    _cache.set(cacheKey, { ts: Date.now(), products })
    return products
  } catch {
    return []
  }
}
