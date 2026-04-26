import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SavedAnalysis, Product } from '../types'

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
      Already in cart
    </span>
  )
}

function FullAnalysisView({ analysis, onAddToCart, isCarted }: {
  analysis: SavedAnalysis
  onAddToCart: (pick: SavedAnalysis['topColorPicks'][number]) => void
  isCarted: (name: string) => boolean
}) {
  const fa = analysis.fullAnalysis
  const cv = verdictData(analysis.colorVerdict)

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

function AnalysisCard({ analysis, onDelete }: {
  analysis: SavedAnalysis
  onDelete: () => void
}) {
  const { cart, addToCart } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [localCartedNames, setLocalCartedNames] = useState<Set<string>>(new Set())

  const cv = verdictData(analysis.colorVerdict)

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
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cv.pill}`}>
              {cv.emoji} {cv.label}
            </span>
          </div>

          {/* Score bar */}
          <div className="mt-2.5 flex items-center gap-2">
            <ScoreBar score={analysis.colorScore} color={cv.bar} />
            <span className="text-[10px] font-bold text-stone-500 w-6 text-right">{analysis.colorScore}</span>
          </div>

          {analysis.overallRecommendation && (
            <p className="text-xs text-stone-500 mt-2 leading-relaxed line-clamp-2">{analysis.overallRecommendation}</p>
          )}

          {/* Top color swatches */}
          {analysis.topColorPicks.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3">
              {analysis.topColorPicks.map((pick) => (
                <div key={pick.name} className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-stone-100"
                  style={{ backgroundColor: pick.hex }} title={pick.name} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions row */}
      <div className="px-5 pb-4 flex items-center gap-3">
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
        <button onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors">
          {expanded ? 'Hide Analysis' : 'View Full Analysis'}
          <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded full analysis */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-stone-100 pt-4">
          <FullAnalysisView analysis={analysis} onAddToCart={handleAddToCart} isCarted={isCarted} />
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

export default function AnalysesPage() {
  const { analyses, deleteAnalysis, setCurrentPage } = useApp()

  if (analyses.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="font-serif text-2xl text-stone-900 mb-2">No saved analyses</h1>
          <p className="text-sm text-stone-400 mb-8 max-w-xs mx-auto">
            Check an item and click "Save Analysis to History" before leaving the page — results aren't stored automatically.
          </p>
          <button onClick={() => setCurrentPage('check')}
            className="px-7 py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors">
            Check an Item
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-stone-900">Analyses</h1>
            <p className="text-sm text-stone-400 mt-1">{analyses.length} saved item{analyses.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setCurrentPage('check')}
            className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors">
            + New Analysis
          </button>
        </div>

        <div className="space-y-3">
          {analyses.map((analysis) => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              onDelete={() => deleteAnalysis(analysis.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
