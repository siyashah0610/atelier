import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { Product, ProductCategory } from '../types'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'

const CATEGORIES: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'clothing', label: 'Clothing' },
  { id: 'shoes',    label: 'Shoes'    },
  { id: 'jewelry',  label: 'Jewelry'  },
  { id: 'bags',     label: 'Bags'     },
]

const RETAILERS = ['All', 'Aritzia', 'Princess Polly', 'Reformation', 'Edikted', 'Brandy Melville', 'UNIQLO']
const PAGE_SIZE = 50

export default function FeedPage() {
  const { userProfile, selectedProduct, setSelectedProduct } = useApp()

  const [products, setProducts]     = useState<Product[]>([])
  const [page, setPage]             = useState(0)
  const [total, setTotal]           = useState(0)
  const [loadingFirst, setLoadingFirst] = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [category, setCategory]     = useState<ProductCategory | 'all'>('all')
  const [retailer, setRetailer]     = useState('All')
  const [sortBy, setSortBy]         = useState<'match' | 'price-asc' | 'price-desc'>('match')
  const [search, setSearch]         = useState('')

  const sentinelRef = useRef<HTMLDivElement>(null)
  const palette = userProfile?.palette

  // Stable fetch function for a given page
  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (replace) setLoadingFirst(true)
      else setLoadingMore(true)

      const params = new URLSearchParams()
      if (palette) params.set('palette', palette.allHexCodes.join(','))
      if (category !== 'all') params.set('category', category)
      if (search) params.set('search', search)
      if (sortBy === 'match') params.set('sort', 'match')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, search, palette?.seasonalType]
  )

  // Reload from page 0 when filters change
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

  // Client-side retailer filter + sort (applied on top of server results)
  const visible = (() => {
    let arr = retailer !== 'All' ? products.filter((p) => p.retailer === retailer) : products
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
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Search */}
          <div className="relative flex-shrink-0">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-3 py-1.5 text-xs border border-stone-200 rounded-full bg-white focus:outline-none focus:border-stone-400 w-28"
            />
          </div>

          {/* Category */}
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                category === c.id ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
              }`}
            >
              {c.label}
            </button>
          ))}

          <div className="w-px h-4 bg-stone-200 flex-shrink-0" />

          {/* Retailer */}
          {RETAILERS.map((r) => (
            <button
              key={r}
              onClick={() => setRetailer(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                retailer === r ? 'bg-stone-700 text-white' : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-400'
              }`}
            >
              {r}
            </button>
          ))}

          {/* Sort */}
          <div className="flex-shrink-0 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 text-xs border border-stone-200 rounded-full bg-white text-stone-600 focus:outline-none cursor-pointer"
            >
              <option value="match">Best Match</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </div>
        </div>
      </div>

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
                {retailer !== 'All' && ` · ${retailer}`}
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
