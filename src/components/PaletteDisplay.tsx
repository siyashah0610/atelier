import React from 'react'
import { ColorPalette } from '../types'

interface Props {
  palette: ColorPalette
  compact?: boolean
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
        {palette.dominantColors.map((hex, i) => (
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
      {/* Seasonal type */}
      <div>
        <h3 className="font-serif text-2xl text-stone-900">{palette.seasonalType}</h3>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">{palette.description}</p>
        <div className="flex items-center gap-2 mt-2">
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
        </div>
      </div>

      {/* Dominant colors */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
          Your Best Colors
        </p>
        <div className="flex flex-wrap gap-2">
          {palette.dominantColors.map((hex, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-full shadow-md border-2 border-white"
                style={{
                  backgroundColor: hex,
                  animationDelay: `${i * 60}ms`,
                }}
              />
              <span className="text-[9px] text-stone-400 font-mono">{hex.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Neutrals */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
          Neutrals
        </p>
        <div className="flex flex-wrap gap-2">
          {palette.neutrals.map((hex, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full shadow border-2 border-white"
                style={{ backgroundColor: hex }}
              />
              <span className="text-[9px] text-stone-400 font-mono">{hex.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metals */}
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

      {/* Avoid */}
      <div>
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
          Colors to Avoid
        </p>
        <div className="flex flex-wrap gap-2">
          {palette.toAvoid.map((hex, i) => (
            <div key={i} className="relative">
              <div
                className="w-8 h-8 rounded-full shadow border-2 border-white opacity-60"
                style={{ backgroundColor: hex }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm font-bold drop-shadow">✕</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
