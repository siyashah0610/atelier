import { Router, Request, Response } from 'express'
import { mockProducts } from '../data/mockProducts.js'
import { fetchProducts } from '../services/shopStyle.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { category, retailers, minPrice, maxPrice, search } = req.query

  // Parse comma-separated retailer list
  const retailerList: string[] = retailers
    ? String(retailers).split(',').map((r) => r.trim()).filter(Boolean)
    : []

  // Try ShopStyle first; fall back to mock data automatically
  let products = retailerList.length
    ? await fetchProducts(retailerList).catch((): never[] => [])
    : []

  if (!products.length) {
    products = [...mockProducts]
    // When specific retailers requested, filter mock data to match
    if (retailerList.length) {
      const set = new Set(retailerList.map((r) => r.toLowerCase()))
      products = products.filter((p) => set.has(p.retailer.toLowerCase()))
    }
  }

  if (category && category !== 'all') {
    products = products.filter((p) => p.category === category)
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

export default router
