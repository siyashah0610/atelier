import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { formatPrice } from '../utils/priceUtils'
import { useAuth } from '../context/AuthContext'
import PaletteDisplay from '../components/PaletteDisplay'
import BodyStyleDisplay from '../components/BodyStyleDisplay'
import MakeupDisplay from '../components/MakeupDisplay'
import ProductModal from '../components/ProductModal'
import { FaceAnalysis } from '../types'
import { resizeImageToBase64 } from '../utils/colorUtils'

const ALL_RETAILERS = [
  'Aritzia', 'Princess Polly', 'Reformation', 'Edikted', 'Brandy Melville', 'UNIQLO', 'Jaded London',
  'Abercrombie & Fitch', 'Free People', 'Mango', 'ASOS', 'Zara', 'H&M', '& Other Stories', 'Everlane',
  'J.Crew', 'Madewell', 'Steve Madden', 'Mejuri', 'Sephora',
]

const FACE_SHAPE_TIPS: Record<string, string> = {
  oval:     'The most versatile face shape — almost any frame, earring style, and hat works beautifully on you.',
  round:    'Angular frames, long pendants, and structured hats add definition and elongate your features.',
  square:   'Soft curves, round frames, and oval or hoop earrings balance your strong jaw.',
  heart:    'Bottom-heavy earrings, wider frames at the bottom, and off-the-face styles balance your forehead.',
  diamond:  'Oval or cat-eye frames, teardrop earrings, and brimmed hats flatter your unique proportions.',
  oblong:   'Wide frames, statement studs, and wide-brimmed hats add width and break up length.',
  triangle: 'Bold frames on top, statement earrings, and wide-brimmed hats balance a strong jawline.',
}

// ─── Face Analysis Section ────────────────────────────────────────────────────

