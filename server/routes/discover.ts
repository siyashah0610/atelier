import { Router, Request, Response } from 'express'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { Product, ProductCategory, ColorOption } from '../../src/types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PRODUCTS_DIR = join(__dirname, '../../products')

// ── Color name → hex ──────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  white: '#FFFFFF', 'off white': '#F5F0E8', 'off-white': '#F5F0E8',
  cream: '#FFFDD0', ivory: '#FFFFF0', ecru: '#C2B280', vanilla: '#F3E5AB',
  alabaster: '#F2F0EB', eggshell: '#F0EAD6', chalk: '#F5F2EE',
  'fior di latte': '#FFF8F0', porcelain: '#F2EDE9', birch: '#C5B8A3',
  bone: '#E3DAC9', linen: '#FAF0E6', butter: '#FFF0A0', natural: '#EAE0D5',
  milk: '#FAFAFA', snow: '#FFFAFA', pearl: '#EAE0C8', parchment: '#F1E9D2',
  oatmeal: '#D9C9A3', biscuit: '#D4A96A', sand: '#C2B280', dune: '#C8A882',
  black: '#000000', 'jet black': '#0A0A0A', onyx: '#353935',
  charcoal: '#36454F', graphite: '#474A51', 'dark grey': '#555555',
  slate: '#708090', 'smoke grey': '#848884',
  grey: '#808080', gray: '#808080', silver: '#C0C0C0', ash: '#B2BEB5',
  smoke: '#738276', 'light grey': '#D3D3D3', 'light gray': '#D3D3D3',
  heather: '#C9C9C9', cement: '#8D8878', stone: '#8C8680', pebble: '#A89880',
  brown: '#8B4513', tan: '#D2B48C', camel: '#C19A6B', khaki: '#C3B091',
  latte: '#AC7E59', mocha: '#967259', espresso: '#4B2F2F',
  toffee: '#BB8E50', coffee: '#6F4E37', cafe: '#6F4E37', 'café': '#6F4E37',
  cocoa: '#7B3F00', walnut: '#5C4033', taupe: '#8B8589',
  peanut: '#B5651D', tobacco: '#84563C', amber: '#FFBF00',
  caramel: '#C68642', honey: '#ECA84A', almond: '#EED9C4',
  mole: '#7B6457', mushroom: '#8D7B6A', clay: '#A87858',
  sienna: '#A0522D', umber: '#635147', bark: '#7B5C3B', saddle: '#8B4513',
  whiskey: '#B57040', chestnut: '#954535', ginger: '#B06000',
  nutmeg: '#753A23', pecan: '#A97547', praline: '#B07E5B',
  tawny: '#CD5700', fawn: '#E5AA70', hazel: '#8E7618', beige: '#F5F5DC',
  navy: '#001F5B', 'dark navy': '#000E3D', 'dark blue': '#00008B',
  indigo: '#4B0082', midnight: '#191970', 'midnight blue': '#191970',
  marine: '#01214B', admiral: '#003399', cobalt: '#0047AB',
  blue: '#0047AB', 'royal blue': '#4169E1', sapphire: '#0F52BA',
  'steel blue': '#4682B4', cornflower: '#6495ED', periwinkle: '#CCCCFF',
  ocean: '#0077B6', cerulean: '#007BA7', azure: '#0080FF',
  'sky blue': '#87CEEB', 'baby blue': '#89CFF0', 'powder blue': '#B0E0E6',
  'light blue': '#ADD8E6', chambray: '#5B7FA6', denim: '#1560BD',
  storm: '#4F666A', teal: '#008080', turquoise: '#40E0D0', aqua: '#00BFFF',
  ripple: '#4B7FB5', harbor: '#2E4FA3', villa: '#4A6FA5',
  green: '#228B22', 'dark green': '#006400', 'forest green': '#228B22',
  forest: '#228B22', hunter: '#355E3B', emerald: '#009B77',
  jade: '#00A86B', moss: '#8A9A5B', sage: '#77866A', olive: '#808000',
  army: '#4B5320', 'army green': '#4B5320', basil: '#4B6043',
  fern: '#71BC78', pistachio: '#93C572', leaf: '#5D8233',
  avocado: '#568203', eucalyptus: '#44837A', seafoam: '#9FE2BF',
  seagrass: '#737F3E', agave: '#8DA888', willow: '#7B8F6A',
  mint: '#98FF98', spearmint: '#99E5B0', jungle: '#29AB87',
  chartreuse: '#7FFF00', lime: '#32CD32', botanical: '#4A6741',
  pickle: '#697A21', camo: '#78866B', military: '#4A5240',
  red: '#CC0000', 'bright red': '#FF0000', scarlet: '#FF2400',
  crimson: '#DC143C', cherry: '#DE3163', tomato: '#FF6347',
  raspberry: '#E30B5C', burgundy: '#800020', wine: '#722F37',
  maroon: '#800000', cranberry: '#9C2542', berry: '#8E3A59',
  mulberry: '#C54B8C', bordeaux: '#4B0020', oxblood: '#4A0000',
  claret: '#7F1734', rust: '#B7410E', terracotta: '#E2725B',
  brick: '#CB4154', adobe: '#CC6633', 'burnt orange': '#CC5500',
  pink: '#FFB6C1', 'light pink': '#FFB6C1', 'baby pink': '#F4C2C2',
  blush: '#DE5D83', 'dusty rose': '#DCAE96', rose: '#FF007F',
  'hot pink': '#FF69B4', fuchsia: '#FF00FF', magenta: '#FF00FF',
  flamingo: '#FC8EAC', bubblegum: '#FFC1CC', 'blush pink': '#FF6F91',
  petal: '#FFDDE1', rouge: '#AB4E52', mauve: '#C8A2C8',
  'dusty pink': '#DCAE96', 'dusty mauve': '#C4A0A0', rosewood: '#9A4444',
  melon: '#FEBAAD', salmon: '#FA8072', peach: '#FFCBA4',
  nude: '#E3BC9A', 'dusty peach': '#EFBFAD', apricot: '#FBCEB1',
  coral: '#FF7F50',
  purple: '#800080', plum: '#8E4585', eggplant: '#614051',
  grape: '#6F2DA8', violet: '#EE82EE', lavender: '#B57EDC',
  lilac: '#B784A7', wisteria: '#C9A0DC', orchid: '#DA70D6',
  amethyst: '#9966CC', iris: '#5A4FCF', 'sweet pea': '#F3D1DC',
  yellow: '#FFD700', 'bright yellow': '#FFFF00', lemon: '#FFF44F',
  buttercup: '#F3AD16', mustard: '#FFDB58', saffron: '#F4C430',
  gold: '#FFD700', golden: '#DAA520', marigold: '#EAA221',
  sunflower: '#FFC512', citrus: '#FFA500', orange: '#FF8C00',
  tangerine: '#F28500', mango: '#FF9000', turmeric: '#CFA22C',
  corn: '#E8C84B', lemonade: '#FFF44F', ochre: '#CC7722',
  butterscotch: '#E88A2B',
  metallic: '#C0C0C0', bronze: '#CD7F32', copper: '#B87333',
  gunmetal: '#2C3539',
}

