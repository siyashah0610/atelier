import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { resizeImageToBase64 } from '../utils/colorUtils'
import AnalysisCard from '../components/AnalysisCard'
import AnalysisResultPanel from '../components/AnalysisResultPanel'
import { AnalysisResult, Product, ProductCategory } from '../types'

type Tab = 'upload' | 'history'
type InputMode = 'photo' | 'link'

export default function CheckPage() {
  const { userProfile, saveAnalysis, analyses, deleteAnalysis, toggleFavoriteAnalysis, addToCart } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [mode, setMode] = useState<InputMode>('photo')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imagePayload, setImagePayload] = useState<{ data: string; mediaType: string } | null>(null)
  const [linkInput, setLinkInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLButtonElement>(null)
  const [addedToCart, setAddedToCart] = useState(false)

  const getTempProduct = (): Product | null => {
    if (!result) return null
    return {
      id: `analyzed-${Date.now()}`,
      name: result.productName,
      brand: result.productBrand,
      retailer: result.retailer || 'Unknown Store',
      price: result.productPrice || 0,
      category: (result.productCategory as ProductCategory) || 'clothing',
      imageUrl: result.productImageUrl || '',
      hexColors: result.topColorPicks.map(p => p.hex),
      sizes: result.recommendedSize ? [result.recommendedSize] : undefined,
      rating: 0,
      reviewCount: 0,
      affiliateUrl: result.productUrl || '',
      tags: [],
      matchScore: result.colorScore,
      colorOptions: result.allOptions.map(o => ({
        name: o.name,
        hex: o.hex,
        matchScore: o.matchScore,
        url: o.url || result.productUrl || '',
        imageUrl: o.imageUrl || result.productImageUrl || '',
      }))
    }
  }

  const fileRef = useRef<HTMLInputElement>(null)
  const palette = userProfile?.palette ?? null
  const bodyProfile = userProfile?.bodyProfile ?? null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setError(null)
    setPreviewUrl(URL.createObjectURL(file))
    setImagePayload(await resizeImageToBase64(file))
  }

  const handleCheck = async () => {
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      let body: Record<string, unknown>
      if (mode === 'photo') {
        if (!imagePayload) {
          setError('Upload a product photo first.')
          setLoading(false)
          return
        }
        body = { type: 'image', data: imagePayload.data, mediaType: imagePayload.mediaType, palette, bodyProfile }
      } else {
        if (!linkInput.trim()) {
          setError('Paste a product URL first.')
          setLoading(false)
          return
        }
        body = { type: 'url', data: linkInput.trim(), palette, bodyProfile }
      }

      const res = await fetch('/api/product-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong.')
        return
      }

      const r = json as AnalysisResult
      setResult(r)

      saveAnalysis({
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        productName: r.productName,
        productBrand: r.productBrand,
        productCategory: r.productCategory,
        productPrice: r.productPrice,
        productImageUrl: r.productImageUrl,
        productUrl: mode === 'link' ? linkInput.trim() : r.productUrl,
        colorScore: r.colorScore,
        colorVerdict: r.colorVerdict,
        overallRecommendation: r.overallRecommendation,
        topColorPicks: r.topColorPicks,
        storeName: 'Checked Item',
        fullAnalysis: {
          bodyTypeScore: r.bodyTypeScore,
          bodyTypeVerdict: r.bodyTypeVerdict,
          colorReasoning: r.colorReasoning,
          fitReasoning: r.fitReasoning,
          suggestedStyling: r.suggestedStyling,
          sizeReasoning: r.sizeReasoning,
          allOptions: r.allOptions,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPreviewUrl(null)
    setImagePayload(null)
    setLinkInput('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-stone-200 mb-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-1 border-b-2 transition-colors font-medium ${
              activeTab === 'upload'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            Upload & Analyze
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 border-b-2 transition-colors font-medium flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            History
            {analyses.length > 0 && (
              <span className="text-xs bg-stone-900 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {analyses.length}
              </span>
            )}
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {!result ? (
              <>
                {/* Input mode selector */}
                <div className="flex gap-4">
                  <button
                    onClick={() => { setMode('photo'); resetForm() }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      mode === 'photo'
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    📸 Photo
                  </button>
                  <button
                    onClick={() => { setMode('link'); resetForm() }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      mode === 'link'
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    🔗 Link
                  </button>
                </div>

                {/* Photo upload */}
                {mode === 'photo' && (
                  <div className="space-y-4">
                    {previewUrl ? (
                      <div className="relative">
                        <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-lg max-h-96 object-cover" />
                        <button
                          onClick={() => { setPreviewUrl(null); setImagePayload(null) }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-stone-400 transition-colors"
                      >
                        <svg className="w-12 h-12 text-stone-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-stone-700 font-medium">Upload a product photo</p>
                        <p className="text-stone-500 text-sm">Click to select or drag and drop</p>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Link input */}
                {mode === 'link' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">Product URL</label>
                      <input
                        type="url"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="https://example.com/product"
                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                      />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {/* Analyze button */}
                {imagePayload || linkInput ? (
                  <button
                    onClick={handleCheck}
                    disabled={loading}
                    className="w-full bg-stone-900 text-white py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Item'}
                  </button>
                ) : (
                  <div className="bg-stone-100 text-stone-500 py-3 rounded-lg text-center font-medium">
                    {mode === 'photo' ? 'Upload a photo' : 'Enter a URL'} to analyze
                  </div>
                )}
              </>
            ) : (
              <AnalysisResultPanel
                result={result}
                onAnalyzeAnother={resetForm}
                onAddedToCart={addedToCart}
                onSetAddedToCart={setAddedToCart}
              />
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {analyses.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-stone-500 text-lg">No analysis history yet</p>
                <p className="text-stone-400 text-sm">Start by uploading a photo or link in the Upload tab</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {analyses.map((analysis) => (
                  <AnalysisCard
                    key={analysis.id}
                    analysis={analysis}
                    onDelete={deleteAnalysis}
                    onToggleFavorite={toggleFavoriteAnalysis}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
