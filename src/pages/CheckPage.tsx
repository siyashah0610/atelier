import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { resizeImageToBase64 } from '../utils/colorUtils'
import { Product, Board } from '../types'

type InputMode = 'photo' | 'link' | 'barcode'
type Verdict = 'perfect' | 'great' | 'good' | 'fair' | 'skip'

interface OptionResult {
  name: string
  hex: string
  url: string | null
  imageUrl: string | null
  matchScore: number
  verdict: Verdict
  colorReasoning: string
  fitReasoning: string | null
}

interface TopColorPick {
  name: string
  hex: string
  matchScore: number
  verdict: Verdict
  reasoning: string
  url: string | null
  imageUrl: string | null
}

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
  topColorPicks: TopColorPick[]
  allOptions: OptionResult[]
  overallRecommendation: string
  productImageUrl: string | null
  productUrl: string | null
}

const VERDICT = {
  perfect: { emoji: '✦', label: 'Perfect',  pill: 'bg-emerald-600 text-white', bar: '#059669' },
  great:   { emoji: '✓', label: 'Great',    pill: 'bg-green-500 text-white',   bar: '#22C55E' },
  good:    { emoji: '~', label: 'Good',      pill: 'bg-amber-500 text-white',   bar: '#F59E0B' },
  fair:    { emoji: '!', label: 'Fair',      pill: 'bg-orange-500 text-white',  bar: '#F97316' },
  skip:    { emoji: '✕', label: 'Skip',      pill: 'bg-red-500 text-white',     bar: '#EF4444' },
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden flex-1">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
    </div>
  )
}

const STORE_NAMES: Record<string, string> = {
  aritzia: 'Aritzia', sephora: 'Sephora', nordstrom: 'Nordstrom', nordstromrack: 'Nordstrom Rack',
  zara: 'Zara', hm: 'H&M', uniqlo: 'Uniqlo', mango: 'Mango', everlane: 'Everlane',
  reformation: 'Reformation', anthropologie: 'Anthropologie', freepeople: 'Free People',
  urbanoutfitters: 'Urban Outfitters', abercrombie: 'Abercrombie & Fitch', hollister: 'Hollister',
  gap: 'Gap', bananarepublic: 'Banana Republic', jcrew: 'J.Crew', amazon: 'Amazon',
  target: 'Target', walmart: 'Walmart', macys: "Macy's", bloomingdales: "Bloomingdale's",
  saksfifthavenue: 'Saks Fifth Avenue', neimanmarcus: 'Neiman Marcus', revolve: 'Revolve',
  shopbop: 'Shopbop', ssense: 'SSENSE', farfetch: 'Farfetch', matchesfashion: 'MatchesFashion',
  lulus: 'Lulus', shein: 'SHEIN', prettylittlething: 'PrettyLittleThing', asos: 'ASOS',
  boohoo: 'Boohoo', fashionnova: 'Fashion Nova', forever21: 'Forever 21', express: 'Express',
  loft: 'LOFT', anntaylor: 'Ann Taylor', oldnavy: 'Old Navy', americaneagle: 'American Eagle',
  victoriassecret: "Victoria's Secret", lululemon: 'Lululemon', athleta: 'Athleta',
  fabletics: 'Fabletics', gymshark: 'Gymshark', alo: 'Alo Yoga', vuori: 'Vuori',
  patagonia: 'Patagonia', arcteryx: "Arc'teryx", nike: 'Nike', adidas: 'Adidas',
  puma: 'Puma', newbalance: 'New Balance', vans: 'Vans', converse: 'Converse',
  allbirds: 'Allbirds', levis: "Levi's", lacoste: 'Lacoste', calvinklein: 'Calvin Klein',
  ralphlauren: 'Ralph Lauren', tommyhilfiger: 'Tommy Hilfiger', coach: 'Coach',
  katespade: 'Kate Spade', michaelkors: 'Michael Kors', toryburch: 'Tory Burch',
  zalando: 'Zalando', netaporter: 'Net-a-Porter', mytheresa: 'Mytheresa',
  matchesnow: 'Matches', matches: 'Matches', reiss: 'Reiss', cos: 'COS',
  arket: 'Arket', weekday: 'Weekday', monki: 'Monki', acnestudios: 'Acne Studios',
  allsaints: 'AllSaints', rag: 'Rag & Bone', theory: 'Theory', vince: 'Vince',
  intermix: 'Intermix', shopspring: 'Spring',
}

