import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { SavedAnalysis, Product, WishList } from '../types'

const VERDICT = {
  perfect: { emoji: '✦', label: 'Perfect',  pill: 'bg-emerald-600 text-white', bar: '#059669' },
  great:   { emoji: '✓', label: 'Great',    pill: 'bg-green-500 text-white',   bar: '#22C55E' },
  good:    { emoji: '~', label: 'Good',      pill: 'bg-amber-500 text-white',   bar: '#F59E0B' },
  fair:    { emoji: '!', label: 'Fair',      pill: 'bg-orange-500 text-white',  bar: '#F97316' },
  skip:    { emoji: '✕', label: 'Skip',      pill: 'bg-red-500 text-white',     bar: '#EF4444' },
} as Record<string, { emoji: string; label: string; pill: string; bar: string }>

function verdictData(v: string) {
  return VERDICT[v] ?? { emoji: '~', label: v, pill: 'bg-stone-200 text-stone-700', bar: '#A8A29E' }
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden flex-1">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function InCartBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="14" height="14" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 8l2.5 2.5 4-5" />
      </svg>
      In cart
    </span>
  )
}

// ─── Wish List Picker ─────────────────────────────────────────────────────────

function WishListPicker({ analysis, onClose }: { analysis: SavedAnalysis; onClose: () => void }) {
  const { wishLists, createWishList, addToWishList } = useApp()
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedColor, setSelectedColor] = useState<SavedAnalysis['topColorPicks'][number] | null>(
    analysis.topColorPicks[0] ?? null
  )
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set(analysis.wishListIds ?? []))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function handleAdd(list: WishList) {
    const chosenColor = selectedColor
      ? { name: selectedColor.name, hex: selectedColor.hex, url: selectedColor.url, imageUrl: selectedColor.imageUrl, matchScore: selectedColor.matchScore, verdict: selectedColor.verdict }
      : null
    addToWishList(list.id, analysis, chosenColor)
    setAddedTo((prev) => new Set([...prev, list.id]))
  }

  function handleCreateAndAdd() {
    if (!newListName.trim()) return
    const list = createWishList(newListName.trim())
    const chosenColor = selectedColor
      ? { name: selectedColor.name, hex: selectedColor.hex, url: selectedColor.url, imageUrl: selectedColor.imageUrl, matchScore: selectedColor.matchScore, verdict: selectedColor.verdict }
      : null
    addToWishList(list.id, analysis, chosenColor)
    setAddedTo((prev) => new Set([...prev, list.id]))
    setNewListName('')
    setCreating(false)
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 right-0 z-50 w-72 bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden"
    >
      <div className="px-4 pt-4 pb-3 border-b border-stone-100">
        <p className="text-xs font-semibold text-stone-900">Save to Wish List</p>
        {analysis.topColorPicks.length > 1 && (
          <div className="mt-2">
            <p className="text-[10px] text-stone-400 mb-1.5">Choose a colorway:</p>
            <div className="flex gap-1.5 flex-wrap">
              {analysis.topColorPicks.map((pick) => (
                <button
                  key={pick.name}
                  onClick={() => setSelectedColor(pick)}
                  title={pick.name}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedColor?.name === pick.name ? 'border-stone-900 scale-110' : 'border-white shadow ring-1 ring-stone-100'
                  }`}
                  style={{ backgroundColor: pick.hex }}
                />
              ))}
              <button
                onClick={() => setSelectedColor(null)}
                title="No specific color"
                className={`w-6 h-6 rounded-full border-2 bg-stone-100 text-[9px] text-stone-500 flex items-center justify-center transition-all ${
                  selectedColor === null ? 'border-stone-900 scale-110' : 'border-white shadow ring-1 ring-stone-100'
                }`}
              >
                —
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-h-48 overflow-y-auto">
        {wishLists.length === 0 && !creating && (
          <p className="text-xs text-stone-400 text-center py-4">No lists yet</p>
        )}
        {wishLists.map((list) => {
          const saved = addedTo.has(list.id)
          return (
            <button
              key={list.id}
              onClick={() => !saved && handleAdd(list)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                saved ? 'bg-stone-50 text-stone-400' : 'hover:bg-stone-50 text-stone-800'
              }`}
            >
              <span className="text-sm font-medium truncate">{list.name}</span>
              {saved ? (
                <span className="text-[10px] text-emerald-600 font-semibold flex-shrink-0">Saved ✓</span>
              ) : (
                <span className="text-[10px] text-stone-400 flex-shrink-0">{list.items.length} items</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="border-t border-stone-100 p-3">
        {creating ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(); if (e.key === 'Escape') setCreating(false) }}
              placeholder="List name…"
              className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
            />
            <button onClick={handleCreateAndAdd} className="px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg">
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full text-xs font-semibold text-stone-600 hover:text-stone-900 text-left transition-colors"
          >
            + New list
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Full Analysis View ───────────────────────────────────────────────────────

function FullAnalysisView({ analysis, onAddToCart, isCarted }: {
  analysis: SavedAnalysis
  onAddToCart: (pick: SavedAnalysis['topColorPicks'][number]) => void
  isCarted: (name: string) => boolean
}) {
  const fa = analysis.fullAnalysis
  const cv = verdictData(analysis.colorVerdict)

  if (!fa) {
    return (
      <div className="pt-4">
        <p className="text-xs text-stone-400 text-center py-6">Full analysis data not available for this entry.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Score breakdown */}
      <div className="bg-stone-50 rounded-xl p-4 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Score Breakdown</p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-stone-700">Color Match</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cv.pill}`}>
                {cv.emoji} {cv.label}
              </span>
              <span className="text-xs font-bold text-stone-700 w-7 text-right">{analysis.colorScore}</span>
            </div>
          </div>
          <ScoreBar score={analysis.colorScore} color={cv.bar} />
          {fa.colorReasoning && <p className="text-xs text-stone-500 leading-relaxed">{fa.colorReasoning}</p>}
        </div>

        {fa.bodyTypeScore !== null && fa.bodyTypeVerdict && (
          <div className="space-y-1.5 pt-3 border-t border-stone-200">
            {(() => {
              const bv = verdictData(fa.bodyTypeVerdict)
              return (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">Body Type Fit</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bv.pill}`}>
                        {bv.emoji} {bv.label}
                      </span>
                      <span className="text-xs font-bold text-stone-700 w-7 text-right">{fa.bodyTypeScore}</span>
                    </div>
                  </div>
                  <ScoreBar score={fa.bodyTypeScore} color={bv.bar} />
                  {fa.fitReasoning && <p className="text-xs text-stone-500 leading-relaxed">{fa.fitReasoning}</p>}
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* Stylist suggestions */}
      {(analysis.topColorPicks[0] || fa.suggestedStyling) && (
        <div className="bg-stone-50 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Stylist Suggestions</p>

          {analysis.topColorPicks[0] && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: analysis.topColorPicks[0].hex }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Best available color</p>
                <p className="text-sm font-semibold text-stone-900 mt-0.5">{analysis.topColorPicks[0].name}</p>
                {analysis.topColorPicks[0].reasoning && (
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">{analysis.topColorPicks[0].reasoning}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {analysis.topColorPicks[0].url && (
                    <a href={analysis.topColorPicks[0].url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-700 text-white text-[11px] font-semibold rounded-lg transition-colors">
                      Shop
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  )}
                  {isCarted(analysis.topColorPicks[0].name) ? (
                    <InCartBadge />
                  ) : (
                    <button onClick={() => onAddToCart(analysis.topColorPicks[0])}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-stone-200 hover:bg-stone-100 text-stone-700 text-[11px] font-semibold rounded-lg transition-colors">
                      Add to Cart{analysis.productPrice ? ` · $${analysis.productPrice.toFixed(2)}` : ''}
                    </button>
                  )}
                </div>
              </div>
              <span className="text-base font-bold text-emerald-500 flex-shrink-0">{analysis.topColorPicks[0].matchScore}</span>
            </div>
          )}

          {fa.suggestedStyling && (
            <div className={analysis.topColorPicks[0] ? 'pt-3 border-t border-stone-200' : ''}>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">How to wear it</p>
              <p className="text-xs text-stone-600 leading-relaxed">{fa.suggestedStyling}</p>
            </div>
          )}
        </div>
      )}

      {/* Top color picks */}
      {analysis.topColorPicks.length > 0 && (
        <div className="bg-stone-50 rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-4">Top Color Picks</p>
          <div className="grid grid-cols-3 gap-2">
            {analysis.topColorPicks.map((pick, i) => (
              <div key={pick.name} className="relative flex flex-col gap-1.5">
                {i === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                    <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Best</span>
                  </div>
                )}
                {pick.url ? (
                  <a href={pick.url} target="_blank" rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 p-2.5 rounded-xl border border-stone-200 hover:border-stone-300 transition-all">
                    <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-stone-100">
                      {pick.imageUrl
                        ? <img src={pick.imageUrl} alt={pick.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-white shadow-md" style={{ backgroundColor: pick.hex }} /></div>
                      }
                    </div>
                    <p className="text-xs font-semibold text-stone-900 text-center truncate w-full">{pick.name}</p>
                    <p className="text-[10px] text-stone-400">{pick.matchScore}% match</p>
                    <div className="w-full py-1.5 rounded-lg bg-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-colors text-center">
                      <p className="text-[10px] font-semibold">Shop →</p>
                    </div>
                  </a>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-2.5 rounded-xl border border-stone-200">
                    <div className="w-full aspect-[3/4] rounded-lg bg-stone-100 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-4 border-white shadow-md" style={{ backgroundColor: pick.hex }} />
                    </div>
                    <p className="text-xs font-semibold text-stone-900 text-center truncate w-full">{pick.name}</p>
                    <p className="text-[10px] text-stone-400">{pick.matchScore}% match</p>
                    <p className="text-[9px] text-stone-300">No link</p>
                  </div>
                )}
                {isCarted(pick.name) ? (
                  <div className="flex justify-center"><InCartBadge /></div>
                ) : (
                  <button onClick={() => onAddToCart(pick)}
                    className="w-full py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 text-[10px] font-semibold transition-colors">
                    Add to Cart
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All ranked options */}
      {fa.allOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 px-1">All Color Options Ranked</p>
          {fa.allOptions.map((opt) => {
            const v = verdictData(opt.verdict)
            return (
              <div key={opt.name} className="bg-stone-50 rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    {opt.imageUrl && (
                      <img src={opt.imageUrl} alt={opt.name} className="w-9 h-11 object-cover rounded-md border border-stone-200 bg-stone-100" />
                    )}
                    <div
                      className={`rounded-full border shadow-sm ${opt.imageUrl ? 'w-3.5 h-3.5 absolute -bottom-1 -right-1 border-white border-2' : 'w-8 h-8 border-stone-100'}`}
                      style={{ backgroundColor: opt.hex }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold text-stone-900 truncate">
                        {opt.url
                          ? <a href={opt.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{opt.name}</a>
                          : opt.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.pill}`}>{v.emoji} {v.label}</span>
                        <span className="text-xs font-bold text-stone-600 w-7 text-right">{opt.matchScore}</span>
                      </div>
                    </div>
                    <ScoreBar score={opt.matchScore} color={v.bar} />
                  </div>
                </div>
                <div className="mt-2 pl-11 space-y-1">
                  <p className="text-xs text-stone-500 leading-relaxed">{opt.colorReasoning}</p>
                  {opt.fitReasoning && <p className="text-xs text-stone-400 italic leading-relaxed">{opt.fitReasoning}</p>}
                  {opt.url && (
                    <a href={opt.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold rounded-lg transition-colors">
                      Shop {opt.name}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Analysis Card ────────────────────────────────────────────────────────────

function AnalysisCard({ analysis, onDelete, onToggleFavorite }: {
  analysis: SavedAnalysis
  onDelete: () => void
  onToggleFavorite: () => void
}) {
  const { cart, addToCart, wishLists } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [localCartedNames, setLocalCartedNames] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false) }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [modalOpen])

  const cv = verdictData(analysis.colorVerdict)
  const savedListCount = (analysis.wishListIds ?? []).filter((id) => wishLists.some((l) => l.id === id)).length

  function isInGlobalCart(pickName: string): boolean {
    const targetName = `${analysis.productName} — ${pickName}`
    return cart.some(item => item.product.name === targetName)
  }

  function isCarted(pickName: string): boolean {
    return localCartedNames.has(pickName) || isInGlobalCart(pickName)
  }

  function handleAddToCart(pick: SavedAnalysis['topColorPicks'][number]) {
    const product: Product = {
      id: `saved-${analysis.id}-${pick.name.replace(/\s+/g, '-')}`,
      name: `${analysis.productName} — ${pick.name}`,
      brand: analysis.productBrand || 'Unknown',
      retailer: analysis.storeName,
      price: analysis.productPrice ?? 0,
      category: analysis.productCategory as Product['category'],
      imageUrl: pick.imageUrl || analysis.productImageUrl || '',
      hexColors: [pick.hex],
      rating: 5,
      reviewCount: 0,
      affiliateUrl: pick.url || analysis.productUrl || '#',
      tags: [pick.verdict, analysis.productCategory, 'analyzed'],
    }
    addToCart(product)
    setLocalCartedNames((prev) => new Set([...prev, pick.name]))
  }

  const topPick = analysis.topColorPicks[0]

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      {/* Card summary */}
      <div className="flex items-start gap-4 p-5">
        {analysis.productImageUrl && (
          <img src={analysis.productImageUrl} alt={analysis.productName}
            className="w-16 h-20 object-cover rounded-xl bg-stone-100 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {analysis.productBrand && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{analysis.productBrand}</p>
              )}
              <p className="font-serif text-base text-stone-900 mt-0.5 leading-tight">{analysis.productName}</p>
              <p className="text-[11px] text-stone-400 mt-1 capitalize">
                {analysis.productCategory}{analysis.productPrice ? ` · $${analysis.productPrice.toFixed(2)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Favorite heart */}
              <button
                onClick={onToggleFavorite}
                title={analysis.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg className={`w-5 h-5 transition-colors ${analysis.isFavorited ? 'fill-rose-500 text-rose-500' : 'fill-none text-stone-300 hover:text-rose-400'}`} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cv.pill}`}>
                {cv.emoji} {cv.label}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-2.5 flex items-center gap-2">
            <ScoreBar score={analysis.colorScore} color={cv.bar} />
            <span className="text-[10px] font-bold text-stone-500 w-6 text-right">{analysis.colorScore}</span>
          </div>

          {analysis.overallRecommendation && (
            <p className="text-xs text-stone-500 mt-2 leading-relaxed line-clamp-2">{analysis.overallRecommendation}</p>
          )}

          {/* Top color swatches + recommended size */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {analysis.topColorPicks.length > 0 && analysis.topColorPicks.map((pick) => (
              <div key={pick.name} className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-stone-100"
                style={{ backgroundColor: pick.hex }} title={pick.name} />
            ))}
            {analysis.recommendedSize && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900 text-white tracking-wide ml-1">
                {analysis.recommendedSize}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
        {topPick && (
          isCarted(topPick.name) ? (
            <InCartBadge />
          ) : (
            <button onClick={() => handleAddToCart(topPick)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors">
              Add to Cart{analysis.productPrice ? ` · $${analysis.productPrice.toFixed(2)}` : ''}
            </button>
          )
        )}

        {/* Save to Wish List */}
        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-xs font-semibold rounded-xl transition-colors ${
              savedListCount > 0
                ? 'border-stone-900 bg-stone-900 text-white hover:bg-stone-800'
                : 'border-stone-200 hover:bg-stone-50 text-stone-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {savedListCount > 0 ? `Saved (${savedListCount})` : 'Save'}
          </button>
          {pickerOpen && (
            <WishListPicker analysis={analysis} onClose={() => setPickerOpen(false)} />
          )}
        </div>

        <button onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors">
          Full Analysis
        </button>
      </div>

      {/* Full-analysis modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 bg-[#FAFAF7] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
            style={{ maxHeight: 'min(88vh, 900px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-stone-100 bg-white rounded-t-2xl flex-shrink-0">
              <div className="min-w-0">
                {analysis.productBrand && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{analysis.productBrand}</p>
                )}
                <p className="font-serif text-xl text-stone-900 mt-0.5 leading-tight">{analysis.productName}</p>
                <p className="text-xs text-stone-400 mt-1 capitalize">
                  {analysis.productCategory}{analysis.productPrice ? ` · $${analysis.productPrice.toFixed(2)}` : ''}
                  {analysis.storeName !== 'Atelier Analysis' ? ` · ${analysis.storeName}` : ''}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 pb-6">
              <FullAnalysisView analysis={analysis} onAddToCart={handleAddToCart} isCarted={isCarted} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-stone-50 px-5 py-3 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-stone-400">{formatDate(analysis.savedAt)}</span>
          {analysis.storeName !== 'Atelier Analysis' && (
            <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {analysis.storeName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {analysis.productUrl && (
            <a href={analysis.productUrl} target="_blank" rel="noopener noreferrer"
              className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline underline-offset-2 transition-colors">
              View product
            </a>
          )}
          <button onClick={onDelete} className="text-[11px] text-stone-300 hover:text-rose-500 transition-colors">
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalysesPage() {
  const { analyses, deleteAnalysis, setCurrentPage, toggleFavoriteAnalysis } = useApp()
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history')

  const favorites = analyses.filter((a) => a.isFavorited)
  const listed = activeTab === 'history' ? analyses : favorites

  const tabBtn = (tab: 'history' | 'favorites', label: string, count: number) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
        activeTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
      }`}
    >
      {label} <span className="ml-1 opacity-60">({count})</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-stone-900">Analyses</h1>
          <button onClick={() => setCurrentPage('check')}
            className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors">
            + New Analysis
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
          {tabBtn('history', 'History', analyses.length)}
          {tabBtn('favorites', 'Favorites', favorites.length)}
        </div>

        {/* Empty states */}
        {listed.length === 0 && activeTab === 'history' && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-serif text-xl text-stone-900 mb-1">No analyses yet</p>
            <p className="text-sm text-stone-400 mb-6 max-w-xs mx-auto">Every item you check is automatically saved here.</p>
            <button onClick={() => setCurrentPage('check')}
              className="px-6 py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">
              Check an Item
            </button>
          </div>
        )}

        {listed.length === 0 && activeTab === 'favorites' && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🤍</p>
            <p className="font-serif text-xl text-stone-900 mb-1">No favorites yet</p>
            <p className="text-sm text-stone-400 max-w-xs mx-auto">
              Tap the heart on any analysis to save it here.
            </p>
          </div>
        )}

        {/* Cards */}
        {listed.length > 0 && (
          <div className="space-y-3">
            {listed.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                analysis={analysis}
                onDelete={() => deleteAnalysis(analysis.id)}
                onToggleFavorite={() => toggleFavoriteAnalysis(analysis.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
