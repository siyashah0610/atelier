import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import analysisRouter from './routes/analysis.js'
import productsRouter from './routes/products.js'
import discoverRouter from './routes/discover.js'
import productCheckRouter from './routes/productCheck.js'
import faceCheckRouter from './routes/faceCheck.js'

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '60mb' }))

app.use('/api/analyze', analysisRouter)
app.use('/api/products', productsRouter)
app.use('/api/discover', discoverRouter)
app.use('/api/product-check', productCheckRouter)
app.use('/api/face-check', faceCheckRouter)

// ─── Authentication Middleware ────────────────────────────────────────────────
const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' })
    return
  }

  // Verify the JWT with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' })
    return
  }

  req.user = user
  next()
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

app.post('/api/auth/register', requireAuth, async (req, res) => {
  try {
    const { name, username, palette, bodyProfile, favoriteRetailers } = req.body
    
    // Upsert the user's custom profile data into our profiles table
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: req.user.id, // linked to the secure auth.users table
        name,
        username,
        palette,
        body_profile: bodyProfile,
        favorite_retailers: favoriteRetailers
      })
      .select()
      .single()

    if (error) throw error
    res.json({ profile: data })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

app.get('/api/users/me', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) throw error
    res.json({ profile: data })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

app.get('/api/wishlists', requireAuth, async (req, res) => {
  try {
    // Fetch wishlists and embed their respective items
    const { data, error } = await supabase
      .from('wishlists')
      .select('*, items:wishlist_items(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/wishlists/:id/items', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const itemData = req.body

    // Verify the wishlist belongs to the user
    const { data: list, error: listError } = await supabase
      .from('wishlists')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (listError || !list) throw new Error('Wishlist not found or unauthorized')

    // Add the item to the database
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert({
        wishlist_id: id,
        analysis_id: itemData.analysisId,
        product_name: itemData.productName,
        product_brand: itemData.productBrand,
        product_category: itemData.productCategory,
        product_image_url: itemData.productImageUrl,
        product_price: itemData.productPrice,
        store_name: itemData.storeName,
        color_score: itemData.colorScore,
        color_verdict: itemData.colorVerdict,
        chosen_color: itemData.chosenColor
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Atelier server running on http://localhost:${PORT}`)
})
