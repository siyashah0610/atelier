import { Router, Request, Response } from 'express'
import { mockProducts } from '../data/mockProducts.js'
import { fetchProducts } from '../services/shopStyle.js'
import { computeMatchScore } from '../../src/utils/colorUtils.js'
import { Product, ProductCategory } from '../../src/types/index.js'
import { Vibrant } from 'node-vibrant/node'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { retailers, minPrice, maxPrice, search, palette, style } = req.query
  const category = req.query.category ? String(req.query.category) : undefined

  // Parse comma-separated retailer list
  const retailerList: string[] = retailers
    ? String(retailers).split(',').map((r) => r.trim()).filter(Boolean)
    : []
  const paletteHexes: string[] = palette
    ? String(palette).split(',').map((h) => h.trim()).filter(Boolean)
    : []
  const styleKeywords: string[] = style
    ? String(style).split(',').map((s) => s.trim()).filter(Boolean)
    : []

  // Try ShopStyle first; fall back to mock data automatically
  let products: Product[] = retailerList.length
    ? await fetchProducts(retailerList, {
        category: category && category !== 'all' ? (category as ProductCategory) : undefined,
        paletteHexes,
        styleKeywords,
        minScore: 45,
      }).catch((): Product[] => [])
    : []

  if (!products.length) {
    products = [...mockProducts]
    // When specific retailers requested, filter mock data to match
    if (retailerList.length) {
      const set = new Set(retailerList.map((r) => r.toLowerCase()))
      products = products.filter((p) => set.has(p.retailer.toLowerCase()))
    }
    if (paletteHexes.length) {
      products = products.filter((p) =>
        computeMatchScore(p.hexColors, paletteHexes) >= 45
      )
    }
    if (styleKeywords.length) {
      const lowered = styleKeywords.map((k) => k.toLowerCase())
      const styleMatches = products.filter((p) =>
        lowered.some((keyword) =>
          p.tags.some((tag) => tag.toLowerCase().includes(keyword)) ||
          p.name.toLowerCase().includes(keyword)
        )
      )
      if (styleMatches.length) products = styleMatches
    }
  }

  if (category && category !== 'all') {
    products = products.filter((p) => p.category === (category as ProductCategory))
  }
  if (minPrice) {
    products = products.filter((p) => p.price >= Number(minPrice))
  }
  if (maxPrice) {
    products = products.filter((p) => p.price <= Number(maxPrice))
  }
  if (search) {
    const q = String(search).toLowerCase()
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
    )
  }

  // Filter to only show products with at least one size in stock
  products = products.filter((p) => {
    if (!p.sizes || !p.inStock) return true // Show if no stock info available
    return p.sizes.some((size) => p.inStock![size] === true)
  })

  res.json(products)
})

router.get('/:id', (req: Request, res: Response) => {
  const product = mockProducts.find((p) => p.id === req.params.id)
  if (!product) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json(product)
})

router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { url, palette } = req.body
    if (!url) {
      res.status(400).json({ error: 'URL is required' })
      return
    }

    // Add generic browser headers to bypass basic bot-protection on retail sites
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    }

    const response = await fetch(url, { headers })
    const contentType = response.headers.get('content-type') || ''

    let name = 'Unknown Product'
    let brand = 'Unknown Retailer'
    let imageUrl = ''
    let description = ''

    if (contentType.includes('image/')) {
      // Direct image URL provided
      imageUrl = url
      name = 'Scraped Image'
    } else {
      // Webpage provided - Parse HTML
      const html = await response.text()
      const getMetaTag = (property: string) => {
        const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
        let match = html.match(regex)
        if (!match) {
          const regexName = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
          match = html.match(regexName)
        }
        return match ? match[1] : null
      }
      const getTitle = () => {
        const match = html.match(/<title>([^<]+)<\/title>/i)
        return match ? match[1] : null
      }
      name = getMetaTag('og:title') || getTitle() || 'Unknown Product'
      imageUrl = getMetaTag('og:image') || ''
      description = getMetaTag('og:description') || getMetaTag('description') || ''
      brand = getMetaTag('og:site_name') || 'Unknown Retailer'
    }

    // Automatically extract hex colors from the imageUrl
    let hexColors: string[] = []
    if (imageUrl) {
      try {
        const imageResponse = await fetch(imageUrl, { headers })
        const imageBuffer = await imageResponse.arrayBuffer()
        const paletteResult = await Vibrant.from(Buffer.from(imageBuffer)).getPalette()

        hexColors = Object.values(paletteResult)
          .filter((swatch): swatch is Vibrant.Swatch => swatch !== null)
          .map((swatch) => swatch.getHex())
      } catch (colorError) {
        console.error('Error extracting colors from image:', colorError)
      }
    }

    // Compute Color Match Analysis
    let matchScore = 0
    if (palette && Array.isArray(palette) && hexColors.length > 0) {
      matchScore = computeMatchScore(hexColors, palette)
    }

    // Return a partial Product object suitable for pinning
    const productData = {
      name,
      brand,
      imageUrl,
      url,
      description,
      price: 0, // Difficult to reliably scrape via Regex; might require manual user input or specialized scrapers
      category: 'other', 
      retailer: brand,
      hexColors,
      tags: [],
      matchScore,
      isMatch: matchScore >= 45 // Adjust threshold if necessary
    }

    res.json(productData)
  } catch (error) {
    console.error('Error extracting product data:', error)
    res.status(500).json({ error: 'Failed to extract product data from URL' })
  }
})

export default router
