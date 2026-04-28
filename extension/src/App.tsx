import { useState, useEffect } from 'react'
import { supabase, fetchWishLists, createWishList, saveItemToWishList, WishListRow, WishListItemData } from './supabase'
import type { User } from '@supabase/supabase-js'

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

// ─── Sign In ──────────────────────────────────────────────────────────────────

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [usePassword, setUsePassword] = useState(true)

  async function handleSignIn() {
    if (!email.trim()) { setError('Enter your email.'); return }
    if (!password.trim()) { setError('Enter your password.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError(error.message); setLoading(false) }
    else onSignedIn()
  }

  async function handleSendOtp() {
    if (!email.trim()) { setError('Enter your email.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
    if (error) { setError(error.message); setLoading(false) }
    else { setOtpSent(true); setLoading(false) }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) { setError('Enter the 6-digit code.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: 'email' })
    if (error) { setError(error.message); setLoading(false) }
    else onSignedIn()
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="font-serif text-lg text-stone-900">Sign in to Atelier</p>
        <p className="text-xs text-stone-400 mt-1 leading-relaxed">
          Use the same account as the Atelier web app to sync your wish lists.
        </p>
      </div>

      {!otpSent ? (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400"
          />

          {usePassword ? (
            <>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                placeholder="Password"
                className="w-full px-3 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400"
              />
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button onClick={handleSignIn} disabled={loading}
                className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <button onClick={() => { setUsePassword(false); setError('') }}
                className="w-full text-center text-xs text-stone-400 hover:text-stone-700 underline">
                Sign in with a code instead
              </button>
            </>
          ) : (
            <>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button onClick={handleSendOtp} disabled={loading}
                className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
                {loading ? 'Sending…' : 'Email me a sign-in code'}
              </button>
              <button onClick={() => { setUsePassword(true); setError('') }}
                className="w-full text-center text-xs text-stone-400 hover:text-stone-700 underline">
                Use password instead
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-stone-500">We sent a 6-digit code to <strong>{email}</strong>. Enter it below.</p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
            placeholder="123456"
            maxLength={6}
            className="w-full px-3 py-2.5 text-sm text-center tracking-widest border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400"
          />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button onClick={handleVerifyOtp} disabled={loading}
            className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
          <button onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
            className="w-full text-center text-xs text-stone-400 hover:text-stone-700 underline">
            ← Back
          </button>
        </>
      )}
    </div>
  )
}

// ─── Wish List Picker ─────────────────────────────────────────────────────────

function WishListPicker({ result, url, onClose }: { result: AnalysisResult; url: string; onClose: () => void }) {
  const [wishLists, setWishLists] = useState<WishListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchWishLists().then((lists) => {
      setWishLists(lists)
      if (lists.length > 0) setSelectedId(lists[0].id)
      else setCreating(true)
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    let targetId = selectedId

    if (creating && newName.trim()) {
      const created = await createWishList(newName.trim())
      if (!created) { setSaving(false); return }
      setWishLists((prev) => [created, ...prev])
      targetId = created.id
    }

    if (!targetId) { setSaving(false); return }

    const bestPick = result.topColorPicks[0] ?? null
    let storeName = 'Unknown'
    try { storeName = new URL(url).hostname.replace(/^www\./, '') } catch {}

    const item: WishListItemData = {
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
      analysisId: crypto.randomUUID(),
      productName: result.productName,
      productBrand: result.productBrand,
      productCategory: result.productCategory,
      productImageUrl: result.productImageUrl,
      productPrice: null,
      storeName,
      colorScore: result.colorScore,
      colorVerdict: result.colorVerdict,
      chosenColor: bestPick
        ? { name: bestPick.name, hex: bestPick.hex, url: bestPick.url, imageUrl: bestPick.imageUrl, matchScore: bestPick.matchScore, verdict: bestPick.verdict }
        : null,
    }

    const ok = await saveItemToWishList(targetId, item)
    if (ok) { setSaved(true); setTimeout(onClose, 1200) }
    else setSaving(false)
  }

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 text-center shadow-2xl mx-4">
          <p className="text-2xl mb-1">✓</p>
          <p className="font-serif text-stone-900">Saved to wish list</p>
          <p className="text-xs text-stone-400 mt-1">Synced with your Atelier account</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-2xl shadow-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-stone-900 text-sm">Save to Wish List</p>
          <button onClick={onClose} className="text-stone-400 text-lg leading-none">✕</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {!creating && wishLists.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {wishLists.map((list) => (
                  <button key={list.id} onClick={() => setSelectedId(list.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                      selectedId === list.id ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}>
                    <span className="font-medium">{list.name}</span>
                    <span className={`text-xs ml-2 ${selectedId === list.id ? 'text-stone-300' : 'text-stone-400'}`}>
                      {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {creating ? (
              <div className="space-y-2">
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="Name your wish list…"
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400" />
                {wishLists.length > 0 && (
                  <button onClick={() => setCreating(false)} className="text-xs text-stone-400 hover:text-stone-700 underline">
                    ← Back to existing lists
                  </button>
                )}
              </div>
            ) : (
              <button onClick={() => setCreating(true)}
                className="w-full py-2 border border-dashed border-stone-300 text-stone-500 text-sm rounded-xl hover:border-stone-500">
                + New list
              </button>
            )}

            <button onClick={handleSave}
              disabled={saving || (creating ? !newName.trim() : !selectedId)}
              className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40">
              {saving ? 'Saving…' : 'Save to Atelier'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Result View ──────────────────────────────────────────────────────────────

function ResultView({ result, url }: { result: AnalysisResult; url: string }) {
  const [showPicker, setShowPicker] = useState(false)
  const cv = VERDICT_STYLE[result.colorVerdict] ?? VERDICT_STYLE['good']
  const bv = result.bodyTypeVerdict ? VERDICT_STYLE[result.bodyTypeVerdict] : null

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        {result.productImageUrl && (
          <img src={result.productImageUrl} alt={result.productName}
            className="w-14 object-cover rounded-xl bg-stone-100 flex-shrink-0" style={{ height: '72px' }} />
        )}
        <div className="flex-1 min-w-0">
          {result.productBrand && <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{result.productBrand}</p>}
          <p className="font-serif text-base text-stone-900 leading-tight mt-0.5">{result.productName}</p>
          <p className="text-[11px] text-stone-400 mt-0.5 capitalize">{result.productCategory}</p>
        </div>
      </div>

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

      {result.recommendedSize && (
        <div className="flex items-center gap-2 bg-stone-900 text-white rounded-xl px-3 py-2">
          <span className="text-xs font-semibold">Recommended size</span>
          <span className="ml-auto text-sm font-bold">{result.recommendedSize}</span>
        </div>
      )}

      {result.topColorPicks.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">Top Color Picks</p>
          <div className="grid grid-cols-3 gap-2">
            {result.topColorPicks.map((pick, i) => (
              <a key={pick.name} href={pick.url ?? url} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-stone-100 hover:border-stone-300 bg-white">
                <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-stone-100">
                  {pick.imageUrl
                    ? <img src={pick.imageUrl} alt={pick.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: pick.hex }} />
                      </div>
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

      {result.overallRecommendation && (
        <p className="text-xs text-stone-500 leading-relaxed border-t border-stone-100 pt-3">{result.overallRecommendation}</p>
      )}

      <button onClick={() => setShowPicker(true)}
        className="w-full py-2.5 border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
        ♡ Save to Wish List
      </button>

      {showPicker && <WishListPicker result={result} url={url} onClose={() => setShowPicker(false)} />}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null | 'loading'>('loading')
  const [profile, setProfile] = useState<{ seasonalType?: string; dominantColors?: string[] } | null>(null)
  const [tabUrl, setTabUrl] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url ?? ''
      if (url.startsWith('http')) { setTabUrl(url); setUrlInput(url) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load palette from Supabase profile when user is known
  useEffect(() => {
    if (!user || user === 'loading') return
    supabase.from('profiles').select('palette').eq('id', user.id).single().then(({ data }) => {
      if (data?.palette) setProfile(data.palette)
    })
  }, [user])

  async function analyze() {
    if (!urlInput.trim() || !user || user === 'loading') return
    setAnalyzing(true); setResult(null); setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/product-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', data: urlInput.trim(), palette: profile }),
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

  if (user === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <SignIn onSignedIn={() => {}} />
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 bg-[#FAFAF7]/95 backdrop-blur-sm border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-serif text-base text-stone-900">atelier</p>
          {profile?.seasonalType && (
            <p className="text-[10px] text-stone-400">{profile.seasonalType}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {profile?.dominantColors && (
            <div className="flex gap-0.5">
              {profile.dominantColors.slice(0, 4).map((hex, i) => (
                <div key={i} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: hex }} />
              ))}
            </div>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-[10px] text-stone-300 hover:text-rose-400 transition-colors ml-1"
            title="Sign out"
          >
            ✕
          </button>
        </div>
      </div>

      {!result && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-stone-500">Analysing page:</p>
          <input
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setResult(null) }}
            placeholder="Product URL…"
            className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400"
          />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button onClick={analyze} disabled={analyzing || !urlInput.trim()}
            className="w-full py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-stone-800 transition-colors">
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

      {result && (
        <>
          <ResultView result={result} url={urlInput} />
          <div className="px-4 pb-4">
            <button onClick={() => { setResult(null); setError(null) }}
              className="w-full py-2 border border-stone-200 text-stone-600 text-xs font-semibold rounded-xl hover:bg-stone-50">
              ← Analyse another product
            </button>
          </div>
        </>
      )}
    </div>
  )
}
