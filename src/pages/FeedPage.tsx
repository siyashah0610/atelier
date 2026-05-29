import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { Product, ProductCategory } from '../types'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'

const BASIC_COLORS = [
  { name: 'Red', hex: '#DC2626' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Pink', hex: '#DB2777' },
  { name: 'Magenta', hex: '#C2185B' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Beige', hex: '#D2B48C' },
  { name: 'Navy', hex: '#001F3F' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Black', hex: '#1F2937' },
  { name: 'White', hex: '#F5F5F5' },
]

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 }
}

function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  const dr = rgb1.r - rgb2.r
  const dg = rgb1.g - rgb2.g
  const db = rgb1.b - rgb2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function getBasicColor(hex: string): string {
  let closest = BASIC_COLORS[0]
  let minDistance = Infinity
  for (const color of BASIC_COLORS) {
    const dist = colorDistance(hex, color.hex)
    if (dist < minDistance) {
      minDistance = dist
      closest = color
    }
  }
  return closest.name.toLowerCase()
}

const MAIN_CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'clothing', label: 'Clothing' },
  { id: 'shoes',    label: 'Shoes'    },
  { id: 'jewelry',  label: 'Jewelry'  },
  { id: 'bags',     label: 'Bags'     },
  { id: 'makeup',   label: 'Makeup'   },
]

const SUBCATEGORIES: Record<ProductCategory, { id: string; label: string }[]> = {
  clothing: [
    { id: 'tops', label: 'Tops' },
    { id: 'bottoms', label: 'Bottoms (Pants, Shorts, Leggings, Skirts, Jeans)' },
    { id: 'dresses', label: 'Dresses' },
    { id: 'outerwear', label: 'Outerwear' },
    { id: 'activewear', label: 'Activewear' },
  ],
  shoes: [
    { id: 'sneakers', label: 'Sneakers' },
    { id: 'heels', label: 'Heels' },
    { id: 'flats', label: 'Flats' },
    { id: 'boots', label: 'Boots' },
    { id: 'sandals', label: 'Sandals' },
  ],
  jewelry: [
    { id: 'necklaces', label: 'Necklaces' },
    { id: 'bracelets', label: 'Bracelets' },
    { id: 'earrings', label: 'Earrings' },
    { id: 'rings', label: 'Rings' },
    { id: 'anklets', label: 'Anklets' },
  ],
  bags: [
    { id: 'crossbody', label: 'Crossbody' },
    { id: 'tote', label: 'Tote' },
    { id: 'backpack', label: 'Backpack' },
    { id: 'clutch', label: 'Clutch' },
    { id: 'shoulder', label: 'Shoulder' },
  ],
  makeup: [],
  all: [],
}

const RETAILERS = ['All', 'Aritzia', 'Princess Polly', 'Reformation', 'Edikted', 'Brandy Melville', 'UNIQLO', 'Dairy Boy', 'Boys Lie', 'Alo', 'Oh Polly', 'Frankies Bikinis', 'Jaded London']
const FILTER_PILL_CLASS = 'px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300/70'
const DROPDOWN_PANEL_CLASS = 'rounded-2xl border border-stone-200 bg-white shadow-xl ring-1 ring-black/5 overflow-hidden'
const PAGE_SIZE = 50

