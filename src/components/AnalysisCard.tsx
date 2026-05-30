import React, { useState, useRef } from 'react'
import { SavedAnalysis } from '../types'
import { useApp } from '../context/AppContext'
import { getMatchColor, getMatchLabel } from '../utils/colorUtils'
import ProductWishListPicker from './ProductWishListPicker'
import AnalysisModal from './AnalysisModal'

interface Props {
  analysis: SavedAnalysis
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
}

export default function AnalysisCard({ analysis, onDelete, onToggleFavorite }: Props) {
  const { wishLists } = useApp()
  const [showWishListPicker, setShowWishListPicker] = useState(false)
  const [pickerAdded, setPickerAdded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const heartButtonRef = useRef<HTMLButtonElement>(null)

  const colorOptions = analysis.fullAnalysis?.allOptions || analysis.topColorPicks || []
  const primaryColor = colorOptions[0]?.hex || '#C8C8C8'
  const mainImage = analysis.productImageUrl

  const inAnyWishList = wishLists.some(list =>
    list.items.some(item => item.analysisId === analysis.id)
  )

  function hexWithOpacity(hex: string, alpha: string) {
    return hex + alpha
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    })
  }

  return (
    <>
    <div
      onClick={() => setShowModal(true)}
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
      {/* Image / Color block */}
      <div className="relative overflow-hidden aspect-[3/4]">
        {mainImage ? (
          <img
            src={mainImage}
            alt={analysis.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col justify-end transition-transform duration-500 group-hover:scale-105"
            style={{
              background: `linear-gradient(160deg, ${primaryColor}88 0%, ${primaryColor} 55%, ${hexWithOpacity(primaryColor, 'CC')} 100%)`,
            }}
          >
            <div className="px-3 py-2 bg-gradient-to-t from-black/25 to-transparent">
              <p className="text-white text-[11px] font-medium capitalize leading-tight drop-shadow">
                {colorOptions[0]?.name || 'Analyzed'}
              </p>
            </div>
          </div>
        )}

        {/* Score badge */}
        {analysis.colorScore !== undefined && (
          <div
            className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-white text-[10px] font-semibold backdrop-blur-sm"
            style={{ backgroundColor: getMatchColor(analysis.colorScore) + 'CC' }}
          >
            {getMatchLabel(analysis.colorScore)}
          </div>
        )}

        {/* Action buttons (visible on hover) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              ref={heartButtonRef}
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowWishListPicker(!showWishListPicker)
              }}
            >
              <svg
                className={`w-3.5 h-3.5 ${inAnyWishList || pickerAdded ? 'fill-rose-500 stroke-rose-500' : 'stroke-stone-600 fill-transparent'}`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            {showWishListPicker && (
              <ProductWishListPicker
                analysis={analysis}
                onClose={() => setShowWishListPicker(false)}
                onAdded={() => setPickerAdded(true)}
                triggerRef={heartButtonRef}
              />
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(analysis.id)
            }}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5 stroke-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium truncate">
          {analysis.productBrand}
        </p>
        <p className="text-xs text-stone-800 font-medium mt-0.5 line-clamp-2 leading-snug">
          {analysis.productName}
        </p>
        <p className="text-[10px] text-stone-500 mt-1">
          {formatDate(analysis.savedAt)}
        </p>

        {/* Color swatches */}
        {colorOptions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {colorOptions.slice(0, 12).map((option, i) => {
              const isBestMatch = i === 0
              return (
                <button
                  key={i}
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
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-900 text-white text-[10px] rounded pointer-events-none opacity-0 group-hover/swatch:opacity-100 transition-opacity z-20 whitespace-nowrap">
                    <div className="font-semibold">{option.name}</div>
                    {option.matchScore !== undefined && (
                      <div className="text-stone-300 text-[9px] mt-0.5">
                        Match: {Math.round(option.matchScore)}%
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
            {colorOptions.length > 12 && (
              <span className="text-[10px] text-stone-500 font-medium ml-1">+{colorOptions.length - 12}</span>
            )}
          </div>
        )}
      </div>
    </div>
    {showModal && <AnalysisModal analysis={analysis} onClose={() => setShowModal(false)} />}
    </>
  )
}
