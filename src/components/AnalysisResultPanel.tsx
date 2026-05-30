import React, { useState, useRef } from 'react'
import { AnalysisResult } from '../types'
import { useApp } from '../context/AppContext'
import ProductWishListPicker from './ProductWishListPicker'

interface Props {
  result: AnalysisResult
  onAnalyzeAnother: () => void
  onAddedToCart: boolean
  onSetAddedToCart: (added: boolean) => void
}

const VERDICT = {
  perfect: { emoji: '✦', label: 'Perfect', pill: 'bg-emerald-600 text-white', bar: '#059669' },
  great: { emoji: '✓', label: 'Great', pill: 'bg-green-500 text-white', bar: '#22C55E' },
  good: { emoji: '~', label: 'Good', pill: 'bg-amber-500 text-white', bar: '#F59E0B' },
  fair: { emoji: '!', label: 'Fair', pill: 'bg-orange-500 text-white', bar: '#F97316' },
  skip: { emoji: '✕', label: 'Skip', pill: 'bg-red-500 text-white', bar: '#EF4444' },
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden flex-1">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
    </div>
  )
}

function verdictData(v: string) {
  return VERDICT[v as keyof typeof VERDICT] || VERDICT.good
}

export default function AnalysisResultPanel({
  result,
  onAnalyzeAnother,
  onAddedToCart,
  onSetAddedToCart,
}: Props) {
  const { addToCart } = useApp()
  const [selectedColorIdx, setSelectedColorIdx] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLButtonElement>(null)

  const allOptions = result.allOptions || []
  const selectedOption = allOptions[selectedColorIdx] || result.topColorPicks[selectedColorIdx]
  const displayImage = selectedOption?.imageUrl || result.productImageUrl

  const getTempProduct = () => {
    return {
      id: `analyzed-${Date.now()}`,
      name: result.productName,
      brand: result.productBrand,
      retailer: result.retailer || 'Unknown Store',
      price: result.productPrice || 0,
      category: (result.productCategory as any) || 'clothing',
      imageUrl: displayImage || '',
      hexColors: result.topColorPicks.map(p => p.hex),
      sizes: result.recommendedSize ? [result.recommendedSize] : undefined,
      rating: 0,
      reviewCount: 0,
      affiliateUrl: selectedOption?.url || result.productUrl || '',
      tags: [],
      matchScore: selectedOption?.matchScore || result.colorScore,
      colorOptions: allOptions.map(o => ({
        name: o.name,
        hex: o.hex,
        matchScore: o.matchScore,
        url: o.url || result.productUrl || '',
        imageUrl: o.imageUrl || result.productImageUrl || '',
      }))
    }
  }

  const handleAddToCart = () => {
    const p = getTempProduct()
    if (p) {
      addToCart(p, result.recommendedSize || undefined)
      onSetAddedToCart(true)
      setTimeout(() => onSetAddedToCart(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onAnalyzeAnother}
        className="text-stone-600 hover:text-stone-900 text-sm font-medium"
      >
        ← Analyze another item
      </button>

      <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-6">
        {/* Product info */}
        <div className="flex items-start gap-4">
          {displayImage && (
            <img src={displayImage} alt={result.productName} className="w-32 h-32 object-cover rounded" />
          )}
          <div className="flex-1">
            <p className="text-sm text-stone-500">{result.productBrand}</p>
            <p className="text-xl font-semibold text-stone-900">{result.productName}</p>
            {result.productPrice && (
              <p className="text-lg text-stone-700 mt-1">${result.productPrice}</p>
            )}
          </div>
        </div>

        {/* Color Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-stone-900">Color Match</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${verdictData(selectedOption?.verdict || result.colorVerdict).pill}`}>
                {verdictData(selectedOption?.verdict || result.colorVerdict).emoji} {verdictData(selectedOption?.verdict || result.colorVerdict).label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBar score={selectedOption?.matchScore || result.colorScore} color={verdictData(selectedOption?.verdict || result.colorVerdict).bar} />
            <span className="text-sm font-medium text-stone-600">{selectedOption?.matchScore || result.colorScore}%</span>
          </div>
          <p className="text-sm text-stone-600 mt-2">{selectedOption?.colorReasoning || result.colorReasoning}</p>
        </div>

        {/* Color Variants */}
        {allOptions.length > 1 && (
          <div className="space-y-3">
            <p className="font-medium text-stone-900 text-sm">Available Colors</p>
            <div className="flex flex-wrap gap-2">
              {allOptions.slice(0, 8).map((option, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedColorIdx(i)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                    selectedColorIdx === i
                      ? 'bg-stone-900 text-white ring-2 ring-stone-400 ring-offset-2'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-stone-300"
                    style={{ backgroundColor: option.hex }}
                  />
                  {option.name}
                </button>
              ))}
              {allOptions.length > 8 && (
                <span className="px-3 py-2 text-xs text-stone-500">+{allOptions.length - 8} more</span>
              )}
            </div>
          </div>
        )}

        {/* Overall recommendation */}
        <div className="bg-stone-50 rounded-lg p-4">
          <p className="text-sm text-stone-600"><strong>Recommendation:</strong> {result.overallRecommendation}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
          <button
            onClick={handleAddToCart}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              onAddedToCart
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            {onAddedToCart ? '✓ Added' : 'Add to Cart'}
          </button>

          <button
            ref={pickerRef}
            onClick={() => setShowPicker(true)}
            className="flex-1 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-lg font-medium text-sm hover:bg-stone-50 transition-colors"
          >
            Add to Wish List
          </button>
          {showPicker && getTempProduct() && (
            <ProductWishListPicker
              product={getTempProduct()}
              onClose={() => setShowPicker(false)}
              triggerRef={pickerRef}
            />
          )}
        </div>

        {/* Top Color Picks */}
        {result.topColorPicks.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-stone-900">Top Color Picks</p>
            <div className="grid grid-cols-2 gap-3">
              {result.topColorPicks.slice(0, 4).map((pick, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-stone-50 rounded">
                  <div className="w-6 h-6 rounded border border-stone-200" style={{ backgroundColor: pick.hex }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-stone-900 truncate">{pick.name}</p>
                    <p className="text-xs text-stone-500">{pick.matchScore}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