export default function FeedPage() {
  const { userProfile, selectedProduct, setSelectedProduct } = useApp()

  const [products, setProducts]     = useState<Product[]>([])
  const [page, setPage]             = useState(0)
  const [total, setTotal]           = useState(0)
  const [loadingFirst, setLoadingFirst] = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [mainCategory, setMainCategory] = useState<ProductCategory>('all')
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [retailers, setRetailers]   = useState<string[]>(['All'])
  const [colors, setColors]         = useState<string[]>([])
  const [priceMin, setPriceMin]     = useState<number | null>(null)
  const [priceMax, setPriceMax]     = useState<number | null>(null)
  const [sortBy, setSortBy]         = useState<'match' | 'price-asc' | 'price-desc'>('match')
  const [search, setSearch]         = useState('')
  const [feedSeed, setFeedSeed]     = useState(() => Date.now())
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const palette = userProfile?.palette

  // Stable fetch function for a given page
  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (replace) setLoadingFirst(true)
      else setLoadingMore(true)

      const selectedRetailers = retailers.includes('All') ? [] : retailers

      const params = new URLSearchParams()
      if (palette) params.set('palette', palette.allHexCodes.join(','))
      params.set('category', mainCategory)
      if (subcategories.length > 0) params.set('subcategories', subcategories.join(','))
      if (selectedRetailers.length > 0) params.set('retailers', selectedRetailers.join(','))
      if (search) params.set('search', search)
      if (sortBy === 'match') params.set('sort', 'match')
      if (priceMin !== null) params.set('priceMin', String(priceMin))
      if (priceMax !== null) params.set('priceMax', String(priceMax))
      params.set('seed', String(feedSeed))
      params.set('page', String(pageNum))
      params.set('limit', String(PAGE_SIZE))

      try {
        const res = await fetch(`/api/discover?${params}`)
        const data = await res.json() as { products: Product[]; total: number; page: number }
        setTotal(data.total)
        setProducts((prev) => replace ? data.products : [...prev, ...data.products])
        setPage(pageNum)
      } catch {
        // keep existing products on error
      } finally {
        if (replace) setLoadingFirst(false)
        else setLoadingMore(false)
      }
    },
    [mainCategory, subcategories, search, retailers, palette?.seasonalType, priceMin, priceMax, feedSeed, sortBy]
  )

  useEffect(() => {
    const refreshFeed = () => setFeedSeed(Date.now())
    window.addEventListener('atelier:refresh-feed', refreshFeed)
    return () => window.removeEventListener('atelier:refresh-feed', refreshFeed)
  }, [])

  // Reload from page 0 when filters change or the feed is refreshed
  useEffect(() => {
    setProducts([])
    setPage(0)
    fetchPage(0, true)
  }, [fetchPage])

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingFirst && !loadingMore) {
          const hasMore = products.length < total
          if (hasMore) fetchPage(page + 1, false)
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [products.length, total, page, loadingFirst, loadingMore, fetchPage])

  // Client-side subcategory + retailer + color filter + sort (applied on top of server results)
  const visible = (() => {
    let arr = products
    if (subcategories.length > 0) {
      arr = arr.filter((p) => subcategories.includes(p.subcategory || ''))
    }
    if (!retailers.includes('All')) {
      arr = arr.filter((p) => retailers.includes(p.retailer))
    }
    if (colors.length > 0) {
      arr = arr.filter((p) => p.hexColors.some(hex => colors.includes(getBasicColor(hex))))
    }
    if (sortBy === 'price-asc')  arr = [...arr].sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc') arr = [...arr].sort((a, b) => b.price - a.price)
    return arr
  })()

  const hasMore = products.length < total

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Palette banner */}
      {palette && (
        <div className="bg-white border-b border-stone-100 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {palette.allHexCodes.slice(0, 10).map((hex, i) => (
                <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: hex }} />
              ))}
            </div>
            <span className="text-xs text-stone-500">
              <span className="font-semibold text-stone-800">{palette.seasonalType}</span>
              {' '}· {total > 0 ? `${total.toLocaleString()} matches across` : 'searching'} 8 retailers
            </span>
          </div>
        </div>
      )}

      {/* Sticky filter bar */}
      <div className="sticky top-14 sm:top-[57px] z-30 bg-[#FAFAF7]/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm hover:border-stone-300 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300/70"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-4.414 4.414A1 1 0 0016 12.414V19l-4-2v-4.586a1 1 0 00-.293-.707L7.293 7.293A1 1 0 017 6.586V4z" />
            </svg>
            Filters
          </button>

          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-200 rounded-full bg-white focus:outline-none focus:border-stone-400"
            />
          </div>

          <div className="ml-auto flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 text-xs border border-stone-200 rounded-full bg-white text-stone-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-300/70 cursor-pointer"
            >
              <option value="match">Best Match</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </div>
        </div>
      </div>

      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsFilterDrawerOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 z-50 h-full w-80 max-w-[90vw] border-r border-stone-200 bg-[#FAFAF7] shadow-2xl transition-transform duration-200 ${isFilterDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-stone-800">Filters</p>
              <p className="text-xs text-stone-500">Refine your feed</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="rounded-full border border-stone-200 bg-white p-2 text-stone-500 shadow-sm hover:border-stone-300 hover:text-stone-700"
              aria-label="Close filters"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 text-sm">
            <section>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 shadow-sm focus:outline-none focus:border-stone-400"
              />
            </section>

            <section>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Category</label>
              <div className="space-y-1 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
                {MAIN_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setMainCategory(c.id)
                      setSubcategories([])
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-xs transition-colors ${mainCategory === c.id ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-50'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </section>

            {SUBCATEGORIES[mainCategory].length > 0 && (
              <section>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Subcategory</label>
                <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
                  {SUBCATEGORIES[mainCategory].map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-start gap-2 rounded-xl px-2 py-1.5 text-xs text-stone-700 hover:bg-stone-50">
                      <input
                        type="checkbox"
                        checked={subcategories.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSubcategories([...subcategories, s.id])
                          else setSubcategories(subcategories.filter((item) => item !== s.id))
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-stone-300"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Retailers</label>
              <div className="space-y-1 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
                {RETAILERS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-stone-700 hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={retailers.includes(r)}
                      onChange={(e) => {
                        if (r === 'All') setRetailers(e.target.checked ? ['All'] : [])
                        else {
                          const next = e.target.checked ? retailers.filter((item) => item !== 'All').concat(r) : retailers.filter((item) => item !== r)
                          setRetailers(next.length ? next : ['All'])
                        }
                      }}
                      className="h-3.5 w-3.5 rounded border-stone-300"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Colors</label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
                {BASIC_COLORS.map((color) => {
                  const active = colors.includes(color.name.toLowerCase())
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setColors(active ? colors.filter((item) => item !== color.name.toLowerCase()) : [...colors, color.name.toLowerCase()])}
                      className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs transition ${active ? 'border-stone-400 bg-stone-100' : 'border-stone-200 hover:bg-stone-50'}`}
                    >
                      <span className="h-3.5 w-3.5 rounded-full border border-stone-300" style={{ backgroundColor: color.hex }} />
                      <span className="text-stone-700">{color.name}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Price</label>
              <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm space-y-3">
                <div>
                  <label className="text-xs text-stone-600">Min</label>
                  <input type="number" min="0" value={priceMin ?? ''} onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:outline-none focus:border-stone-400" />
                </div>
                <div>
                  <label className="text-xs text-stone-600">Max</label>
                  <input type="number" min={priceMin || 0} value={priceMax ?? ''} onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 focus:outline-none focus:border-stone-400" />
                </div>
              </div>
            </section>
          </div>

          <div className="border-t border-stone-200 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setMainCategory('all')
                setSubcategories([])
                setRetailers(['All'])
                setColors([])
                setPriceMin(null)
                setPriceMax(null)
                setIsFilterDrawerOpen(false)
              }}
              className="w-full rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-sm hover:border-stone-300 hover:bg-stone-50"
            >
              Clear filters
            </button>
          </div>
        </div>
      </aside>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {loadingFirst ? (
          <div className="masonry">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="masonry-item">
                <div className="bg-stone-100 rounded-xl animate-pulse aspect-[3/4]" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-2 bg-stone-100 rounded w-1/2 animate-pulse" />
                  <div className="h-3 bg-stone-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-serif text-xl text-stone-700 mb-2">No matches found</p>
            <p className="text-sm text-stone-400">
              {palette
                ? 'Try adjusting your filters — we only show colors suited to your palette.'
                : 'Try adjusting your search or category.'}
            </p>
          </div>
        ) : (
          <>
            {total > 0 && (
              <p className="text-xs text-stone-400 mb-4">
                Showing {visible.length.toLocaleString()} of {total.toLocaleString()} palette-matched items
                {!retailers.includes('All') && ` · ${retailers.join(', ')}`}
              </p>
            )}

            <div className="masonry">
              {visible.map((product) => (
                <div key={product.id} className="masonry-item">
                  <ProductCard product={product} onClick={() => setSelectedProduct(product)} />
                </div>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {/* Loading spinner for next page */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-stone-400 text-xs">
                  <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  Loading more…
                </div>
              </div>
            )}

            {/* End of results */}
            {!hasMore && !loadingMore && visible.length > 0 && (
              <p className="text-center text-xs text-stone-300 py-8">
                You've seen all {total.toLocaleString()} palette-matched items
              </p>
            )}
          </>
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  )
}