const SKIP_PREFIXES = new Set(['www', 'www2', 'shop', 'store', 'm', 'mobile', 'us', 'uk', 'ca', 'au', 'nz', 'eu', 'en', 'fr', 'de', 'it', 'es', 'nl', 'jp', 'global'])

function extractStoreName(url: string | null | undefined): string {
  if (!url) return 'Atelier Analysis'
  try {
    const parts = new URL(url).hostname.toLowerCase().split('.')
    // Walk from left, skip common non-brand prefixes, stop before TLD/SLD
    const tldCount = parts.length > 3 && parts[parts.length - 2].length <= 3 ? 2 : 1
    const brandParts = parts.slice(0, parts.length - tldCount).filter(p => !SKIP_PREFIXES.has(p))
    const key = brandParts[0]?.replace(/[^a-z0-9]/g, '') ?? ''
    return STORE_NAMES[key] ?? (key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Atelier Analysis')
  } catch {
    return 'Atelier Analysis'
  }
}

export default function CheckPage() {
  const { userProfile, boards, createBoard, addToBoard, addToCart, saveAnalysis } = useApp()
  const [mode, setMode] = useState<InputMode>('photo')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imagePayload, setImagePayload] = useState<{ data: string; mediaType: string } | null>(null)
  const [linkInput, setLinkInput] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  // Pin-saving state
  const [savingOption, setSavingOption] = useState<string | null>(null) // option name being saved
  const [selectedBoardId, setSelectedBoardId] = useState<string>('')
  const [newBoardName, setNewBoardName] = useState('')
  const [savedOptions, setSavedOptions] = useState<Set<string>>(new Set())
  const [cartedOptions, setCartedOptions] = useState<Set<string>>(new Set())
  const [analysisSaved, setAnalysisSaved] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const palette = userProfile?.palette ?? null
  const bodyType = userProfile?.bodyProfile?.bodyType ?? null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null); setError(null); setErrorHint(null)
    setPreviewUrl(URL.createObjectURL(file))
    setImagePayload(await resizeImageToBase64(file))
  }

  async function handleCheck() {
    setError(null); setErrorHint(null); setResult(null)
    setSavedOptions(new Set()); setSavingOption(null)
    setLoading(true)
    try {
      let body: Record<string, unknown>
      if (mode === 'photo') {
        if (!imagePayload) { setError('Upload a product photo first.'); setLoading(false); return }
        body = { type: 'image', data: imagePayload.data, mediaType: imagePayload.mediaType, palette, bodyType }
      } else if (mode === 'link') {
        if (!linkInput.trim()) { setError('Paste a product URL or image URL first.'); setLoading(false); return }
        body = { type: 'url', data: linkInput.trim(), palette, bodyType }
      } else {
        if (!barcodeInput.trim()) { setError('Enter a barcode number first.'); setLoading(false); return }
        body = { type: 'barcode', data: barcodeInput.trim(), palette, bodyType }
      }
      const res = await fetch('/api/product-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setErrorHint(json.hint ?? null); return }
      setResult(json as AnalysisResult)
      setSelectedBoardId(boards[0]?.id ?? '')
    } catch { setError('Network error. Make sure the server is running.')
    } finally { setLoading(false) }
  }

  function reset() {
    setResult(null); setError(null); setErrorHint(null)
    setPreviewUrl(null); setImagePayload(null)
    setLinkInput(''); setBarcodeInput('')
    setSavedOptions(new Set()); setSavingOption(null)
    setCartedOptions(new Set()); setAnalysisSaved(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleAddToCart(opt: { name: string; hex: string; verdict: Verdict; url: string | null; imageUrl: string | null }) {
    if (!result) return
    const sourceUrl = mode === 'link' ? linkInput.trim() : result.productUrl
    const product: Product = {
      id: `check-${Date.now()}-${opt.name.replace(/\s+/g, '-')}`,
      name: `${result.productName}${opt.name && opt.name !== result.productName ? ` — ${opt.name}` : ''}`,
      brand: result.productBrand || 'Unknown',
      retailer: extractStoreName(sourceUrl),
      price: result.productPrice ?? 0,
      category: result.productCategory as Product['category'],
      imageUrl: opt.imageUrl || pinImageUrl(),
      hexColors: [opt.hex],
      rating: 5,
      reviewCount: 0,
      affiliateUrl: opt.url || sourceUrl || '#',
      tags: [opt.verdict, result.productCategory, 'analyzed'],
      bodyTypeTags: bodyType ? [bodyType] : [],
    }
    addToCart(product)
    setCartedOptions((prev) => new Set([...prev, opt.name]))
  }

  function handleSaveAnalysis() {
    if (!result || analysisSaved) return
    const sourceUrl = mode === 'link' ? linkInput.trim() : result.productUrl
    saveAnalysis({
      id: `analysis-${Date.now()}`,
      savedAt: new Date().toISOString(),
      productName: result.productName,
      productBrand: result.productBrand,
      productCategory: result.productCategory,
      productPrice: result.productPrice,
      productImageUrl: result.productImageUrl,
      productUrl: result.productUrl,
      colorScore: result.colorScore,
      colorVerdict: result.colorVerdict,
      overallRecommendation: result.overallRecommendation,
      topColorPicks: result.topColorPicks.slice(0, 3).map((p) => ({
        name: p.name,
        hex: p.hex,
        matchScore: p.matchScore,
        verdict: p.verdict,
        url: p.url,
        imageUrl: p.imageUrl,
        reasoning: p.reasoning,
      })),
      storeName: extractStoreName(sourceUrl),
      fullAnalysis: {
        bodyTypeScore: result.bodyTypeScore,
        bodyTypeVerdict: result.bodyTypeVerdict,
        colorReasoning: result.colorReasoning,
        fitReasoning: result.fitReasoning,
        suggestedStyling: result.suggestedStyling,
        allOptions: result.allOptions.map((o) => ({
          name: o.name,
          hex: o.hex,
          url: o.url,
          imageUrl: o.imageUrl,
          matchScore: o.matchScore,
          verdict: o.verdict,
          colorReasoning: o.colorReasoning,
          fitReasoning: o.fitReasoning,
        })),
      },
    })
    setAnalysisSaved(true)
  }

  function pinImageUrl(): string {
    if (result?.productImageUrl) return result.productImageUrl
    if (previewUrl) return previewUrl
    return `https://picsum.photos/seed/${Date.now()}/400/500`
  }

  async function handleSavePin(option: OptionResult) {
    if (!result) return
    const imgUrl = option.imageUrl || pinImageUrl()

    if (selectedBoardId === '__new__') {
      if (!newBoardName.trim()) return
      createBoard(newBoardName.trim(), 'inspiration')
      // createBoard is sync but board list updates async; use a small delay then find the new board
      await new Promise((r) => setTimeout(r, 50))
      // Re-read boards from context isn't possible here directly; we'll just refetch below
    }

    const targetBoardId = selectedBoardId === '__new__'
      ? boards.find((b) => b.name === newBoardName.trim())?.id ?? ''
      : selectedBoardId

    if (!targetBoardId) return

    const pin: Product = {
      id: `pin-${Date.now()}-${option.name.replace(/\s+/g, '-')}`,
      name: `${result.productName}${option.name && option.name !== result.productName ? ` — ${option.name}` : ''}`,
      brand: result.productBrand || 'Unknown',
      retailer: 'Atelier Analysis',
      price: 0,
      category: result.productCategory as Product['category'],
      imageUrl: imgUrl,
      hexColors: [option.hex],
      rating: 5,
      reviewCount: 0,
      affiliateUrl: mode === 'link' ? linkInput.trim() : '#',
      tags: [option.verdict, result.productCategory, 'analyzed'],
      bodyTypeTags: bodyType ? [bodyType] : [],
    }

    addToBoard(targetBoardId, pin)
    setSavedOptions((prev) => new Set([...prev, option.name]))
    setSavingOption(null)
    setNewBoardName('')
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-7">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="font-serif text-3xl text-stone-900">Will This Suit You?</h1>
          <p className="text-sm text-stone-500">
            {palette
              ? `Analyzing against your ${palette.seasonalType} palette${bodyType ? ` · ${bodyType}` : ''}`
              : 'Complete your color profile for personalized results'}
          </p>
        </div>

        {/* Input card */}
        {!result && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {/* Mode tabs */}
            <div className="flex border-b border-stone-100">
              {(['photo', 'link', 'barcode'] as InputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setErrorHint(null) }}
                  className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    mode === m ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {m === 'photo' ? 'Photo' : m === 'link' ? 'Link / URL' : 'Barcode'}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5">
              {/* Photo mode */}
              {mode === 'photo' && (
                <>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                  {previewUrl ? (
                    <div className="relative">
                      <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain rounded-xl bg-stone-50" />
                      <button
                        onClick={() => { setPreviewUrl(null); setImagePayload(null); if (fileRef.current) fileRef.current.value = '' }}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-stone-500 hover:text-stone-900"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-stone-200 rounded-xl py-12 flex flex-col items-center gap-3 hover:border-stone-400 hover:bg-stone-50 transition-colors">
                      <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <div className="text-center">
                        <p className="text-sm font-medium text-stone-700">Upload a product photo</p>
                        <p className="text-xs text-stone-400 mt-0.5">Clothing, makeup, jewelry — anything</p>
                      </div>
                    </button>
                  )}
                </>
              )}

              {/* Link mode */}
              {mode === 'link' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-stone-600 uppercase tracking-wider">Product URL or Image URL</label>
                    <input
                      type="url"
                      value={linkInput}
                      onChange={(e) => { setLinkInput(e.target.value); setError(null); setErrorHint(null) }}
                      placeholder="https://…"
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-500 bg-stone-50"
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1.5">
                    <p className="text-xs font-semibold text-amber-800">Two ways to use this</p>
                    <p className="text-xs text-amber-700">
                      <span className="font-medium">Product page URL</span> — paste the full link (works on many sites with server-side rendering)
                    </p>
                    <p className="text-xs text-amber-700">
                      <span className="font-medium">Direct image URL</span> — right-click the product photo → "Copy image address" → paste here. Works on every site, always.
                    </p>
                  </div>
                </div>
              )}

              {/* Barcode mode */}
              {mode === 'barcode' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stone-600 uppercase tracking-wider">Barcode / UPC Number</label>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => { setBarcodeInput(e.target.value.replace(/\D/g, '')); setError(null) }}
                    placeholder="e.g. 012345678905"
                    maxLength={14}
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:border-stone-500 bg-stone-50"
                  />
                  <p className="text-xs text-stone-400">Type the UPC/EAN from the tag or packaging.</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                  {errorHint && <p className="text-xs text-red-500 leading-relaxed">{errorHint}</p>}
                </div>
              )}

              <button
                onClick={handleCheck}
                disabled={loading}
                className="w-full py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing…</>
                ) : 'Analyze This Item'}
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Product header */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="p-5 flex items-start gap-4">
                {pinImageUrl() && (
                  <img src={pinImageUrl()} alt={result.productName} className="w-20 h-24 object-cover rounded-xl bg-stone-100 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  {result.productBrand && <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{result.productBrand}</p>}
                  <p className="font-serif text-xl text-stone-900 mt-0.5">{result.productName}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-xs text-stone-500 capitalize">{result.productCategory}</p>
                    {result.productPrice ? <span className="text-xs font-semibold text-stone-700">${result.productPrice.toFixed(2)}</span> : null}
                  </div>
                  {result.overallRecommendation && (
                    <p className="text-sm text-stone-700 mt-2 leading-snug">{result.overallRecommendation}</p>
                  )}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-stone-100 bg-amber-50 space-y-2.5">
                {!analysisSaved && (
                  <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    This analysis won't be stored unless you save it
                  </p>
                )}
                <button
                  onClick={handleSaveAnalysis}
                  disabled={analysisSaved}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    analysisSaved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm'
                  }`}
                >
                  {analysisSaved ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2H5z"/></svg>
                      Saved to History
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                      Save Analysis to History
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Your Analysis</h3>

              {/* Color score */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-700">Color Match</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${VERDICT[result.colorVerdict].pill}`}>
                      {VERDICT[result.colorVerdict].emoji} {VERDICT[result.colorVerdict].label}
                    </span>
                    <span className="text-xs font-bold text-stone-700 w-7 text-right">{result.colorScore}</span>
                  </div>
                </div>
                <ScoreBar score={result.colorScore} color={VERDICT[result.colorVerdict].bar} />
                {result.colorReasoning && <p className="text-xs text-stone-500 leading-relaxed">{result.colorReasoning}</p>}
              </div>

              {/* Body type score */}
              {result.bodyTypeScore !== null && result.bodyTypeVerdict && (
                <div className="space-y-1.5 pt-1 border-t border-stone-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">Body Type Fit</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${VERDICT[result.bodyTypeVerdict].pill}`}>
                        {VERDICT[result.bodyTypeVerdict].emoji} {VERDICT[result.bodyTypeVerdict].label}
                      </span>
                      <span className="text-xs font-bold text-stone-700 w-7 text-right">{result.bodyTypeScore}</span>
                    </div>
                  </div>
                  <ScoreBar score={result.bodyTypeScore} color={VERDICT[result.bodyTypeVerdict].bar} />
                  {result.fitReasoning && <p className="text-xs text-stone-500 leading-relaxed">{result.fitReasoning}</p>}
                </div>
              )}
            </div>

            {/* Stylist suggestions */}
            {(result.topColorPicks.length > 0 || result.suggestedStyling) && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Stylist Suggestions</h3>

                {/* Best available color from actual product variants */}
                {result.topColorPicks[0] && (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-full border-2 border-stone-100 shadow-sm flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: result.topColorPicks[0].hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Best available color for you</p>
                      <p className="text-sm font-semibold text-stone-900 mt-0.5">{result.topColorPicks[0].name}</p>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">{result.topColorPicks[0].reasoning}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {result.topColorPicks[0].url && (
                          <a
                            href={result.topColorPicks[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-700 text-white text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            Shop {result.topColorPicks[0].name}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        )}
                        {cartedOptions.has(result.topColorPicks[0].name) ? (
                          <span className="text-xs text-emerald-600 font-medium">✓ Added to cart</span>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(result.topColorPicks[0])}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 text-[11px] font-semibold rounded-lg transition-colors"
                          >
                            Add to Cart{result.productPrice ? ` · $${result.productPrice.toFixed(2)}` : ''}
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-emerald-500 flex-shrink-0">{result.topColorPicks[0].matchScore}</span>
                  </div>
                )}

                {result.suggestedStyling && (
                  <div className={result.topColorPicks[0] ? 'pt-3 border-t border-stone-50' : ''}>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">How to wear it</p>
                    <p className="text-xs text-stone-600 leading-relaxed">{result.suggestedStyling}</p>
                  </div>
                )}
              </div>
            )}

            {/* Top 3 distinct color picks */}
            {result.topColorPicks && result.topColorPicks.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Top Color Picks</h3>
                <p className="text-xs text-stone-400 mb-6">Three distinct shades from different color families — click any to shop</p>
                <div className="grid grid-cols-3 gap-3">
                  {result.topColorPicks.map((pick, i) => (
                    <div key={pick.name} className="relative flex flex-col gap-1.5">
                      {i === 0 && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                          <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Best Match</span>
                        </div>
                      )}
                      {pick.url ? (
                        <a
                          href={pick.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-stone-100 hover:border-stone-300 hover:shadow-md transition-all"
                        >
                          <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-stone-100">
                            {pick.imageUrl ? (
                              <img src={pick.imageUrl} alt={pick.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full border-4 border-white shadow-md" style={{ backgroundColor: pick.hex }} />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-stone-900 text-center truncate w-full">{pick.name}</p>
                          <p className="text-[10px] text-stone-400">{pick.matchScore}% match</p>
                          <div className="w-full py-1.5 rounded-lg bg-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-colors text-center">
                            <p className="text-[10px] font-semibold">Shop →</p>
                          </div>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-stone-100">
                          <div className="w-full aspect-[3/4] rounded-lg bg-stone-100 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full border-4 border-white shadow-md" style={{ backgroundColor: pick.hex }} />
                          </div>
                          <p className="text-xs font-semibold text-stone-900 text-center truncate w-full">{pick.name}</p>
                          <p className="text-[10px] text-stone-400">{pick.matchScore}% match</p>
                          <p className="text-[9px] text-stone-300">No direct link</p>
                        </div>
                      )}
                      {cartedOptions.has(pick.name) ? (
                        <p className="text-[10px] text-emerald-600 font-medium text-center">✓ Added</p>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(pick)}
                          className="w-full py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-[10px] font-semibold transition-colors"
                        >
                          Add to Cart{result.productPrice ? ` · $${result.productPrice.toFixed(2)}` : ''}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All ranked options */}
            <div className="space-y-2">
              {result.allOptions.map((opt) => {
                const v = VERDICT[opt.verdict]
                const isSaving = savingOption === opt.name
                const saved = savedOptions.has(opt.name)
                const carted = cartedOptions.has(opt.name)
                return (
                  <div key={opt.name} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                    <div className="flex items-center gap-3">
                      {/* Image & Color swatch */}
                      {opt.url ? (
                        <a href={opt.url} target="_blank" rel="noopener noreferrer" className="relative flex-shrink-0 hover:opacity-80 transition-opacity block">
                          {opt.imageUrl && (
                            <img src={opt.imageUrl} alt={opt.name} className="w-10 h-12 object-cover rounded-md border border-stone-200 shadow-sm bg-stone-50" />
                          )}
                          <div
                            className={`rounded-full border shadow-sm ${opt.imageUrl ? 'w-4 h-4 absolute -bottom-1 -right-1.5 border-white border-2' : 'w-9 h-9 border-stone-100'}`}
                            style={{ backgroundColor: opt.hex }}
                          />
                        </a>
                      ) : (
                        <div className="relative flex-shrink-0">
                          {opt.imageUrl && (
                            <img src={opt.imageUrl} alt={opt.name} className="w-10 h-12 object-cover rounded-md border border-stone-200 shadow-sm bg-stone-50" />
                          )}
                          <div
                            className={`rounded-full border shadow-sm ${opt.imageUrl ? 'w-4 h-4 absolute -bottom-1 -right-1.5 border-white border-2' : 'w-9 h-9 border-stone-100'}`}
                            style={{ backgroundColor: opt.hex }}
                          />
                        </div>
                      )}

                      {/* Name + score bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-stone-900 truncate">
                            {opt.url ? (
                              <a href={opt.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-stone-900">
                                {opt.name}
                              </a>
                            ) : opt.name}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.pill}`}>{v.emoji} {v.label}</span>
                            <span className="text-xs font-bold text-stone-700 w-8 text-right">{opt.matchScore}</span>
                          </div>
                        </div>
                        <ScoreBar score={opt.matchScore} color={v.bar} />
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="mt-3 space-y-1 pl-12">
                      <p className="text-xs text-stone-600 leading-relaxed">{opt.colorReasoning}</p>
                      {opt.fitReasoning && (
                        <p className="text-xs text-stone-500 leading-relaxed italic">{opt.fitReasoning}</p>
                      )}
                      {opt.url && (
                        <a
                          href={opt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-semibold rounded-lg transition-colors"
                        >
                          Shop {opt.name}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      )}
                    </div>

                    {/* Add to cart */}
                    <div className="mt-3 pl-12">
                      {carted ? (
                        <p className="text-xs text-emerald-600 font-medium">✓ Added to cart{result.productPrice ? ` · $${result.productPrice.toFixed(2)}` : ''}</p>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(opt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold rounded-lg transition-colors"
                        >
                          Add to Cart{result.productPrice ? ` · $${result.productPrice.toFixed(2)}` : ''}
                        </button>
                      )}
                    </div>

                    {/* Save as pin */}
                    {!saved ? (
                      <div className="mt-3 pl-12">
                        {isSaving ? (
                          <div className="space-y-2">
                            <select
                              value={selectedBoardId}
                              onChange={(e) => setSelectedBoardId(e.target.value)}
                              className="w-full text-xs border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-stone-400"
                            >
                              {boards.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                              <option value="__new__">+ Create new board…</option>
                            </select>
                            {selectedBoardId === '__new__' && (
                              <input
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                placeholder="Board name"
                                className="w-full text-xs border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 focus:outline-none focus:border-stone-400"
                              />
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSavePin(opt)}
                                className="flex-1 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800"
                              >
                                Save Pin
                              </button>
                              <button
                                onClick={() => setSavingOption(null)}
                                className="flex-1 py-2 border border-stone-200 text-stone-600 text-xs rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (boards.length === 0) { createBoard('My Picks', 'inspiration'); setSelectedBoardId('') }
                              setSavingOption(opt.name)
                            }}
                            className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2 transition-colors"
                          >
                            Pin {opt.name} to a board
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 pl-12 text-xs text-emerald-600 font-medium">✓ Saved to board</p>
                    )}
                  </div>
                )
              })}
            </div>

            <button onClick={reset} className="w-full py-3 border border-stone-200 rounded-xl text-xs font-semibold text-stone-500 hover:bg-white uppercase tracking-wider transition-colors">
              Analyze Another Item
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