function FaceAnalysisSection() {
  const { userProfile, saveFaceAnalysis } = useApp()
  const fa = userProfile?.faceAnalysis
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function analyze(file: File) {
    setLoading(true)
    setError(null)
    try {
      const { data, mediaType } = await resizeImageToBase64(file, 1200)
      const res = await fetch('/api/face-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, mediaType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Analysis failed')
      saveFaceAnalysis(json as FaceAnalysis)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please upload an image.'); return }
    analyze(file)
  }

  if (fa) {
    return (
      <div className="space-y-5 animate-fade-in">
        {/* Face shape hero */}
        <div className="bg-white rounded-2xl p-5 border border-stone-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Your Face Shape</p>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-[11px] text-stone-400 hover:text-stone-700 underline"
            >
              Re-analyse
            </button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <h2 className="font-serif text-3xl text-stone-900 capitalize mt-1">{fa.faceShape}</h2>
          <p className="text-sm text-stone-500 mt-2 leading-relaxed">{FACE_SHAPE_TIPS[fa.faceShape]}</p>
          <p className="text-xs text-stone-400 mt-3">{fa.overallAdvice}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-stone-900 rounded-full" style={{ width: `${fa.confidence}%` }} />
            </div>
            <span className="text-[10px] text-stone-400 font-medium">{fa.confidence}% confident</span>
          </div>
        </div>

        {/* Makeup tips */}
        <div className="bg-white rounded-2xl p-5 border border-stone-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-4">Makeup for Your Face Shape</p>
          <div className="space-y-3">
            {[
              { label: 'Contouring', value: fa.makeupTips.contouring },
              { label: 'Blush', value: fa.makeupTips.blush },
              { label: 'Highlight', value: fa.makeupTips.highlight },
              { label: 'Eye Makeup', value: fa.makeupTips.eyeMakeup },
              { label: 'Brow Shape', value: fa.makeupTips.browShape },
              { label: 'Lip Shape', value: fa.makeupTips.lips },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <span className="text-xs font-semibold text-stone-400 w-20 flex-shrink-0 pt-0.5">{label}</span>
                <p className="text-sm text-stone-700 leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Accessories */}
        <div className="bg-white rounded-2xl p-5 border border-stone-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-4">Accessories That Flatter You</p>
          <div className="space-y-3">
            {[
              { label: 'Earrings', value: fa.accessories.earrings },
              { label: 'Necklaces', value: fa.accessories.necklaces },
              { label: 'Sunglasses', value: fa.accessories.sunglasses },
              { label: 'Hats', value: fa.accessories.hats },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <span className="text-xs font-semibold text-stone-400 w-20 flex-shrink-0 pt-0.5">{label}</span>
                <p className="text-sm text-stone-700 leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-white rounded-2xl p-5 border border-stone-100">
        <h3 className="font-serif text-lg text-stone-900 mb-1">Face Shape Analysis</h3>
        <p className="text-sm text-stone-400 mb-5 leading-relaxed">
          Upload a clear, front-facing selfie. We'll identify your face shape and give you personalised makeup techniques and accessory guidance.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
            <p className="text-sm text-stone-400">Analysing your face shape…</p>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              dragging ? 'border-stone-400 bg-stone-50' : 'border-stone-200 hover:border-stone-400'
            }`}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            <div className="text-3xl mb-3">📸</div>
            <p className="text-sm font-semibold text-stone-700">Drop a selfie or tap to upload</p>
            <p className="text-xs text-stone-400 mt-1.5">Front-facing, good lighting — JPG, PNG or WEBP</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Export for Extension ─────────────────────────────────────────────────────

function ExportForExtension() {
  const { userProfile } = useApp()
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const payload = JSON.stringify({
      palette: userProfile?.palette ?? null,
      bodyProfile: userProfile?.bodyProfile ?? null,
      faceAnalysis: userProfile?.faceAnalysis ?? null,
      name: userProfile?.name ?? '',
    })
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-stone-700">Atelier Browser Extension</p>
        <p className="text-[11px] text-stone-400 mt-0.5">Copy your profile to paste into the extension on first setup.</p>
      </div>
      <button
        onClick={handleCopy}
        className={`flex-shrink-0 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
          copied ? 'bg-emerald-600 text-white' : 'bg-stone-900 text-white hover:bg-stone-700'
        }`}
      >
        {copied ? 'Copied ✓' : 'Copy Profile'}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { userProfile, savedProducts, setCurrentPage, selectedProduct, setSelectedProduct, updateRetailers } =
    useApp()
  const { signOut } = useAuth()
  const [tab, setTab] = useState<'palette' | 'style' | 'face' | 'saved' | 'stores' | 'settings'>('palette')
  const [showAddStores, setShowAddStores] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      setCurrentPage('landing')
    } catch (err) {
      console.error('Sign out failed:', err)
      setIsSigningOut(false)
    }
  }

  if (!userProfile) return null

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Profile header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center text-white text-2xl font-serif flex-shrink-0">
              {(userProfile.name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-2xl text-stone-900">{userProfile.name || 'Atelier User'}</h1>
              <p className="text-sm text-stone-400">@{userProfile.username || 'my_atelier'}</p>
              {userProfile.palette && (
                <p className="text-xs text-stone-500 mt-1">
                  ✦ {userProfile.palette.seasonalType} ·{' '}
                  <span className="capitalize">{userProfile.palette.undertone} undertone</span>
                  {userProfile.faceAnalysis && (
                    <span> · <span className="capitalize">{userProfile.faceAnalysis.faceShape}</span> face</span>
                  )}
                </p>
              )}
            </div>
            <div className="text-right hidden sm:flex flex-col gap-2">
              <div>
                <div className="text-2xl font-serif text-stone-900">{savedProducts.length}</div>
                <div className="text-xs text-stone-400">saved</div>
              </div>
            </div>
          </div>

          {/* Color strip */}
          {userProfile.palette && (
            <div className="mt-5 flex h-6 rounded-lg overflow-hidden">
              {userProfile.palette.allHexCodes.slice(0, 20).map((hex, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
              ))}
            </div>
          )}

          {/* { id: 'settings', label: 'Settings' },
              Export for extension */}
          <div className="mt-4">
            <ExportForExtension />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border border-stone-100 rounded-xl p-1 bg-stone-50 overflow-x-auto">
            {([
              { id: 'palette', label: 'My Palette' },
              { id: 'style',   label: 'My Style' },
              { id: 'face',    label: 'Face & Makeup' },
              { id: 'saved',   label: `Saved (${savedProducts.length})` },
              { id: 'stores',  label: 'Stores' },
            ] as { id: typeof tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  tab === t.id ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Palette tab */}
        {tab === 'palette' && userProfile.palette && (
          <div className="space-y-8 animate-fade-in">
            <PaletteDisplay palette={userProfile.palette} />
            <button
              onClick={() => {
                if (confirm('Reset your analysis? This will clear your palette and take you back to onboarding.')) {
                  localStorage.clear()
                  window.location.reload()
                }
              }}
              className="text-xs text-stone-400 hover:text-rose-500 transition-colors"
            >
              Redo color analysis
            </button>
          </div>
        )}

        {/* Style tab */}
        {tab === 'style' && (
          <div className="space-y-8 animate-fade-in">
            {userProfile.bodyProfile?.bodyType && (
              <div className="bg-white rounded-2xl p-5 border border-stone-100 space-y-5">
                <h3 className="font-serif text-lg text-stone-900">Body Type & Style Profile</h3>
                <BodyStyleDisplay bodyType={userProfile.bodyProfile.bodyType} />
                {(userProfile.bodyProfile.height || userProfile.bodyProfile.bust ||
                  userProfile.bodyProfile.waist || userProfile.bodyProfile.hips) && (
                  <div className="pt-4 border-t border-stone-100">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Measurements</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {userProfile.bodyProfile.height && (
                        <div className="bg-stone-50 rounded-xl p-3">
                          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Height</p>
                          <p className="font-semibold text-stone-800 mt-1">{userProfile.bodyProfile.height}</p>
                        </div>
                      )}
                      {userProfile.bodyProfile.bust && (
                        <div className="bg-stone-50 rounded-xl p-3">
                          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Bust</p>
                          <p className="font-semibold text-stone-800 mt-1">{userProfile.bodyProfile.bust}"</p>
                        </div>
                      )}
                      {userProfile.bodyProfile.waist && (
                        <div className="bg-stone-50 rounded-xl p-3">
                          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Waist</p>
                          <p className="font-semibold text-stone-800 mt-1">{userProfile.bodyProfile.waist}"</p>
                        </div>
                      )}
                      {userProfile.bodyProfile.hips && (
                        <div className="bg-stone-50 rounded-xl p-3">
                          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Hips</p>
                          <p className="font-semibold text-stone-800 mt-1">{userProfile.bodyProfile.hips}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(userProfile.bodyProfile.shirtSize || userProfile.bodyProfile.braSize ||
                  userProfile.bodyProfile.pantsSize || userProfile.bodyProfile.waistRise ||
                  userProfile.bodyProfile.shoeSize) && (
                  <div className="pt-4 border-t border-stone-100">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Sizing</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {userProfile.bodyProfile.shirtSize && (
                        <div className="bg-stone-50 rounded-xl p-3">
                          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Shirts / Tops</p>
                          <p className="font-semibold text-stone-800 mt-1">{userProfile.bodyProfile.shirtSize}</p>
                        </div>
                      )}
                      {userProfile.bodyProfile.braSize && (
                        <div className="bg-stone-50 rounded-xl p-3">
                          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Bra Size</p>
                          <p className="font-semibold text-stone-800 mt-1">{userProfile.bodyProfile.braSize}</p>
                        </div>
                      )}
                      {userProfile.bodyProfile.pantsSize && (
                        <div className="bg-stone-50 rounded-xl p-3">
                          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Pants / Jeans</p>
                          <p className="font-semibold text-stone-800 mt-1">{userProfile.bodyProfile.pantsSize}</p>
                        </div>
                      )}
                      {userProfile.bodyProfile.waistRise && (
                        <div className="bg-stone-50 rounded-xl p-3">
                          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Rise Preference</p>
                          <p className="font-semibold text-stone-800 mt-1">
                            {userProfile.bodyProfile.waistRise === 'high' ? 'High-waisted'
                              : userProfile.bodyProfile.waistRise === 'mid' ? 'Mid-rise' : 'Low-rise'}
                          </p>
                        </div>
                      )}
                      {userProfile.bodyProfile.shoeSize && (
                        <div className="bg-stone-50 rounded-xl p-3">
                          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium">Shoes (US)</p>
                          <p className="font-semibold text-stone-800 mt-1">{userProfile.bodyProfile.shoeSize}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!userProfile.bodyProfile?.bodyType && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">👗</p>
                <h2 className="font-serif text-xl text-stone-700 mb-2">No style profile yet</h2>
                <p className="text-sm text-stone-400 mb-6">
                  Complete your body type analysis during onboarding to see personalised style recommendations.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Face & Makeup tab */}
        {tab === 'face' && (
          <div className="space-y-8 animate-fade-in">
            <FaceAnalysisSection />
            {userProfile.palette && (
              <div className="bg-white rounded-2xl p-5 border border-stone-100 space-y-5">
                <h3 className="font-serif text-lg text-stone-900">Makeup Shades</h3>
                <MakeupDisplay seasonalType={userProfile.palette.seasonalType} />
              </div>
            )}
          </div>
        )}

        {/* Saved tab */}
        {tab === 'saved' && (
          <div className="animate-fade-in">
            {savedProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">♡</p>
                <h2 className="font-serif text-xl text-stone-700 mb-2">Nothing saved yet</h2>
                <p className="text-sm text-stone-400 mb-6">Heart products in your feed to save them here.</p>
                <button onClick={() => setCurrentPage('feed')} className="px-5 py-2.5 bg-stone-900 text-white text-sm rounded-xl">
                  Browse Your Feed
                </button>
              </div>
            ) : (
              <div className="masonry">
                {savedProducts.map((product) => (
                  <div key={product.id} className="masonry-item">
                    <button onClick={() => setSelectedProduct(product)} className="w-full group">
                      <div className={`rounded-xl overflow-hidden bg-stone-100 ${product.aspectRatio === 'tall' ? 'aspect-[3/4]' : 'aspect-square'}`}>
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="p-2 text-left">
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest">{product.brand}</p>
                        <p className="text-xs text-stone-800 font-medium mt-0.5 line-clamp-1">{product.name}</p>
                        <p className="text-sm font-semibold text-stone-900 mt-0.5">${formatPrice(product.price)}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stores tab */}
        {tab === 'stores' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg text-stone-900">Your Stores</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Your feed only shows products from these retailers.</p>
                </div>
                <button
                  onClick={() => setShowAddStores((v) => !v)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
                >
                  {showAddStores ? 'Done' : '+ Add'}
                </button>
              </div>

              {(userProfile.favoriteRetailers ?? []).length === 0 ? (
                <p className="text-sm text-stone-400 py-2">No stores selected yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(userProfile.favoriteRetailers ?? []).map((r) => (
                    <span key={r} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-full">
                      {r}
                      <button
                        onClick={() => updateRetailers((userProfile.favoriteRetailers ?? []).filter((x) => x !== r))}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {showAddStores && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Add a store</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_RETAILERS.filter((r) => !(userProfile.favoriteRetailers ?? []).includes(r)).map((r) => (
                      <button
                        key={r}
                        onClick={() => updateRetailers([...(userProfile.favoriteRetailers ?? []), r])}
                        className="px-3.5 py-1.5 text-xs font-medium bg-white border border-stone-200 text-stone-600 rounded-full hover:border-stone-900 hover:text-stone-900 transition-colors"
                      >
                        + {r}
                      </button>
                    ))}
                    {ALL_RETAILERS.every((r) => (userProfile.favoriteRetailers ?? []).includes(r)) && (
                      <p className="text-xs text-stone-400">All stores already added.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(userProfile.favoriteRetailers ?? []).length > 0 && (
              <button onClick={() => setCurrentPage('feed')} className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">
                Browse Your Feed →
              </button>
            )}
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-stone-100 space-y-6">
              <div>
                <h3 className="font-serif text-lg text-stone-900 mb-1">Account</h3>
                <p className="text-sm text-stone-400">Manage your Atelier account</p>
              </div>

              <div className="pt-4 border-t border-stone-100 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Name</p>
                  <p className="text-sm text-stone-700">{userProfile.name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Username</p>
                  <p className="text-sm text-stone-700">@{userProfile.username || 'not_set'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSigningOut ? 'Signing out…' : 'Sign Out'}
                </button>
                <p className="text-xs text-stone-400 text-center mt-2">You'll be logged out of all sessions</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  )
}
