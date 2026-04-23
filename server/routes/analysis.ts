import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

const MOCK_PALETTE = {
  seasonalType: 'Soft Autumn',
  description:
    'Your coloring features warm, golden undertones with medium contrast. Muted, earthy tones enhance your natural warmth while keeping your look harmonious and effortlessly flattering.',
  undertone: 'warm',
  dominantColors: [
    '#C19A6B',
    '#8B6343',
    '#D4A583',
    '#A67C52',
    '#87A878',
    '#6B7A3C',
    '#C4956A',
    '#D4825C',
  ],
  neutrals: ['#F5E6D3', '#E8D5C4', '#D4C4B0', '#C4B4A0', '#A89880'],
  toAvoid: ['#0000FF', '#FF69B4', '#000080', '#FF00FF'],
  metals: ['gold', 'rose gold'],
  allHexCodes: [
    '#C19A6B', '#8B6343', '#D4A583', '#A67C52', '#87A878', '#6B7A3C',
    '#C4956A', '#D4825C', '#C0634A', '#B7410E', '#6B4C35', '#9B7A5C',
    '#D4B896', '#E8C9A0', '#F5E6D3', '#E8D5C4', '#D4C4B0', '#C4B4A0',
    '#A89880', '#8B7A6B', '#C5A028', '#B8860B', '#CD9B1D', '#DAA520',
    '#6B7A3C', '#7A8C4A', '#8B9E5A', '#9DAF6E', '#4A5C2E', '#3D4F26',
    '#D47A5C', '#C86042', '#B84A2E', '#8B3A2A', '#6D2A1E', '#4A1A0E',
  ],
}

const ANALYSIS_PROMPT = `You are an expert color analyst with deep knowledge of seasonal color theory. Analyze the uploaded photos of this person carefully.

Look at:
1. Skin tone — undertone (warm/cool/neutral) and depth (fair/light/medium/deep/rich)
2. Natural hair color and value (light or dark)
3. Eye color
4. Overall contrast between features (high/medium/low)

Assign them to one of these 12 seasonal sub-types:
Deep Winter, Bright Winter, True Winter, Deep Autumn, True Autumn, Soft Autumn,
Light Spring, True Spring, Bright Spring, Light Summer, True Summer, Soft Summer

Return ONLY valid JSON (no markdown, no extra text) in exactly this format:
{
  "seasonalType": "...",
  "description": "2-3 sentences about their coloring and why this season suits them",
  "undertone": "warm" | "cool" | "neutral",
  "dominantColors": ["#hex",...], // 8 most flattering colors
  "neutrals": ["#hex",...], // 5 neutral shades
  "toAvoid": ["#hex",...], // 4 colors to avoid
  "metals": ["silver"|"gold"|"rose gold"],
  "allHexCodes": ["#hex",...] // 36 hex codes spanning the full palette
}`

router.post('/', async (req: Request, res: Response) => {
  const { images } = req.body as { images: { data: string; mediaType: string }[] }

  if (!images || images.length === 0) {
    res.status(400).json({ error: 'No images provided' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Return mock palette for development without an API key
    await new Promise((r) => setTimeout(r, 2500))
    res.json(MOCK_PALETTE)
    return
  }

  try {
    const client = new Anthropic({ apiKey })

    const imageContent = images.slice(0, 8).map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
        data: img.data,
      },
    }))

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: ANALYSIS_PROMPT },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const palette = JSON.parse(text)
    res.json(palette)
  } catch (err) {
    console.error('Analysis error:', err)
    res.json(MOCK_PALETTE)
  }
})

export default router
