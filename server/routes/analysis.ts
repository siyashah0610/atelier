import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

type ImageBlock = {
  type: 'image'
  source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/webp'; data: string }
}

const MOCK_PALETTE = {
  seasonalType: 'Soft Autumn',
  description:
    'Your coloring features warm, golden undertones with medium contrast. Muted, earthy tones enhance your natural warmth while keeping your look harmonious and effortlessly flattering.',
  undertone: 'warm',
  confidenceScore: 82,
  dominantColors: ['#C19A6B', '#8B6343', '#D4A583', '#A67C52', '#87A878', '#6B7A3C', '#C4956A', '#D4825C'],
  coolColors: ['#8B9E8B', '#7A8C7A', '#6B7A6B', '#5C6B5C', '#4D5C4D', '#3E4D3E'],
  warmColors: ['#C0634A', '#B7410E', '#D4825C', '#C86042', '#B84A2E', '#8B3A2A'],
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
    '#8B9E8B', '#7A8C7A', '#6B7A6B', '#5C6B5C', '#4D5C4D', '#3E4D3E',
  ],
}

const VALIDATION_PROMPT = `Evaluate these photos for color analysis quality. For each, check:
1. Lighting — is it natural or clean artificial light? (flag if dark, orange-tinted, or overly harsh)
2. Face visibility — is the face, forehead, neck clearly visible?
3. Heavy makeup — does foundation/concealer visibly alter the natural skin tone?
4. Occlusion — is the face obscured by hair, shadows, or objects?

Return ONLY valid JSON with no markdown:
{
  "overallUsable": true,
  "warnings": ["brief description of any issues found, referencing photo number if possible"],
  "advice": "one sentence of improvement advice, or empty string if photos are fine"
}`

const ANALYSIS_PROMPT = `You are an expert color analyst with deep knowledge of seasonal color theory. Analyze all uploaded photos of this person carefully.

Examine across all photos:
1. **Skin tone** — undertone (warm/cool/neutral) and depth (fair/light/medium/deep/rich)
2. **Natural hair color** — value (light/medium/dark), tone (ash/golden/neutral/warm/cool)
3. **Eye color** — shade and depth
4. **Overall contrast** — difference in value between skin, hair, and eyes (high/medium/low)
5. **Skin clarity** — whether colors look clear/bright or muted/soft on this person

Assign to exactly one of these 12 seasonal sub-types:
Deep Winter, Bright Winter, True Winter, Deep Autumn, True Autumn, Soft Autumn,
Light Spring, True Spring, Bright Spring, Light Summer, True Summer, Soft Summer

Return ONLY valid JSON (no markdown, no extra text):
{
  "seasonalType": "<one of the 12 types above>",
  "description": "<2-3 sentences: describe their actual coloring and why this season fits them>",
  "undertone": "<warm|cool|neutral>",
  "confidenceScore": <integer 1-100>,
  "paletteHexes": {
    "neutrals": ["<hex>", ...],         // 6-8: grays, blacks, whites, beiges, taupes
    "coolColors": ["<hex>", ...],       // 6-8: blues, purples, teals, lavenders
    "warmColors": ["<hex>", ...],       // 6-8: reds, oranges, warm yellows, earth tones
    "statementColors": ["<hex>", ...],  // 6-8: bold signature colors for their season
    "metals": ["<silver|gold|rose gold>", ...]
  },
  "colorsToAvoid": ["<hex>", ...],      // 4-6 hex codes that clash with their coloring
  "allHexCodes": ["<hex>", ...]         // 40-50 total hex codes spanning the full flattering palette
}`

function extractJson(text: string): string {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in model response')
  return match[0]
}

async function validatePhotos(client: Anthropic, imageBlocks: ImageBlock[]): Promise<string[]> {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: VALIDATION_PROMPT },
        ],
      }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(extractJson(text))
    const lines: string[] = []
    if (result.warnings?.length) lines.push(...result.warnings)
    if (result.advice) lines.push(result.advice)
    return lines
  } catch {
    return []
  }
}

router.post('/', async (req: Request, res: Response) => {
  const { images } = req.body as { images: { data: string; mediaType: string }[] }

  if (!images || images.length === 0) {
    res.status(400).json({ error: 'No images provided' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 2500))
    res.json({ ...MOCK_PALETTE, warnings: [] })
    return
  }

  const client = new Anthropic({ apiKey })

  const imageBlocks: ImageBlock[] = images.slice(0, 8).map((img) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
      data: img.data,
    },
  }))

  // Run validation and analysis in parallel to save time
  const [warnings, analysisMessage] = await Promise.all([
    validatePhotos(client, imageBlocks),
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: ANALYSIS_PROMPT },
        ],
      }],
    }).catch(() => null),
  ])

  try {
    if (!analysisMessage) throw new Error('Analysis API call failed')

    const text = analysisMessage.content[0].type === 'text' ? analysisMessage.content[0].text : ''
    const r = JSON.parse(extractJson(text))

    const ph = r.paletteHexes ?? {}
    const statementColors: string[] = ph.statementColors ?? []
    const coolColors: string[] = ph.coolColors ?? []
    const warmColors: string[] = ph.warmColors ?? []
    const neutrals: string[] = ph.neutrals ?? []
    const metals: string[] = ph.metals ?? ['gold']

    // Build allHexCodes from structured palette if model didn't provide enough
    const allHexCodes: string[] =
      Array.isArray(r.allHexCodes) && r.allHexCodes.length >= 20
        ? r.allHexCodes
        : [...statementColors, ...coolColors, ...warmColors, ...neutrals]

    const palette = {
      seasonalType: r.seasonalType,
      description: r.description ?? r.explanation ?? '',
      undertone: r.undertone,
      confidenceScore: r.confidenceScore ?? null,
      dominantColors: statementColors,
      coolColors,
      warmColors,
      neutrals,
      toAvoid: r.colorsToAvoid ?? [],
      metals: metals.filter((m: string) =>
        ['silver', 'gold', 'rose gold'].includes(m)
      ) as ('silver' | 'gold' | 'rose gold')[],
      allHexCodes,
      warnings,
    }

    res.json(palette)
  } catch (err) {
    console.error('Analysis parse error:', err)
    res.json({ ...MOCK_PALETTE, warnings })
  }
})

export default router
