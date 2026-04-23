import { Router, Request, Response } from 'express'
import { mockProducts } from '../data/mockProducts.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { category, retailer, minPrice, maxPrice, search } = req.query

  let products = [...mockProducts]

  if (category && category !== 'all') {
    products = products.filter((p) => p.category === category)
  }
  if (retailer) {
    products = products.filter((p) => p.retailer === retailer)
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
