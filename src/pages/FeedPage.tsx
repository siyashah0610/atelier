import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Product, ProductCategory } from '../types'
import { computeMatchScore } from '../utils/colorUtils'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'

const CATEGORIES: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'clothing', label: 'Clothing' },
  { id: 'shoes',    label: 'Shoes'    },
  { id: 'jewelry',  label: 'Jewelry'  },
  { id: 'bags',     label: 'Bags'     },
  { id: 'makeup',   label: 'Beauty'   },
]

// Minimum color-match score to appear in feed (0–100)
const MIN_SCORE = 45

export default function FeedPage() {
  const { userProfile, selectedProduct, setSelectedProduct, setCurrentPage } = useApp()
  const [products, setProducts]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState<ProductCategory | 'all'>('all')
  const [sortBy, setSortBy]       = useState<'match' | 'price-asc' | 'price-desc' | 'rating'>('match')
  const [search, setSearch]       = useState('')

  const retailers = userProfile?.favoriteRetailers ?? []
  const palette   = userProfile?.palette
  const bodyType  = userProfile?.bodyProfile?.bodyType

  useEffect(() => {
    if (!retailers.length) {
      setProducts([])
      setLoading(false)
      return
    }

    const params = new URLSearchParams()
    params.set('retailers', retailers.join(','))
    if (category !== 'all') params.set('category', category)
    if (search) params.set('search', search)

    setLoading(true)
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data: Product[]) => {
        const scored = data.map((p) => ({
          ...p,
          matchScore: palette
            ? computeMatchScore(p.hexColors, palette.allHexCodes)
            : undefined,
        }))
        setProducts(scored)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [category, search, retailers.join(','), palette])

  const filtered = useMemo(() => {
    let arr = [...products]

    // Color-score gate (only when palette exists)
    if (palette) {
      arr = arr.filter((p) => (p.matchScore ?? 0) >= MIN_SCORE)
    }

    // Body-type soft filter — show matching items first but don't hide others
    if (bodyType) {
      const tag = `${bodyType}-friendly`
      arr.sort((a, b) => {
        const aMatch = a.bodyTypeTags?.includes(tag) || a.bodyTypeTags?.includes(bodyType) ? 1 : 0
        const bMatch = b.bodyTypeTags?.includes(tag) || b.bodyTypeTags?.includes(bodyType) ? 1 : 0
        return bMatch - aMatch
      })
    }

    return arr
  }, [products, palette, bodyType])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sortBy === 'match')      arr.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    if (sortBy === 'price-asc')  arr.sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc') arr.sort((a, b) => b.price - a.price)
    if (sortBy === 'rating')     arr.sort((a, b) => b.rating - a.rating)
    return arr
  }, [filtered, sortBy])

  // ── No stores selected ──────────────────────────────────────────────────────
  if (!retailers.length) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <p className="text-4xl mb-4">🛍️</p>
          <h2 className="font-serif text-2xl text-stone-900 mb-2">No stores selected</h2>
          <p className="text-sm text-stone-500 mb-6">
            Add your favourite retailers in your profile and we'll pull products that match your palette.
          </p>
          <button
            onClick={() => setCurrentPage('profile')}
            className="px-6 py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
          >
            Go to Profile → Add Stores
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Palette + retailer banner */}
      {palette && (
        <div className="bg-white border-b border-stone-100 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {palette.dominantColors.slice(0, 8).map((hex, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            <span className="text-xs text-stone-500">
              <span className="font-semibold text-stone-800">{palette.seasonalType}</span>
              {' '}palette · {retailers.length} store{retailers.length !== 1 ? 's' : ''}
              {bodyType && <span> · {bodyType} styling</span>}
            </span>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="sticky top-14 sm:top-[57px] z-30 bg-[#FAFAF7]/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Search */}
          <div className="relative flex-shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-full bg-white focus:outline-none focus:border-stone-400 w-32"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  category === c.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex-shrink-0 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 text-xs border border-stone-200 rounded-full bg-white text-stone-600 focus:outline-none cursor-pointer"
            >
              <option value="match">Best Match</option>
              <option value="price-asc">Price: Low–High</option>
              <option value="price-desc">Price: High–Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {loading ? (
          <div className="masonry">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="masonry-item">
                <div className={`bg-stone-100 rounded-xl animate-pulse ${i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`} />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-2 bg-stone-100 rounded w-1/2 animate-pulse" />
                  <div className="h-3 bg-stone-100 rounded animate-pulse" />
                  <div className="h-3 bg-stone-100 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-stone-700 mb-2">No matches found</p>
            <p className="text-sm text-stone-400">
              {palette
                ? 'Try adjusting your filters — we only show colors that suit your palette.'
                : 'Try adjusting your search or category.'}
            </p>
          </div>
        ) : (
          <div className="masonry">
            {sorted.map((product) => (
              <div key={product.id} className="masonry-item">
                <ProductCard product={product} onClick={() => setSelectedProduct(product)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  )
}
