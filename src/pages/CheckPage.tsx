import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { resizeImageToBase64 } from '../utils/colorUtils'

type Tab = 'upload' | 'history'
type InputMode = 'photo' | 'link'
type Verdict = 'perfect' | 'great' | 'good' | 'fair' | 'skip'

interface AnalysisResult {
  productName: string
  productBrand: string
  productCategory: string
  productPrice: number | null
  colorScore: number
  bodyTypeScore: number | null
  colorVerdict: Verdict
  bodyTypeVerdict: Verdict | null
  colorReasoning: string
  fitReasoning: string | null
  suggestedStyling: string | null
  recommendedSize: string | null
  sizeReasoning: string | null
  topColorPicks: Array<{
    name: string; hex: string; matchScore: number; verdict: Verdict
    reasoning: string; url: string | null; imageUrl: string | null
  }>
  allOptions: Array<{
    name: string; hex: string; url: string | null; imageUrl: string | null
    matchScore: number; verdict: Verdict; colorReasoning: string; fitReasoning: string | null
  }>
  overallRecommendation: string
  productImageUrl: string | null
  productUrl: string | null
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

function verdictData(v: Verdict) {
  return VERDICT[v]
}

export default function CheckPage() {
  const { userProfile, saveAnalysis, analyses, deleteAnalysis, toggleFavoriteAnalysis } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('upload')
  const [mode, setMode] = useState<InputMode>('photo')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imagePayload, setImagePayload] = useState<{ data: string; mediaType: string } | null>(null)
  const [linkInput, setLinkInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

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
        id: `analysis-${Date.now()}`,
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
              <div className="space-y-6">
                <button
                  onClick={resetForm}
                  className="text-stone-600 hover:text-stone-900 text-sm font-medium"
                >
                  ← Analyze another item
                </button>
                <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    {result.productImageUrl && (
                      <img src={result.productImageUrl} alt={result.productName} className="w-32 h-32 object-cover rounded" />
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
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${verdictData(result.colorVerdict as Verdict).pill}`}>
                          {verdictData(result.colorVerdict as Verdict).emoji} {verdictData(result.colorVerdict as Verdict).label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScoreBar score={result.colorScore} color={verdictData(result.colorVerdict as Verdict).bar} />
                      <span className="text-sm font-medium text-stone-600">{result.colorScore}%</span>
                    </div>
                    <p className="text-sm text-stone-600 mt-2">{result.colorReasoning}</p>
                  </div>

                  {/* Overall recommendation */}
                  <div className="bg-stone-50 rounded-lg p-4">
                    <p className="text-sm text-stone-600"><strong>Recommendation:</strong> {result.overallRecommendation}</p>
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
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {analyses.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-stone-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-stone-500 text-lg">No analysis history yet</p>
                <p className="text-stone-400 text-sm">Start by uploading a photo or link in the Upload tab</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="bg-white rounded-lg border border-stone-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      {analysis.productImageUrl && (
                        <img
                          src={analysis.productImageUrl}
                          alt={analysis.productName}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-500">{analysis.productBrand}</p>
                        <p className="font-medium text-stone-900 truncate">{analysis.productName}</p>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {new Date(analysis.savedAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-stone-600">Score:</span>
                            <ScoreBar score={analysis.colorScore} color="#059669" />
                            <span className="text-xs font-medium text-stone-600">{analysis.colorScore}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavoriteAnalysis(analysis.id)}
                          className="text-xl hover:scale-110 transition-transform"
                        >
                          {analysis.isFavorited ? '❤️' : '🤍'}
                        </button>
                        <button
                          onClick={() => deleteAnalysis(analysis.id)}
                          className="text-stone-400 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
