import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
const VALID_MIMES: ImageMime[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

router.post('/', async (req: Request, res: Response) => {
  const { data, mediaType } = req.body as { data: string; mediaType?: string }

  if (!data) { res.status(400).json({ error: 'Image data is required' }); return }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) { res.status(503).json({ error: 'API key not configured' }); return }

  const mime: ImageMime = VALID_MIMES.includes(mediaType as ImageMime) ? mediaType as ImageMime : 'image/jpeg'

  const prompt = `You are an expert beauty consultant and makeup artist specialising in face shape analysis.

Analyse the face in this photo and return ONLY valid JSON (no markdown, no extra text):

{
  "faceShape": "<oval | round | square | heart | diamond | oblong | triangle>",
  "confidence": <integer 0-100 reflecting how clear the face shape is>,
  "makeupTips": {
    "contouring": "<specific contouring placement for this face shape, 1-2 sentences>",
    "blush": "<blush placement and shape recommendation, 1-2 sentences>",
    "highlight": "<highlight placement to enhance their best features, 1-2 sentences>",
    "eyeMakeup": "<eye makeup style and technique that flatters this face shape, 1-2 sentences>",
    "browShape": "<ideal brow arch and shape for this face shape, 1-2 sentences>",
    "lips": "<lip liner and lipstick technique to balance this face shape, 1-2 sentences>"
  },
  "accessories": {
    "earrings": "<earring styles and lengths that flatter this face shape, 1-2 sentences>",
    "necklaces": "<necklace lengths and pendant shapes that work best, 1-2 sentences>",
    "sunglasses": "<sunglass frame shapes that complement this face shape, 1-2 sentences>",
    "hats": "<hat styles and brim sizes that suit this face shape, 1-2 sentences>"
  },
  "overallAdvice": "<one sentence of overall personalised guidance for this face shape>"
}

Face shape definitions:
- oval: forehead slightly wider than jaw, balanced proportions, gently rounded chin
- round: similar width and length, soft curves, full cheeks, rounded chin
- square: strong jaw roughly same width as forehead, angular, minimal taper
- heart: wide forehead, prominent cheekbones, narrow pointed chin
- diamond: narrow forehead and jaw, wide prominent cheekbones (widest part)
- oblong: face is notably longer than wide, similar forehead/cheek/jaw widths
- triangle: narrow forehead, widening through cheeks to a wide jaw

If the photo doesn't clearly show a face, set faceShape to "oval" and confidence to 0, and provide generic advice.`

  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mime, data } },
          { type: 'text', text: prompt },
        ],
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const result = JSON.parse(match[0])

    res.json({
      ...result,
      analyzedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[face-check]', err)
    res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
})

export default router
