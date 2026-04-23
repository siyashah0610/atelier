import React from 'react'

interface StyleProfile {
  motto: string
  description: string
  bestFits: string[]
  fabrics: string[]
  avoid: string[]
}

const PROFILES: Record<string, StyleProfile> = {
  hourglass: {
    motto: 'Highlight your waist',
    description:
      'Your balanced bust and hips with a defined waist are your signature. Clothes that follow your natural curves look stunning.',
    bestFits: ['Wrap tops', 'Fitted bodysuits', 'Peplum blouses', 'High-rise bottoms', 'Bootcut & flare', 'Wrap dresses', 'Fit-and-flare', 'Sheath dresses'],
    fabrics: ['Jersey knit', 'Spandex blends', 'Fine gauge knit', 'Silk & drape fabrics'],
    avoid: ['Boxy tunics', 'Oversized sweaters', 'Low-rise jeans'],
  },
  pear: {
    motto: 'Draw the eye upward',
    description:
      'Your gorgeous curves are widest at the hips. Balance your frame by adding volume and bold detail to your upper half.',
    bestFits: ['Puff sleeves', 'Boat & square necklines', 'Off-the-shoulder tops', 'Structured jackets', 'Dark wash straight-leg', 'A-line dresses', 'Fit-and-flare'],
    fabrics: ['Structured fabrics on top (tweed, stiff cotton)', 'Flowing fabrics on bottom (crepe, viscose)'],
    avoid: ['Skinny jeans', 'Hip-length tops', 'Cargo pocket pants', 'Heavy thigh whiskering'],
  },
  apple: {
    motto: 'Elongate and let legs shine',
    description:
      'Your upper body carries more volume. Create vertical lines to elongate your torso and let your slim legs take center stage.',
    bestFits: ['Flowy tunics', 'Empire waist tops', 'Open cardigans', 'Deep V-necks', 'Duster coats', 'Slim-leg pants', 'Shift & swing dresses'],
    fabrics: ['Chiffon', 'Soft linen', 'Silk', 'Soft cotton blends'],
    avoid: ['Clingy t-shirts', 'Turtlenecks', 'Belts at the belly', 'Bodycon dresses'],
  },
  rectangle: {
    motto: 'Create curves with contrast',
    description:
      'Your athletic, balanced frame is a beautiful blank canvas. Add visual curves with volume, texture, and waist definition.',
    bestFits: ['Ruffled & peplum tops', 'Bold prints', 'Halter necklines', 'Wide-leg trousers', 'Flared jeans', 'Cargo pants', 'Belted shirt dresses', 'Wrap dresses'],
    fabrics: ['Stiff fabrics (heavy denim, taffeta)', 'Soft fabrics tightly belted at the waist'],
    avoid: ['Shapeless boxy shirts', 'Square oversized silhouettes'],
  },
  'inverted-triangle': {
    motto: 'Balance with volume below',
    description:
      'Your broad, defined shoulders are striking. Soften your upper body and draw the eye downward with full, voluminous bottoms.',
    bestFits: ['Wrap & minimalist tops', 'V-necks & deep scoops', 'Raglan sleeves', 'Wide-leg trousers', 'Flared jeans', 'Patterned bottoms', 'Tiered & A-line dresses'],
    fabrics: ['Soft draping on top (chiffon, fine knit, silk)', 'Structured fabric on bottom (heavy denim, thick tweed)'],
    avoid: ['Shoulder pads', 'Puff sleeves', 'Boat necks', 'Halter tops', 'Strapless styles'],
  },
}

const BODY_LABELS: Record<string, string> = {
  hourglass: 'Hourglass',
  pear: 'Pear',
  apple: 'Apple',
  rectangle: 'Rectangle',
  'inverted-triangle': 'Inverted Triangle',
}

// [shoulderHalf, bustHalf, waistHalf, hipHalf] — half-widths from center
const MEASUREMENTS: Record<string, [number, number, number, number]> = {
  hourglass: [19, 18, 9, 19],
  pear: [13, 12, 10, 21],
  apple: [18, 21, 19, 14],
  rectangle: [16, 15, 14, 16],
  'inverted-triangle': [22, 19, 11, 10],
}

function buildBodyPath(cx: number, sh: number, bh: number, wh: number, hh: number): string {
  const sy = 29, by = 49, wy = 69, hy = 89, hem = 108
  return [
    `M ${cx - sh} ${sy}`,
    `C ${cx - sh} ${sy + 8} ${cx - bh} ${by - 8} ${cx - bh} ${by}`,
    `C ${cx - bh} ${by + 8} ${cx - wh} ${wy - 8} ${cx - wh} ${wy}`,
    `C ${cx - wh} ${wy + 8} ${cx - hh} ${hy - 8} ${cx - hh} ${hy}`,
    `L ${cx - hh} ${hem}`,
    `L ${cx + hh} ${hem}`,
    `L ${cx + hh} ${hy}`,
    `C ${cx + hh} ${hy - 8} ${cx + wh} ${wy + 8} ${cx + wh} ${wy}`,
    `C ${cx + wh} ${wy - 8} ${cx + bh} ${by + 8} ${cx + bh} ${by}`,
    `C ${cx + bh} ${by - 8} ${cx + sh} ${sy + 8} ${cx + sh} ${sy}`,
    `L ${cx - sh} ${sy} Z`,
  ].join(' ')
}

function BodyAvatar({ type }: { type: string }) {
  const [sh, bh, wh, hh] = MEASUREMENTS[type] || MEASUREMENTS.hourglass
  const cx = 40

  return (
    <svg viewBox="0 0 80 118" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx={cx} cy={11} r={9} fill="#1c1917" opacity="0.22" />
      <rect x={cx - 3.5} y={20} width={7} height={9} rx={2.5} fill="#1c1917" opacity="0.22" />
      <path d={buildBodyPath(cx, sh, bh, wh, hh)} fill="#1c1917" opacity="0.22" />
    </svg>
  )
}

interface Props {
  bodyType: string
}

export default function BodyStyleDisplay({ bodyType }: Props) {
  const profile = PROFILES[bodyType]
  if (!profile) return null

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Avatar + motto */}
      <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5 flex items-center gap-5">
        <div className="w-20 h-28 flex-shrink-0">
          <BodyAvatar type={bodyType} />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            {BODY_LABELS[bodyType]}
          </p>
          <p className="font-serif text-lg text-stone-900 leading-snug italic">{profile.motto}</p>
          <p className="text-xs text-stone-500 leading-relaxed">{profile.description}</p>
        </div>
      </div>

      {/* Best fits */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2.5">
          Best Styles &amp; Silhouettes
        </p>
        <div className="flex flex-wrap gap-1.5">
          {profile.bestFits.map((item) => (
            <span
              key={item}
              className="text-xs px-2.5 py-1 rounded-full border border-stone-200 bg-white text-stone-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Fabrics */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2.5">
          Flattering Fabrics
        </p>
        <div className="flex flex-wrap gap-1.5">
          {profile.fabrics.map((item) => (
            <span
              key={item}
              className="text-xs px-2.5 py-1 rounded-full border border-[#C19A6B]/30 bg-[#C19A6B]/10 text-stone-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Avoid */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2.5">
          Styles to Skip
        </p>
        <div className="flex flex-wrap gap-1.5">
          {profile.avoid.map((item) => (
            <span
              key={item}
              className="text-xs px-2.5 py-1 rounded-full border border-stone-100 text-stone-400"
            >
              ✕ {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