function colorNameToHex(name: string): string {
  if (!name) return '#808080'
  const lower = name.toLowerCase().trim()
  if (/^#[0-9a-f]{6}$/i.test(lower)) return lower.toUpperCase()
  if (COLOR_HEX[lower]) return COLOR_HEX[lower]
  const parts = lower.split(/[\s\-\/]/)
  const first = parts[0]
  if (COLOR_HEX[first]) return COLOR_HEX[first]
  const last = parts[parts.length - 1]
  if (COLOR_HEX[last]) return COLOR_HEX[last]
  const twoWord = parts.slice(0, 2).join(' ')
  if (COLOR_HEX[twoWord]) return COLOR_HEX[twoWord]
  return '#808080'
}

function mapCategory(raw: string | undefined): ProductCategory {
  const s = (raw ?? '').toLowerCase()
  if (/shoe|heel|boot|sandal|sneaker|loafer|flat|pump|mule|slipper|stiletto/.test(s)) return 'shoes'
  if (/bag|handbag|purse|clutch|tote|backpack|wallet/.test(s)) return 'bags'
  if (/jewelry|jewellery|necklace|earring|bracelet|ring|pendant/.test(s)) return 'jewelry'
  if (/makeup|beauty|cosmetic|lipstick|mascara/.test(s)) return 'makeup'
  return 'clothing'
}

async function fetchWithCurl(url: string, headers?: Record<string, string>): Promise<any> {
  try {
    // Build curl command with headers
    let cmd = `curl -s '${url.replace(/'/g, "'\\''")}'`
    const allHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      ...headers,
    }

    for (const [key, value] of Object.entries(allHeaders)) {
      cmd += ` -H '${(key + ': ' + value).replace(/'/g, "'\\''")}'`
    }

    const result = execSync(cmd, {
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
      shell: '/bin/bash'
    })

    if (!result || !result.trim()) return null
    return JSON.parse(result)
  } catch (e) {
    return null
  }
}

// ── Shared ProductGroup type ──────────────────────────────────────────────────

interface RawColorOption { name: string; hex: string; url: string; imageUrl: string }

interface ProductGroup {
  id: string
  name: string
  brand: string
  retailer: string
  price: number
  originalPrice?: number
  category: ProductCategory
  primaryImageUrl: string
  allColorOptions: RawColorOption[]
  sizes: string[]
  rating: number
  reviewCount: number
  tags: string[]
}

// ── Color math ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  let rn = r / 255, gn = g / 255, bn = b / 255
  rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92
  gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92
  bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92
  const x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047
  const y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.0
  const z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

function deltaE(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1), rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 100
  const [l1, a1, b1] = rgbToLab(...rgb1)
  const [l2, a2, b2] = rgbToLab(...rgb2)
  return Math.sqrt((l2 - l1) ** 2 + (a2 - a1) ** 2 + (b2 - b1) ** 2)
}

function hexScore(productHex: string, paletteHexes: string[]): number {
  let minD = Infinity
  for (const ph of paletteHexes) {
    const d = deltaE(productHex, ph)
    if (d < minD) minD = d
  }
  return Math.round(Math.max(0, 100 - minD * 1.8))
}

// ── Color family for diversity interleaving ───────────────────────────────────

function colorFamily(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return 'neutral'
  const [r, g, b] = rgb
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 510
  if (l < 0.12) return 'black'
  if (l > 0.88) return 'white'
  const s = max === min ? 0 : (l < 0.5 ? (max - min) / (max + min) : (max - min) / (510 - max - min))
  if (s < 0.12) return 'neutral'
  const h = max === r
    ? 60 * ((g - b) / (max - min))
    : max === g
      ? 120 + 60 * ((b - r) / (max - min))
      : 240 + 60 * ((r - g) / (max - min))
  const hue = ((h % 360) + 360) % 360
  if (hue < 20 || hue >= 340) return 'red'
  if (hue < 50) return 'orange'
  if (hue < 80) return 'yellow'
  if (hue < 160) return 'green'
  if (hue < 225) return 'teal'
  if (hue < 285) return 'blue'
  return 'purple'
}

const FAMILY_ORDER = ['neutral', 'black', 'white', 'blue', 'green', 'red', 'purple', 'orange', 'yellow', 'teal']

function interleaveByFamily<T extends { primaryHex: string }>(items: T[]): T[] {
  const buckets = new Map<string, T[]>()
  for (const fam of FAMILY_ORDER) buckets.set(fam, [])
  for (const item of items) {
    const fam = colorFamily(item.primaryHex)
    ;(buckets.get(fam) ?? buckets.get('neutral')!).push(item)
  }
  const result: T[] = []
  const arrays = FAMILY_ORDER.map((f) => buckets.get(f)!)
  const maxLen = Math.max(...arrays.map((a) => a.length))
  for (let i = 0; i < maxLen; i++) {
    for (const arr of arrays) {
      if (i < arr.length) result.push(arr[i])
    }
  }
  return result
}

