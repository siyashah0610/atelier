import React from 'react'
import { createPortal } from 'react-dom'
import { SavedAnalysis } from '../types'
import { getMatchColor, getMatchLabel } from '../utils/colorUtils'

interface Props {
  analysis: SavedAnalysis
  onClose: () => void
}

export default function AnalysisModal({ analysis, onClose }: Props) {
  const colorOptions = analysis.fullAnalysis?.allOptions || analysis.topColorPicks || []
  const allRecommendedColors = analysis.fullAnalysis?.allOptions || []

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 p-6 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-stone-500 font-medium">{analysis.productBrand}</p>
            <h2 className="text-xl font-semibold text-stone-900 mt-1">{analysis.productName}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-stone-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 stroke-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product image and price */}
          <div className="flex gap-6">
            {analysis.productImageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={analysis.productImageUrl}
                  alt={analysis.productName}
                  className="w-32 h-40 object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex-1">
              {analysis.productPrice && (
                <p className="text-lg font-semibold text-stone-900">${analysis.productPrice}</p>
              )}
              <p className="text-sm text-stone-500 mt-2">{analysis.storeName}</p>
              {analysis.recommendedSize && (
                <p className="text-sm text-stone-600 mt-3">
                  <span className="font-medium">Recommended Size:</span> {analysis.recommendedSize}
                </p>
              )}
            </div>
          </div>

          {/* Color Score */}
          <div className="bg-stone-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">Color Match</h3>
              <span
                className="px-3 py-1 rounded-full text-white text-sm font-semibold"
                style={{ backgroundColor: getMatchColor(analysis.colorScore) }}
              >
                {getMatchLabel(analysis.colorScore)} ({Math.round(analysis.colorScore)}%)
              </span>
            </div>
            <p className="text-sm text-stone-600">{analysis.colorVerdict}</p>
            {analysis.fullAnalysis?.colorReasoning && (
              <p className="text-sm text-stone-600 mt-2">{analysis.fullAnalysis.colorReasoning}</p>
            )}
          </div>

          {/* Body Type (if available) */}
          {analysis.fullAnalysis?.bodyTypeScore !== null && analysis.fullAnalysis?.bodyTypeScore !== undefined && (
            <div className="bg-stone-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-900">Fit Analysis</h3>
                <span className="text-sm text-stone-600">
                  {Math.round(analysis.fullAnalysis.bodyTypeScore)}% match
                </span>
              </div>
              {analysis.fullAnalysis?.bodyTypeVerdict && (
                <p className="text-sm text-stone-600">{analysis.fullAnalysis.bodyTypeVerdict}</p>
              )}
              {analysis.fullAnalysis?.fitReasoning && (
                <p className="text-sm text-stone-600 mt-2">{analysis.fullAnalysis.fitReasoning}</p>
              )}
            </div>
          )}

          {/* Recommended Colors */}
          {colorOptions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-stone-900">Recommended Colors</h3>
              <div className="grid grid-cols-2 gap-3">
                {colorOptions.slice(0, 6).map((color, i) => (
                  <div key={i} className="bg-stone-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-stone-200"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm font-medium text-stone-900">{color.name}</span>
                    </div>
                    <p className="text-xs text-stone-500">{color.verdict}</p>
                    {('colorReasoning' in color) && (
                      <p className="text-xs text-stone-600 line-clamp-2">{(color as any).colorReasoning}</p>
                    )}
                    {('reasoning' in color) && (
                      <p className="text-xs text-stone-600 line-clamp-2">{(color as any).reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
              {colorOptions.length > 6 && (
                <p className="text-sm text-stone-500">+{colorOptions.length - 6} more colors</p>
              )}
            </div>
          )}

          {/* Overall Recommendation */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="font-semibold text-stone-900 mb-2">Recommendation</h3>
            <p className="text-sm text-stone-700">{analysis.overallRecommendation}</p>
          </div>

          {/* Styling Tips */}
          {analysis.fullAnalysis?.suggestedStyling && (
            <div className="space-y-2">
              <h3 className="font-semibold text-stone-900">Styling Tips</h3>
              <p className="text-sm text-stone-600">{analysis.fullAnalysis.suggestedStyling}</p>
            </div>
          )}

          {/* Saved Date */}
          <div className="text-xs text-stone-400 pt-2 border-t border-stone-100">
            Analyzed on {new Date(analysis.savedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
