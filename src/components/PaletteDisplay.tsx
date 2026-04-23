import React from 'react'
import { ColorPalette } from '../types'

interface Props {
  palette: ColorPalette
  compact?: boolean
}

function Swatch({ hex, size = 'md', avoid }: { hex: string; size?: 'sm' | 'md'; avoid?: boolean }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${dim} rounded-full shadow-md border-2 border-white`} style={{ backgroundColor: hex }}>
        {avoid && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full">
            <span className="text-white text-xs font-bold drop-shadow">✕</span>
          </div>
        )}
      </div>
      {!avoid && <span className="text-[9px] text-stone-400 font-mono">{hex.toUpperCase()}</span>}
    </div>
  )
}

function SwatchRow({ hexes, size, avoid }: { hexes: string[]; size?: 'sm' | 'md'; avoid?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-2 ${avoid ? 'opacity-60' : ''}`}>
      {hexes.map((hex, i) => (
        <Swatch key={i} hex={hex} size={size} avoid={avoid} />
      ))}
    </div>
  )
}

export default function PaletteDisplay({ palette, compact = false }: Props) {
  const metalColor: Record<string, string> = {
    gold: '#C5A028',
    silver: '#A8A9AD',
    'rose gold': '#B76E79',
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {palette.dominantColors.slice(0, 5).map((hex, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border border-white shadow"
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-serif text-2xl text-stone-900">{palette.seasonalType}</h3>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">{palette.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              palette.undertone === 'warm'
                ? 'bg-amber-100 text-amber-800'
                : palette.undertone === 'cool'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            {palette.undertone} undertone
          </span>
          {palette.confidenceScore != null && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-stone-100 text-stone-600">
              {palette.confidenceScore}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Statement colors */}
      {palette.dominantColors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Your Best Colors
          </p>
          <SwatchRow hexes={palette.dominantColors} />
        </div>
      )}

      {/* Cool tones */}
      {palette.coolColors && palette.coolColors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Cool Tones
          </p>
          <SwatchRow hexes={palette.coolColors} />
        </div>
      )}

      {/* Warm tones */}
      {palette.warmColors && palette.warmColors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Warm Tones
          </p>
          <SwatchRow hexes={palette.warmColors} />
        </div>
      )}

      {/* Neutrals */}
      {palette.neutrals.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Neutrals
          </p>
          <SwatchRow hexes={palette.neutrals} size="sm" />
        </div>
      )}

      {/* Metals */}
      {palette.metals.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Your Metals
          </p>
          <div className="flex gap-3">
            {palette.metals.map((metal) => (
              <div key={metal} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full shadow border border-stone-200"
                  style={{ backgroundColor: metalColor[metal] }}
                />
                <span className="text-sm text-stone-700 capitalize">{metal}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avoid */}
      {palette.toAvoid.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Colors to Avoid
          </p>
          <SwatchRow hexes={palette.toAvoid} size="sm" avoid />
        </div>
      )}
    </div>
  )
}