// ── Reliable fallback catalog (used when live endpoints are flaky) ─────────

function makeFallbackGroup(
  id: string,
  name: string,
  brand: string,
  retailer: string,
  price: number,
  category: ProductCategory,
  imageUrl: string,
  tags: string[] = []
): ProductGroup {
  return {
    id,
    name,
    brand,
    retailer,
    price,
    category,
    primaryImageUrl: imageUrl,
    allColorOptions: [{
      name: brand,
      hex: colorNameToHex(brand),
      url: imageUrl,
      imageUrl,
    }],
    sizes: ['XS', 'S', 'M', 'L'],
    rating: 4.2,
    reviewCount: 80,
    tags,
  }
}

function loadReliableFallbackCatalog(): ProductGroup[] {
  return [
    makeFallbackGroup('fallback-aritzia-1', 'Aritzia Core Knit', 'Aritzia', 'Aritzia', 78, 'clothing', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', ['Aritzia', 'knit']),
    makeFallbackGroup('fallback-ref-1', 'Reformation Everyday Dress', 'Reformation', 'Reformation', 98, 'clothing', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', ['Reformation', 'dress']),
    makeFallbackGroup('fallback-pp-1', 'Princess Polly Statement Set', 'Princess Polly', 'Princess Polly', 69, 'clothing', 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=900&q=80', ['Princess Polly', 'statement']),
    makeFallbackGroup('fallback-edikted-1', 'Edikted Signature Layer', 'Edikted', 'Edikted', 64, 'clothing', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', ['Edikted', 'layer']),
    makeFallbackGroup('fallback-bm-1', 'Brandy Melville Classic Knit', 'Brandy Melville', 'Brandy Melville', 54, 'clothing', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', ['Brandy Melville', 'classic']),
    makeFallbackGroup('fallback-uniqlo-1', 'UNIQLO Essentials Layer', 'UNIQLO', 'UNIQLO', 39, 'clothing', 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=900&q=80', ['UNIQLO', 'essentials']),
  ]
}

// ── Static file loaders (used as immediate fallback) ──────────────────────────

// Aritzia's product-image CDN path is /image/upload/, not /aritzia/image/upload/.
// Their swatch URLs end in `_sw` — the on-model product photo for the same color
// uses the `_on_a` suffix.
function aritziaProductImageUrl(swatchUrlOrPublicId: string | undefined): string {
  if (!swatchUrlOrPublicId) return ''
  const cleaned = String(swatchUrlOrPublicId)
    .replace(/\?.*$/, '')
    .replace('/aritzia/image/upload/', '/image/upload/')
  return cleaned.replace(/_sw$/, '_on_a')
}
function normalizePrice(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(n) ? n : 0
  }
  if (value && typeof value === 'object') {
    const candidate = (value as any).min ?? (value as any).price ?? (value as any).amount ?? (value as any).value
    const n = typeof candidate === 'number' ? candidate : Number(String(candidate ?? ''))
    return Number.isFinite(n) ? n : 0
  }
  return 0
}
function loadAritziaStatic(): ProductGroup[] {
  try {
    const raw = JSON.parse(readFileSync(join(PRODUCTS_DIR, 'aritzia_us_product_catalog.json'), 'utf-8'))
    return (raw.products as any[]).map((p) => ({
      id: `aritzia-${p.masterId}`,
      name: p.name,
      brand: 'Aritzia',
      retailer: 'Aritzia',
      price: normalizePrice(p.priceRange?.min),
      originalPrice: p.onSale ? normalizePrice(p.priceRange?.max) : undefined,
      category: mapCategory(p.subCategory || p.category),
      primaryImageUrl: aritziaProductImageUrl(p.colorVariants?.[0]?.swatchImageUrl),
      allColorOptions: (p.colorVariants ?? []).map((cv: any) => ({
        name: cv.colorName ?? '',
        hex: colorNameToHex(cv.colorFamily || cv.colorName),
        url: cv.url,
        imageUrl: aritziaProductImageUrl(cv.swatchImageUrl),
      })),
      sizes: p.availableSizes ?? [],
      rating: p.rating ?? 4.2,
      reviewCount: p.reviewCount ?? 50,
      tags: [p.subCategory, ...(Array.isArray(p.fabric) ? p.fabric : [p.fabric])].filter((t): t is string => typeof t === 'string' && !!t),
    }))
  } catch {
    return []
  }
}

function loadPPStatic(): ProductGroup[] {
  try {
    const raw = JSON.parse(readFileSync(join(PRODUCTS_DIR, 'princess_polly_all_products.json'), 'utf-8')) as any[]
    return raw.map((p) => {
      const colors: string[] = p.colors ?? []
      const image = (p.images as string[] | undefined)?.[0] ?? ''
      const price = typeof p.price_min === 'number' ? p.price_min : parseFloat(String(p.price_min ?? 0))
      const productUrl = p.product_url as string
      return {
        id: `pp-${p.product_id}`,
        name: p.name,
        brand: 'Princess Polly',
        retailer: 'Princess Polly',
        price,
        category: mapCategory(p.product_type),
        primaryImageUrl: image,
        allColorOptions: colors.length
          ? colors.map((c) => ({ name: c, hex: colorNameToHex(c), url: productUrl, imageUrl: image }))
          : [{ name: '', hex: colorNameToHex(p.name), url: productUrl, imageUrl: image }],
        sizes: p.sizes ?? [],
        rating: 4.3,
        reviewCount: 120,
        tags: (p.tags as string[] | undefined)?.slice(0, 8) ?? [],
      }
    })
  } catch {
    return []
  }
}

function loadReformationStatic(): ProductGroup[] {
  try {
    const raw = JSON.parse(readFileSync(join(PRODUCTS_DIR, 'reformation_products (1).json'), 'utf-8'))
    return (raw.products as any[]).map((p) => ({
      id: `ref-${p.base_product_id}`,
      name: p.title,
      brand: 'Reformation',
      retailer: 'Reformation',
      price: parseFloat(String(p.price ?? '0').replace(/[^0-9.]/g, '')) || 0,
      category: mapCategory(p.category),
      primaryImageUrl: '',
      allColorOptions: (p.available_colors ?? []).map((cv: any) => ({
        name: cv.color_name as string,
        hex: colorNameToHex(cv.color_name),
        url: cv.url as string,
        imageUrl: '',
      })),
      sizes: [],
      rating: 4.4,
      reviewCount: 80,
      tags: [p.category].filter(Boolean) as string[],
    }))
  } catch {
    return []
  }
}

// ── Live API fetchers (run in background) ─────────────────────────────────────

const SLEEP = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Helper: Fetch all colors for a Shopify product
async function fetchAritziaAlgolia(): Promise<ProductGroup[]> {
  const APP_ID = 'SONLJM8OH6'
  const API_KEY = '1455bca7c6c33e746a0f38beb28422e6'
  const INDEX = 'production_ecommerce_aritzia__Aritzia_US__products__en_US'
  const HIT_SIZE = 200
  const algoliaEndpoints = [
    'https://SONLJM8OH6-dsn.algolia.net/1/indexes/*/queries',
    'https://search-0.aritzia.com/1/indexes/*/queries',
    'https://search-1.aritzia.com/1/indexes/*/queries',
    'https://search-2.aritzia.com/1/indexes/*/queries',
    'https://search-3.aritzia.com/1/indexes/*/queries',
  ]
  const algoliaHeaders = {
    'X-Algolia-Application-Id': APP_ID,
    'X-Algolia-API-Key': API_KEY,
    'Content-Type': 'application/json',
  }
  const makeBody = (page: number, hitsPerPage: number) => JSON.stringify({
    requests: [{
      indexName: INDEX,
      params: `query=&hitsPerPage=${hitsPerPage}&page=${page}&filters=orderable%3Atrue%20OR%20searchableIfUnavailable%3Atrue%20AND%20_tags%3Ais_not_duplicate&facetFilters=[]&enableABTest=true`,
    }],
  })

  const fetchWithFallback = async (page: number, hitsPerPage: number) => {
    let lastError: unknown
    for (const endpoint of algoliaEndpoints) {
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: algoliaHeaders, body: makeBody(page, hitsPerPage) })
        if (!res.ok) throw new Error(`Algolia ${res.status} from ${endpoint}`)
        return await res.json() as any
      } catch (err) {
        lastError = err
      }
    }
    throw lastError instanceof Error ? lastError : new Error('All Aritzia Algolia endpoints failed')
  }

  const firstData = await fetchWithFallback(0, 1)
  const nbHits: number = firstData?.results?.[0]?.nbHits ?? 0
  const nbPages = Math.min(80, Math.ceil(nbHits / HIT_SIZE))

  const allHits: any[] = []
  for (let p = 0; p < nbPages; p++) {
    const data = await fetchWithFallback(p, HIT_SIZE)
    allHits.push(...(data?.results?.[0]?.hits ?? []))
    if (p < nbPages - 1) await SLEEP(80)
  }

  // Each Algolia hit = one color variant; group by masterId
  const byMaster = new Map<string, any[]>()
  for (const hit of allHits) {
    const mid = String(hit.masterId ?? (String(hit.objectID ?? '')).split('-')[0])
    if (!mid || mid === 'undefined') continue
    if (!byMaster.has(mid)) byMaster.set(mid, [])
    byMaster.get(mid)!.push(hit)
  }

  const buildAritziaUrl = (publicId: string | undefined): string =>
    publicId ? `https://assets.aritzia.com/image/upload/f_auto,q_auto/${publicId}` : ''

  const buildProductUrl = (slug: string | undefined, colorId: string | undefined): string => {
    if (!slug) return ''
    const base = `https://www.aritzia.com/us/en/product/${slug}`
    return colorId ? `${base}?color=${colorId}` : base
  }

  const groups: ProductGroup[] = []
  for (const [masterId, hits] of byMaster) {
    const p = hits[0]

    // Collect all color variants from the grouped hits
    // In Algolia, each hit for the same masterId is typically a different color variant
    const variants = hits.map((h: any) => {
      const colorName = h.trueColor ?? h.colorName ?? ''
      const colorFamily = h.refinementColor ?? h.colorFamily ?? ''
      const colorId = h.color ?? h.colorId ?? ''
      const slug = h.slug ?? p.slug ?? ''
      const defaultImage = h.defaultImage ?? p.defaultImage
      return {
        colorName,
        colorFamily,
        colorId,
        url: h.productUrl ?? buildProductUrl(slug, colorId),
        imageUrl: buildAritziaUrl(defaultImage) || aritziaProductImageUrl(h.swatchImageUrl),
        sizes: h.shippableSizes ?? h.availableSizes ?? h.sizeRun ?? [],
      }
    }).filter((v: any) => v.colorName) // Filter out variants without color names

    const priceRange = p.price ?? p.priceRange ?? {}
    groups.push({
      id: `aritzia-${masterId}`,
      name: p.c_displayName || p.name || '',
      brand: 'Aritzia',
      retailer: 'Aritzia',
      price: normalizePrice(priceRange.min ?? priceRange),
      originalPrice: p.onSale ? normalizePrice(priceRange.max) : undefined,
      category: mapCategory(p.primaryCategoryId || p.subCategory || p.category),
      primaryImageUrl: buildAritziaUrl(p.defaultImage) || variants[0]?.imageUrl || '',
      allColorOptions: variants.map((cv: any) => ({
        name: cv.colorName,
        hex: colorNameToHex(cv.colorFamily || cv.colorName),
        url: cv.url,
        imageUrl: cv.imageUrl,
      })),
      sizes: p.shippableSizes ?? p.availableSizes ?? variants[0]?.sizes ?? [],
      rating: p.rating ?? 4.2,
      reviewCount: p.reviewCount ?? 50,
      tags: [p.subDept?.[0], p.primaryCategoryId, p.fabric?.[0]].filter(Boolean) as string[],
    })
  }
  return groups
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchReformationLiveProducts(): Promise<ProductGroup[]> {
  const groups: ProductGroup[] = []
  const seen = new Set<string>()
  const base = 'https://www.thereformation.com/on/demandware.store/Sites-reformation-us-Site/en_US/Search-ShowAjax'

  const decodeEntities = (value: string) => value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')

  const maxPages = 6
  for (let start = 0, page = 0; page < maxPages; start += 100, page++) {
    const url = `${base}?cgid=clothing&start=${start}&sz=100`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) break

    const html = await res.text()
    const tilePattern = /data-pid="([^"]+)"[\s\S]{0,4000}?data-aggregate='([^']+)'[\s\S]{0,4000}?<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["'][\s\S]{0,4000}?<img[^>]+alt=["']([^"']+)["'][^>]*>/gi

    for (const match of html.matchAll(tilePattern)) {
      const pid = match[1]?.trim()
      const aggregateRaw = decodeEntities(match[2] ?? '')
      const imageUrl = match[3]?.trim() ?? ''
      const altText = match[4]?.trim() ?? ''
      const hrefMatch = match[0].match(/href="([^"]+)"/i)
      const href = hrefMatch?.[1] ? `https://www.thereformation.com${hrefMatch[1]}` : ''

      if (!pid || !imageUrl || seen.has(pid)) continue

      let price = 0
      let category = 'clothing'
      let name = altText

      try {
        const aggregate = JSON.parse(aggregateRaw)
        const product = aggregate?.trackObject?.ecommerce?.click?.products?.[0] ?? {}
        price = Number(product.price) || 0
        category = String(product.category || 'clothing').toLowerCase()
        name = String(product.name || altText)
      } catch {
        // fall back to the tile text if aggregate parsing fails
      }

      seen.add(pid)

      // Extract color from product title/alt text (product page fetching too slow for now)
      const colorName = altText.split(' - ').pop()?.trim() || name
      const allColors = [{
        name: colorName,
        hex: colorNameToHex(colorName),
        url: href,
        imageUrl,
      }]

      groups.push({
        id: `ref-${pid}`,
        name,
        brand: 'Reformation',
        retailer: 'Reformation',
        price: normalizePrice(price),
        category: mapCategory(category),
        primaryImageUrl: imageUrl,
        allColorOptions: allColors,
        sizes: [],
        rating: 4.4,
        reviewCount: 80,
        tags: [category].filter(Boolean) as string[],
      })
    }

    if (html.includes('data-search-component="search-main"') && !/data-pid="/.test(html)) break
    if ((html.match(/data-pid="/g)?.length ?? 0) < 100) break
  }

  return groups
}

async function fetchShopifyAll(
  storeUrl: string,
  brand: string,
  retailer: string,
  ratingDefault: number
): Promise<ProductGroup[]> {
  const groups: ProductGroup[] = []
  const seen = new Set<string>()
  let page = 1

  while (page <= 30) {
    const collectionUrl = `${storeUrl}/collections/all/products.json?limit=250&page=${page}`
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': `${storeUrl}/collections/all`,
      'Cache-Control': 'no-cache',
    }
    try {
      const data = await fetchWithCurl(collectionUrl, headers)
      if (!data) {
        if (page === 1) return []
        break
      }
      const products: any[] = data.products ?? []
      if (!products.length) break

    for (const p of products) {
      const id = `${brand.toLowerCase().replace(/\s+/g, '-')}-${p.id}`
      if (seen.has(id)) continue
      seen.add(id)

      const images: string[] = (p.images as any[] | undefined)?.map((img: any) => img.src) ?? []
      const primaryImage = images[0] ?? ''
      const variants: any[] = p.variants ?? []
      const price = variants.length
        ? Math.min(...variants.map((v: any) => normalizePrice(v.price)))
        : 0
      const productUrl = `${storeUrl}/products/${p.handle}`

      // Identify which option index corresponds to color
      // Check product options to find which one is likely "color"
      const productOpts: any[] = p.options ?? []
      const colorOptIndex = productOpts.findIndex((o: any) => /color|colour/i.test(o.name ?? ''))
      const sizeOptIndex = productOpts.findIndex((o: any) => /size/i.test(o.name ?? ''))

      // Fetch all color variants from the product
      let allColors: { name: string; hex: string; url: string; imageUrl: string }[] = []
      if (variants.length > 0) {
        // Extract unique colors from variants
        const colorMap = new Map<string, { name: string; hex: string; url: string; imageUrl: string }>()
        for (const variant of variants) {
          let colorName = 'Default'

          // Try to extract color from the correct option index
          if (colorOptIndex >= 0) {
            // Use the identified color option
            colorName = [variant.option1, variant.option2, variant.option3][colorOptIndex] || 'Default'
          } else {
            // Fallback: use the option that's not size
            if (sizeOptIndex !== 0 && variant.option1 && !/^[a-z]{1,3}$/i.test(variant.option1.toLowerCase())) colorName = variant.option1
            else if (sizeOptIndex !== 1 && variant.option2) colorName = variant.option2
            else if (sizeOptIndex !== 2 && variant.option3) colorName = variant.option3
          }

          if (colorName && colorName !== 'Default' && !colorMap.has(colorName)) {
            colorMap.set(colorName, {
              name: colorName,
              hex: colorNameToHex(colorName),
              url: `${productUrl}?variant=${variant.id}`,
              imageUrl: variant.featured_image?.src || primaryImage,
            })
          }
        }
        allColors = Array.from(colorMap.values())
      }

      if (allColors.length === 0) {
        allColors = [{ name: 'Default', hex: colorNameToHex(p.title), url: productUrl, imageUrl: primaryImage }]
      }

      const opts: any[] = p.options ?? []
      const sizeOpt = opts.find((o) => /size/i.test(o.name ?? ''))
      const sizes: string[] = sizeOpt?.values ?? []

      groups.push({
        id,
        name: p.title,
        brand,
        retailer,
        price,
        category: mapCategory(p.product_type),
        primaryImageUrl: primaryImage,
        allColorOptions: allColors,
        sizes,
        rating: ratingDefault,
        reviewCount: 100,
        tags: [retailer, ...((p.tags as string[] | undefined)?.slice(0, 7) ?? [])],
      })
    }

    if (products.length < 250) break
    page++
    await SLEEP(150)
    } catch {
      if (page === 1) return []
      break
    }
  }
  return groups
}

async function fetchBrandyMelville(): Promise<ProductGroup[]> {
  const groups: ProductGroup[] = []
  const seen = new Set<string>()
  let page = 1

  while (page <= 15) {
    const url = `https://us.brandymelville.com/products.json?limit=250&page=${page}`
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://us.brandymelville.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    }
    const data = await fetchWithCurl(url, headers)
    if (!data) {
      console.warn(`[discover-bm] Page ${page}: fetch failed`)
      break
    }
    const products: any[] = data.products ?? []
    if (!products.length) break

    for (const p of products) {
        const id = `bm-${p.id}`
        if (seen.has(id)) continue
        seen.add(id)

        const images: string[] = (p.images as any[] | undefined)?.map((img: any) => img.src) ?? []
        const primaryImage = images[0] ?? ''
        if (!primaryImage) continue

        const variants: any[] = p.variants ?? []
        const price = variants.length
          ? Math.min(...variants.map((v: any) => normalizePrice(v.price)))
          : 0
        const productUrl = `https://us.brandymelville.com/products/${p.handle}`

        const allColors = (p.options ?? [])
          .find((o: any) => /color/i.test(o.name ?? ''))
          ?.values?.slice(0, 5)
          .map((colorName: string) => ({
            name: colorName,
            hex: colorNameToHex(colorName),
            url: productUrl,
            imageUrl: primaryImage,
          })) || [{ name: 'Default', hex: colorNameToHex(p.title), url: productUrl, imageUrl: primaryImage }]

        groups.push({
          id,
          name: p.title,
          brand: 'Brandy Melville',
          retailer: 'Brandy Melville',
          price,
          category: mapCategory(p.product_type),
          primaryImageUrl: primaryImage,
          allColorOptions: allColors,
          sizes: [],
          rating: 4.2,
          reviewCount: 100,
          tags: ['Brandy Melville'],
        })
      }

    if (products.length < 250) break
    page++
    await SLEEP(200)
  }

  return groups
}

async function fetchUNIQLO(): Promise<ProductGroup[]> {
  const groups: ProductGroup[] = []
  const seen = new Set<string>()
  let offset = 0
  const limit = 36

  while (offset < 500) {
    try {
      const url = new URL('https://www.uniqlo.com/us/api/commerce/v5/en/products')
      url.searchParams.set('path', '22210,23295')
      url.searchParams.set('sort', '1')
      url.searchParams.set('genderId', '22210')
      url.searchParams.set('offset', String(offset))
      url.searchParams.set('limit', String(limit))
      url.searchParams.set('imageRatio', '3x4')
      url.searchParams.set('rankingGender', 'women')
      url.searchParams.set('rankingClassId', '23295')
      url.searchParams.set('httpFailure', 'true')

      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) break

      const data = await res.json() as any
      const products: any[] = data?.result?.items ?? []
      if (!products.length) break

      for (const p of products) {
        const id = `uniqlo-${p.l1Id}`
        if (seen.has(id)) continue
        seen.add(id)

        const price = normalizePrice(p.prices?.base?.value ?? 0)
        // Get the first available color code from images.main
        const availableColorCode = p.representativeColorDisplayCode ||
          Object.keys(p.images?.main || {})?.[0] ||
          p.colors?.[0]?.displayCode || '00'
        const imageUrl = p.images?.main?.[availableColorCode]?.image || ''

        groups.push({
          id,
          name: p.name || '',
          brand: 'UNIQLO',
          retailer: 'UNIQLO',
          price,
          category: mapCategory(p.genderName || 'clothing'),
          primaryImageUrl: imageUrl || 'https://via.placeholder.com/400x560?text=UNIQLO',
          allColorOptions: (p.colors ?? []).slice(0, 5).map((c: any) => ({
            name: c.name,
            hex: colorNameToHex(c.name),
            url: `https://www.uniqlo.com/us/en/products/${p.l1Id}`,
            imageUrl: p.images?.main?.[c.displayCode]?.image || imageUrl || 'https://via.placeholder.com/400x560?text=UNIQLO',
          })),
          sizes: (p.sizes ?? []).slice(0, 8).map((s: any) => s.name),
          rating: 4.1,
          reviewCount: 80,
          tags: ['UNIQLO'],
        })
      }

      if (products.length < limit) break
      offset += limit
      await SLEEP(200)
    } catch (error) {
      console.error(`[discover-uniqlo] Offset ${offset} fetch failed:`, error)
      break
    }
  }

  return groups
}

async function fetchAbercrombieAndFitch(): Promise<ProductGroup[]> {
  const groups: ProductGroup[] = []
  const seen = new Set<string>()
  let page = 0

  while (page < 10) {
    try {
      const url = `https://www.abercrombie.com/shop/us/womenswear?offset=${page * 48}`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.abercrombie.com/shop/us/womenswear',
        },
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) break

      const html = await res.text()

      // Extract product data from JSON-LD schema
      const schemaMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/g) || []
      if (!schemaMatch.length) break

      for (const schema of schemaMatch) {
        try {
          const jsonMatch = schema.match(/>([^<]+)</)
          if (!jsonMatch) continue
          const data = JSON.parse(jsonMatch[1])
          if (data['@type'] === 'Product') {
            const id = `anf-${data.sku || data.url?.split('/').pop()}`
            if (seen.has(id)) continue
            seen.add(id)

            const price = typeof data.offers?.price === 'string'
              ? parseFloat(data.offers.price)
              : data.offers?.price ?? 0

            const imageUrl = Array.isArray(data.image)
              ? data.image[0]
              : data.image || ''

            if (!imageUrl) continue

            groups.push({
              id,
              name: data.name || '',
              brand: 'Abercrombie & Fitch',
              retailer: 'Abercrombie & Fitch',
              price: normalizePrice(price),
              category: 'clothing',
              primaryImageUrl: imageUrl,
              allColorOptions: [{
                name: 'Default',
                hex: colorNameToHex(data.name),
                url: data.url || `https://www.abercrombie.com/shop/us/womens-clothing`,
                imageUrl,
              }],
              sizes: [],
              rating: data.aggregateRating?.ratingValue ?? 4.0,
              reviewCount: data.aggregateRating?.reviewCount ?? 0,
              tags: [],
            })
          }
        } catch {
          // Skip malformed schema
        }
      }

      if (schemaMatch.length < 10) break
      page++
      await SLEEP(250)
    } catch (error) {
      console.warn(`[discover-anf] Page ${page} error:`, error instanceof Error ? error.message : error)
      break
    }
  }

  return groups
}

