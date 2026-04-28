import React, { useState, useEffect, useRef } from 'react'
import { StoredProfile, getProfile, saveProfile, clearProfile, getActiveTabUrl } from './storage'

const API_BASE = 'http://localhost:3001'

const VERDICT_STYLE: Record<string, { pill: string; bar: string; label: string }> = {
  perfect: { pill: 'bg-emerald-600 text-white', bar: '#059669', label: 'Perfect' },
  great:   { pill: 'bg-green-500 text-white',   bar: '#22C55E', label: 'Great' },
  good:    { pill: 'bg-amber-500 text-white',    bar: '#F59E0B', label: 'Good' },
  fair:    { pill: 'bg-orange-500 text-white',   bar: '#F97316', label: 'Fair' },
  skip:    { pill: 'bg-red-500 text-white',      bar: '#EF4444', label: 'Skip' },
}

interface AnalysisResult {
  productName: string
  productBrand: string
  productCategory: string
  colorScore: number
  colorVerdict: string
  colorReasoning: string
  bodyTypeScore: number | null
  bodyTypeVerdict: string | null
  fitReasoning: string | null
  overallRecommendation: string
  recommendedSize: string | null
  topColorPicks: Array<{ name: string; hex: string; matchScore: number; verdict: string; url: string | null; imageUrl: string | null }>
  productImageUrl: string | null
}

// ─── Profile Setup ────────────────────────────────────────────────────────────

