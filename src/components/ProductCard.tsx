import React, { useState } from 'react'
import { Product } from '../types'
import { useApp } from '../context/AppContext'
import { getMatchColor, getMatchLabel } from '../utils/colorUtils'

interface Props {
  product: Product
  onClick: () => void
}

export default function ProductCard({ product, onClick }: Props) {
  const { isProductSaved, saveProduct, unsaveProduct } = useApp()
  const saved = isProductSaved(product.id)
  const [imgError, setImgError] = useState(false)

  const score = product.matchScore

  return (
    <div
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div
        className={`relative overflow-hidden bg-stone-100 ${
          product.aspectRatio === 'tall' ? 'aspect-[3/4]' : 'aspect-square'
        }`}
      >
        <img
          src={imgError ? `https://picsum.photos/seed/fallback-${product.id}/400/400` : product.imageUrl}
          alt={product.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Match score badge */}
        {score !== undefined && (
          <div
            className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-white text-[10px] font-semibold backdrop-blur-sm"
            style={{ backgroundColor: getMatchColor(score) + 'CC' }}
          >
            {getMatchLabel(score)}
          </div>
        )}

        {/* Save button */}
        <button
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
          <span className="text-sm font-semibold text-stone-900">${product.price}</span>
          {product.originalPrice && (
            <span className="text-xs text-stone-400 line-through">${product.originalPrice}</span>
          )}
        </div>
        {/* Color dots */}
        <div className="flex items-center gap-1 mt-1.5">
          {product.hexColors.map((hex, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border border-stone-200"
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
