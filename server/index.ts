import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import analysisRouter from './routes/analysis.js'
import productsRouter from './routes/products.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '60mb' }))

app.use('/api/analyze', analysisRouter)
app.use('/api/products', productsRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Atelier server running on http://localhost:${PORT}`)
})