function ProfileSetup({ onSaved }: { onSaved: () => void }) {
  const [json, setJson] = useState('')
  const [error, setError] = useState('')

  function handleImport() {
    setError('')
    try {
      const parsed = JSON.parse(json.trim()) as StoredProfile
      if (!parsed.palette && !parsed.bodyProfile) throw new Error('No profile data found')
      saveProfile(parsed).then(onSaved)
    } catch {
      setError('Invalid profile JSON. Go to Atelier → Profile → Copy Profile and paste here.')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="font-serif text-lg text-stone-900">Set up Atelier</p>
        <p className="text-xs text-stone-400 mt-1 leading-relaxed">
          To get started, open the Atelier web app, go to your <strong>Profile</strong>, and click <strong>Copy Profile</strong>. Then paste the JSON below.
        </p>
      </div>

      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder='Paste your profile JSON here…'
        rows={6}
        className="w-full px-3 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 resize-none font-mono"
      />

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <button
        onClick={handleImport}
        disabled={!json.trim()}
        className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-stone-800 transition-colors"
      >
        Import Profile
      </button>
    </div>
  )
}

// ─── Result View ──────────────────────────────────────────────────────────────

function ResultView({ result, url }: { result: AnalysisResult; url: string }) {
  const cv = VERDICT_STYLE[result.colorVerdict] ?? VERDICT_STYLE['good']
  const bv = result.bodyTypeVerdict ? VERDICT_STYLE[result.bodyTypeVerdict] : null

  return (
    <div className="p-4 space-y-4">
      {/* Product header */}
      <div className="flex items-start gap-3">
        {result.productImageUrl && (
          <img src={result.productImageUrl} alt={result.productName} className="w-14 h-18 object-cover rounded-xl bg-stone-100 flex-shrink-0" style={{ height: '72px' }} />
        )}
        <div className="flex-1 min-w-0">
          {result.productBrand && <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{result.productBrand}</p>}
          <p className="font-serif text-base text-stone-900 leading-tight mt-0.5">{result.productName}</p>
          <p className="text-[11px] text-stone-400 mt-0.5 capitalize">{result.productCategory}</p>
        </div>
      </div>

      {/* Scores */}
      <div className="bg-white rounded-xl border border-stone-100 p-3 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">Color Match</span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cv.pill}`}>{cv.label}</span>
              <span className="text-xs font-bold text-stone-600 w-6 text-right">{result.colorScore}</span>
            </div>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${result.colorScore}%`, backgroundColor: cv.bar }} />
          </div>
          {result.colorReasoning && <p className="text-[11px] text-stone-500 leading-relaxed">{result.colorReasoning}</p>}
        </div>

        {bv && result.bodyTypeScore !== null && (
          <div className="space-y-1.5 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">Body Type Fit</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bv.pill}`}>{bv.label}</span>
                <span className="text-xs font-bold text-stone-600 w-6 text-right">{result.bodyTypeScore}</span>
              </div>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${result.bodyTypeScore}%`, backgroundColor: bv.bar }} />
            </div>
            {result.fitReasoning && <p className="text-[11px] text-stone-500 leading-relaxed">{result.fitReasoning}</p>}
          </div>
        )}
      </div>

      {/* Size */}
      {result.recommendedSize && (
        <div className="flex items-center gap-2 bg-stone-900 text-white rounded-xl px-3 py-2">
          <span className="text-xs font-semibold">Recommended size</span>
          <span className="ml-auto text-sm font-bold">{result.recommendedSize}</span>
        </div>
      )}

      {/* Top color picks */}
      {result.topColorPicks.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">Top Color Picks</p>
          <div className="grid grid-cols-3 gap-2">
            {result.topColorPicks.map((pick, i) => (
              <a
                key={pick.name}
                href={pick.url ?? url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1.5 p-2 rounded-xl border border-stone-100 hover:border-stone-300 transition-all bg-white"
              >
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-stone-100">
                  {pick.imageUrl
                    ? <img src={pick.imageUrl} alt={pick.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: pick.hex }} /></div>
                  }
                </div>
                <p className="text-[10px] font-semibold text-stone-800 text-center truncate w-full">{pick.name}</p>
                <p className="text-[9px] text-stone-400">{pick.matchScore}%</p>
                {i === 0 && <span className="text-[8px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Best</span>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Overall */}
      {result.overallRecommendation && (
        <p className="text-xs text-stone-500 leading-relaxed border-t border-stone-100 pt-3">{result.overallRecommendation}</p>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [profile, setProfile] = useState<StoredProfile | null | 'loading'>('loading')
  const [tabUrl, setTabUrl] = useState<string>('')
  const [urlInput, setUrlInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getProfile(), getActiveTabUrl()]).then(([p, url]) => {
      setProfile(p)
      if (url && url.startsWith('http')) {
        setTabUrl(url)
        setUrlInput(url)
      }
    })
  }, [])

  async function analyze() {
    if (!urlInput.trim() || profile === 'loading' || !profile) return
    setAnalyzing(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/product-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'url',
          data: urlInput.trim(),
          palette: profile.palette,
          bodyProfile: profile.bodyProfile,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed')
      setResult(json as AnalysisResult)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setAnalyzing(false)
    }
  }

  if (profile === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return <ProfileSetup onSaved={() => getProfile().then(setProfile)} />
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 bg-[#FAFAF7]/95 backdrop-blur-sm border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-serif text-base text-stone-900">atelier</p>
          {profile.palette && (
            <p className="text-[10px] text-stone-400">{profile.palette.seasonalType}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profile.palette && (
            <div className="flex gap-0.5">
              {profile.palette.dominantColors.slice(0, 4).map((hex, i) => (
                <div key={i} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: hex }} />
              ))}
            </div>
          )}
          <button
            onClick={() => clearProfile().then(() => { setProfile(null); setResult(null) })}
            className="text-[10px] text-stone-300 hover:text-rose-400 transition-colors ml-1"
            title="Reset profile"
          >
            ✕
          </button>
        </div>
      </div>

      {/* URL input */}
      {!result && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-stone-500">Analysing page:</p>
          <div className="flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setResult(null) }}
              placeholder="Product URL…"
              className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400"
            />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button
            onClick={analyze}
            disabled={analyzing || !urlInput.trim()}
            className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-stone-800 transition-colors"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analysing…
              </span>
            ) : 'Analyse This Product'}
          </button>
          {tabUrl && urlInput !== tabUrl && (
            <button onClick={() => setUrlInput(tabUrl)} className="text-[11px] text-stone-400 hover:text-stone-700 underline">
              Use current tab URL
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          <ResultView result={result} url={urlInput} />
          <div className="px-4 pb-4">
            <button
              onClick={() => { setResult(null); setError(null) }}
              className="w-full py-2 border border-stone-200 text-stone-600 text-xs font-semibold rounded-xl hover:bg-stone-50 transition-colors"
            >
              ← Analyse another product
            </button>
          </div>
        </>
      )}
    </div>
  )
}
