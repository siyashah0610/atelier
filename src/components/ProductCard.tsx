import React, { useState } from 'react'
import { Product } from '../types'
import { useApp } from '../context/AppContext'
import { getMatchColor, getMatchLabel } from '../utils/colorUtils'
import { formatPrice, normalizePrice } from '../utils/priceUtils'

interface Props {
  product: Product
  onClick: () => void
}

export default function ProductCard({ product, onClick }: Props) {
  const { isProductSaved, saveProduct, unsaveProduct } = useApp()
  const saved = isProductSaved(product.id)
  const [imgError, setImgError] = useState(false)

  const score = product.matchScore
  const hasImage = !!(product.imageUrl && !imgError)
  const displayPrice = formatPrice(product.price)
  const displayOriginalPrice = formatPrice(product.originalPrice)

  // Use all available color options from the product
  const allColorOptions = product.colorOptions || []

  // Primary display hex (best-matching color - first in the sorted list)
  const primaryHex = allColorOptions[0]?.hex ?? '#C8C8C8'

  // Generate a two-stop gradient from the primary hex for the color block
  function hexWithOpacity(hex: string, alpha: string) {
    return hex + alpha
  }

  return (
    <div
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Image / Color block */}
      <div className="relative overflow-hidden aspect-[3/4]">
        {hasImage ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // Styled color block — used when no product photo is available (Aritzia/Reformation)
          <div
            className="w-full h-full flex flex-col justify-end transition-transform duration-500 group-hover:scale-105"
            style={{
              background: `linear-gradient(160deg, ${primaryHex}88 0%, ${primaryHex} 55%, ${hexWithOpacity(primaryHex, 'CC')} 100%)`,
            }}
          >
            {/* Color name label at bottom */}
            <div className="px-3 py-2 bg-gradient-to-t from-black/25 to-transparent">
              <p className="text-white text-[11px] font-medium capitalize leading-tight drop-shadow">
                {product.colorOptions?.[0]?.name || product.subcategory || ''}
              </p>
            </div>
          </div>
        )}

        {/* Match score badge */}
        {score !== undefined && (
          <div
            className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-white text-[10px] font-semibold backdrop-blur-sm"
            style={{ backgroundColor: getMatchColor(score) + 'CC' }}
          >
            {getMatchLabel(score)}
          </div>
        )}

        {/* Action buttons (visible on hover) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Save */}
          <button
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
            onClick={(e) => {
              e.stopPropagation()
              saved ? unsaveProduct(product.id) : saveProduct(product)
            }}
          >
            <svg
              className={`w-3.5 h-3.5 ${saved ? 'fill-rose-500 stroke-rose-500' : 'stroke-stone-600 fill-transparent'}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          {/* Open on retailer site */}
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
            onClick={(e) => e.stopPropagation()}
            title={`Shop on ${product.retailer}`}
          >
            <svg className="w-3.5 h-3.5 stroke-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Sale badge */}
        {product.originalPrice && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-semibold">
            SALE
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium truncate">
          {product.brand}
        </p>
        <p className="text-xs text-stone-800 font-medium mt-0.5 line-clamp-2 leading-snug">
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-sm font-semibold text-stone-900">${displayPrice}</span>
          {normalizePrice(product.originalPrice) > 0 && (
            <span className="text-xs text-stone-400 line-through">${displayOriginalPrice}</span>
          )}
        </div>

        {/* Color swatches — all available color variants */}
        {allColorOptions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {allColorOptions.slice(0, 12).map((option, i) => {
              const isBestMatch = i === 0
              return (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Color click will be handled by parent (potentially)
                  }}
                  className={`relative group/swatch flex-shrink-0 transition-all ${
                    isBestMatch ? 'w-4 h-4' : 'w-3.5 h-3.5'
                  }`}
                  title={`${option.name}${isBestMatch ? ' (Best match)' : ''}`}
                >
                  <div
                    className={`w-full h-full rounded-full flex-shrink-0 transition-all ${
                      isBestMatch
                        ? 'ring-2 ring-stone-400 ring-offset-1 shadow-sm'
                        : 'border border-stone-200 hover:border-stone-400 hover:scale-110'
                    }`}
                    style={{ backgroundColor: option.hex }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-900 text-white text-[10px] rounded pointer-events-none opacity-0 group-hover/swatch:opacity-100 transition-opacity z-20 whitespace-nowrap">
                    <div className="font-semibold">{option.name}</div>
                    {option.matchScore !== undefined && score !== undefined && (
                      <div className="text-stone-300 text-[9px] mt-0.5">
                        Match: {Math.round(option.matchScore)}%
                      </div>
                    )}
                    {isBestMatch && (
                      <div className="text-stone-400 text-[8px] mt-1 border-t border-stone-700 pt-1">
                        Best for your palette
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
            {allColorOptions.length > 12 && (
              <span className="text-[10px] text-stone-500 font-medium ml-1">+{allColorOptions.length - 12} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