// ── In-memory product cache ───────────────────────────────────────────────────

let _allGroups: ProductGroup[] | null = null
let _dataSource: 'static' | 'live' = 'static'
let _lastRefreshed: Date | null = null
let _refreshing = false

function getAllGroups(): ProductGroup[] {
  if (_allGroups) return _allGroups
  // Cold start: load static files synchronously
  console.log('[discover] Cold start — loading static catalogs…')
  const t = Date.now()
  _allGroups = [
    ...loadReliableFallbackCatalog(),
    ...loadAritziaStatic(),
    ...loadPPStatic(),
    ...loadReformationStatic(),
  ]
  _dataSource = 'static'
  _lastRefreshed = new Date()
  console.log(`[discover] ${_allGroups.length} products from static files in ${Date.now() - t}ms`)
  return _allGroups
}

async function triggerLiveRefresh(): Promise<void> {
  if (_refreshing) return
  _refreshing = true
  console.log('[discover] Starting live product refresh…')
  const t = Date.now()

  const [reformationRes, aritziaRes, ppRes, ediktedRes, bmRes, uniqloRes, anfRes] = await Promise.allSettled([
    fetchReformationLiveProducts(),
    fetchAritziaAlgolia(),
    fetchShopifyAll('https://us.princesspolly.com', 'Princess Polly', 'Princess Polly', 4.3),
    fetchShopifyAll('https://edikted.com', 'Edikted', 'Edikted', 4.1),
    fetchBrandyMelville(),
    fetchUNIQLO(),
    fetchAbercrombieAndFitch(),
  ])

  const newGroups: ProductGroup[] = []
  if (aritziaRes.status === 'fulfilled') {
    newGroups.push(...aritziaRes.value)
    console.log(`[discover] Aritzia live: ${aritziaRes.value.length} products`)
  } else {
    console.error('[discover] Aritzia fetch failed:', aritziaRes.reason?.message)
    newGroups.push(...loadAritziaStatic())
  }
  if (ppRes.status === 'fulfilled') {
    newGroups.push(...ppRes.value)
    console.log(`[discover] Princess Polly live: ${ppRes.value.length} products`)
  } else {
    console.error('[discover] PP fetch failed:', ppRes.reason?.message)
    newGroups.push(...loadPPStatic())
  }
  if (ediktedRes.status === 'fulfilled') {
    console.log(`[discover] Edikted live: ${ediktedRes.value.length} products`)
    newGroups.push(...ediktedRes.value)
  } else {
    console.error('[discover] Edikted fetch failed:', ediktedRes.reason?.message)
  }

  if (reformationRes.status === 'fulfilled') {
    newGroups.push(...reformationRes.value)
    console.log(`[discover] Reformation live: ${reformationRes.value.length} products`)
  } else {
    console.error('[discover] Reformation fetch failed:', reformationRes.reason?.message)
    newGroups.push(...loadReformationStatic())
  }

  if (bmRes.status === 'fulfilled') {
    newGroups.push(...bmRes.value)
    console.log(`[discover] Brandy Melville live: ${bmRes.value.length} products`)
  } else {
    console.error('[discover] Brandy Melville fetch failed:', bmRes.reason?.message)
  }

  if (uniqloRes.status === 'fulfilled') {
    newGroups.push(...uniqloRes.value)
    console.log(`[discover] UNIQLO live: ${uniqloRes.value.length} products`)
  } else {
    console.error('[discover] UNIQLO fetch failed:', uniqloRes.reason?.message)
  }

  if (anfRes.status === 'fulfilled') {
    newGroups.push(...anfRes.value)
    console.log(`[discover] Abercrombie & Fitch live: ${anfRes.value.length} products`)
  } else {
    console.error('[discover] Abercrombie & Fitch fetch failed:', anfRes.reason?.message)
  }

  if (newGroups.length > 0) {
    _allGroups = [...loadReliableFallbackCatalog(), ...newGroups]
    _dataSource = 'live'
    _lastRefreshed = new Date()
    resultCache.clear()
    console.log(`[discover] Live refresh complete: ${_allGroups.length} products in ${((Date.now() - t) / 1000).toFixed(1)}s`)
  }
  _refreshing = false
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null
let refreshInterval: ReturnType<typeof setInterval> | null = null

function startBackgroundRefresh(): void {
  if (refreshTimer || refreshInterval) return

  refreshTimer = setTimeout(() => {
    void triggerLiveRefresh()
  }, 5000)

  refreshInterval = setInterval(() => {
    void triggerLiveRefresh()
  }, 6 * 60 * 60 * 1000)
}

function stopBackgroundRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

startBackgroundRefresh()
process.on('SIGINT', stopBackgroundRefresh)
process.on('SIGTERM', stopBackgroundRefresh)
process.on('exit', stopBackgroundRefresh)

// ── Scoring & result cache ────────────────────────────────────────────────────

interface CacheEntry { products: Product[]; ts: number }
const resultCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000

function getCachedResult(key: string): Product[] | null {
  const entry = resultCache.get(key)
  if (!entry || Date.now() - entry.ts > CACHE_TTL) { resultCache.delete(key); return null }
  return entry.products
}

function buildResult(paletteHexes: string[], catFilter: string, searchQ: string): Product[] {
  const hasPalette = paletteHexes.length > 0
  const groups = getAllGroups()

  // Pre-compute deltaE for each unique hex vs palette (avoids redundant math)
  const hexScoreCache = new Map<string, number>()
  if (hasPalette) {
    const uniqueHexes = new Set<string>()
    for (const g of groups) for (const c of g.allColorOptions) uniqueHexes.add(c.hex)
    for (const hex of uniqueHexes) hexScoreCache.set(hex, hexScore(hex, paletteHexes))
  }

  interface Scored {
    group: ProductGroup
    matchingColors: ColorOption[]
    bestScore: number
    primaryHex: string
  }

  const scored: Scored[] = []

  for (const g of groups) {
    if (catFilter && catFilter !== 'all' && g.category !== catFilter) continue
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (!g.name.toLowerCase().includes(q) && !g.retailer.toLowerCase().includes(q) &&
          !g.tags.some((t) => t.toLowerCase().includes(q))) continue
    }

    let matchingColors: ColorOption[]
    let bestScore = 50

    if (hasPalette) {
      const options: ColorOption[] = g.allColorOptions.map((c) => ({
        name: c.name,
        hex: c.hex,
        matchScore: hexScoreCache.get(c.hex) ?? 0,
        url: c.url,
        imageUrl: c.imageUrl,
      }))
      // For products with only a generic "Default" color, don't filter — we don't have real color data
      const isGenericColor = g.allColorOptions.length === 1 && g.allColorOptions[0].name === 'Default'
      if (isGenericColor) {
        matchingColors = options
        bestScore = 50 // Default baseline score for products without real color options
      } else {
        matchingColors = options.filter((c) => c.matchScore >= 35).sort((a, b) => b.matchScore - a.matchScore)
        if (!matchingColors.length) continue
        bestScore = matchingColors[0].matchScore
        if (bestScore < 45) continue
      }
    } else {
      matchingColors = g.allColorOptions.slice(0, 6).map((c) => ({
        name: c.name, hex: c.hex, matchScore: 50, url: c.url, imageUrl: c.imageUrl,
      }))
    }

    // Ensure product has at least a name and URL; skip if all color options lack both images and URLs
    const hasValidContent = g.primaryImageUrl || matchingColors.some((c) => c.imageUrl || c.url)
    if (!hasValidContent && !g.name) continue

    scored.push({
      group: g,
      matchingColors,
      bestScore,
      primaryHex: matchingColors[0].hex,
    })
  }

  // Sort by score within each family, then interleave families for visual diversity
  scored.sort((a, b) => b.bestScore - a.bestScore)
  const diversified = interleaveByFamily(scored)

  return diversified.map(({ group: g, matchingColors, bestScore }) => {
    const primaryImage = g.primaryImageUrl
      || matchingColors.find((c) => c.imageUrl && !/swatch|_sw\b/i.test(c.imageUrl))?.imageUrl
      || matchingColors[0]?.imageUrl
      || ''

    // Include all color options from the product, sorted by match score (best first)
    const allColors = g.allColorOptions.map((c) => ({
      name: c.name,
      hex: c.hex,
      matchScore: hasPalette ? (hexScoreCache.get(c.hex) ?? 0) : 50,
      url: c.url,
      imageUrl: c.imageUrl,
    })).sort((a, b) => b.matchScore - a.matchScore)

    return {
      id: g.id,
      name: g.name,
      brand: g.brand,
      retailer: g.retailer,
      price: normalizePrice(g.price),
      originalPrice: g.originalPrice,
      category: g.category,
      imageUrl: primaryImage,
      hexColors: matchingColors.map((c) => c.hex),
      sizes: g.sizes,
      rating: g.rating,
      reviewCount: g.reviewCount,
      affiliateUrl: matchingColors[0].url,
      tags: g.tags,
      aspectRatio: 'tall' as const,
      matchScore: hasPalette ? bestScore : undefined,
      colorOptions: allColors,
    }
  }).filter((p) => !!p.imageUrl)
}

