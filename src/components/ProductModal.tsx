import React, { useState, useEffect } from 'react'
import { Product, ColorOption } from '../types'
import { useApp } from '../context/AppContext'
import { getMatchColor, getMatchLabel } from '../utils/colorUtils'
import { formatPrice, normalizePrice } from '../utils/priceUtils'

interface Props {
  product: Product
  onClose: () => void
}

export default function ProductModal({ product, onClose }: Props) {
  const { isProductSaved, saveProduct, unsaveProduct, addToCart } = useApp()
  const saved = isProductSaved(product.id)
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0])
  const [addedToCart, setAddedToCart] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Color option selection
  const options: ColorOption[] = product.colorOptions?.length
    ? product.colorOptions
    : [{ name: '', hex: product.hexColors[0] ?? '#808080', matchScore: product.matchScore ?? 50, url: product.affiliateUrl, imageUrl: product.imageUrl }]

  const [selectedOption, setSelectedOption] = useState<ColorOption>(options[0])

  // Reset when product changes
  useEffect(() => {
    const newOptions = product.colorOptions?.length
      ? product.colorOptions
      : [{ name: '', hex: product.hexColors[0] ?? '#808080', matchScore: product.matchScore ?? 50, url: product.affiliateUrl, imageUrl: product.imageUrl }]
    setSelectedOption(newOptions[0])
    setImgError(false)
    setSelectedSize(product.sizes?.[0])
  }, [product.id])

  useEffect(() => {
    setImgError(false)
  }, [selectedOption.imageUrl])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleAddToCart = () => {
    addToCart({ ...product, affiliateUrl: selectedOption.url }, selectedSize)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const score = selectedOption.matchScore
  const displayImage = selectedOption.imageUrl || product.imageUrl
  const hasImage = !!(displayImage && !imgError)
  const displayPrice = formatPrice(product.price)
  const displayOriginalPrice = formatPrice(product.originalPrice)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
        >
          ✕
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Image / Color block */}
          <div className="sm:w-5/12 aspect-[3/4] sm:aspect-auto bg-stone-100 flex-shrink-0 relative overflow-hidden sm:rounded-l-2xl">
            {hasImage ? (
              <img
                src={displayImage}
                alt={`${product.name} – ${selectedOption.name}`}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col justify-end"
                style={{
                  background: `linear-gradient(160deg, ${selectedOption.hex}88 0%, ${selectedOption.hex} 55%, ${selectedOption.hex}CC 100%)`,
                }}
              >
                <div className="p-4 bg-gradient-to-t from-black/25 to-transparent">
                  <p className="text-white text-sm font-medium capitalize drop-shadow">
                    {selectedOption.name || product.name}
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">{product.brand}</p>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 p-5 sm:p-6 space-y-4">
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
                {product.brand} · {product.retailer}
              </p>
              <h2 className="font-serif text-xl text-stone-900 mt-1">{product.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold text-stone-900">${displayPrice}</span>
                {normalizePrice(product.originalPrice) > 0 && (
                  <span className="text-sm text-stone-400 line-through">${displayOriginalPrice}</span>
                )}
              </div>
            </div>

            {/* Match score for selected color */}
            {score !== undefined && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: getMatchColor(score) }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>
                  {getMatchLabel(score)} palette match — {score}%
                  {selectedOption.name && <span className="opacity-75"> ({selectedOption.name})</span>}
                </span>
              </div>
            )}

            {/* Color picker — all palette-matching options */}
            {options.length > 0 && (
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                  Colors that match your palette
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(opt)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedOption === opt
                          ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                          : 'border-stone-200 text-stone-600 hover:border-stone-400 bg-white'
                      }`}
                      title={`Match: ${opt.matchScore}%`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/50 flex-shrink-0"
                        style={{ backgroundColor: opt.hex }}
                      />
                      {opt.name || 'Color'}
                      {opt.matchScore > 0 && (
                        <span className={`text-[10px] ${selectedOption === opt ? 'text-white/70' : 'text-stone-400'}`}>
                          {opt.matchScore}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size picker */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">Size</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                        selectedSize === size ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(product.rating) ? 'text-amber-400' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-stone-500">{product.rating} ({product.reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-stone-100 text-stone-600 text-[11px] rounded-full capitalize">{tag}</span>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href={selectedOption.url || product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl text-sm font-semibold text-center bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                Shop {selectedOption.name ? `in ${selectedOption.name}` : ''} on {product.retailer} →
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => (saved ? unsaveProduct(product.id) : saveProduct(product))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    saved ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {saved ? '♥ Saved' : '♡ Save'}
                </button>
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    addedToCart ? 'border-green-500 bg-green-50 text-green-700' : 'border-stone-200 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {addedToCart ? '✓ Added' : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