// ── Route ─────────────────────────────────────────────────────────────────────

const router = Router()

router.get('/status', (_req: Request, res: Response) => {
  const groups = _allGroups
  res.json({
    source: _dataSource,
    productGroups: groups?.length ?? 0,
    lastRefreshed: _lastRefreshed,
    refreshing: _refreshing,
  })
})

router.get('/', async (req: Request, res: Response) => {
  const { palette, category, search, page, limit } = req.query

  const paletteHexes: string[] = palette
    ? String(palette).split(',').map((h) => h.trim()).filter(Boolean)
    : []
  const catFilter = String(category ?? 'all')
  const searchQ = String(search ?? '')
  const pageNum = Math.max(0, parseInt(String(page ?? '0'), 10) || 0)
  const pageSize = Math.min(100, Math.max(10, parseInt(String(limit ?? '50'), 10) || 50))

  const cacheKey = `${paletteHexes.join(',')}|${catFilter}|${searchQ}`
  let products = getCachedResult(cacheKey)
  if (!products) {
    if ((!_allGroups || _allGroups.length === 0) && !_refreshing) {
      await triggerLiveRefresh()
    }
    products = buildResult(paletteHexes, catFilter, searchQ)
    resultCache.set(cacheKey, { products, ts: Date.now() })
  }

  const slice = products.slice(pageNum * pageSize, (pageNum + 1) * pageSize)
  res.json({ products: slice, total: products.length, page: pageNum, pageSize, source: _dataSource })
})

export default router
