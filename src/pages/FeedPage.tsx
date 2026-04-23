import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Product, ProductCategory } from '../types'
import { computeMatchScore } from '../utils/colorUtils'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'

const CATEGORIES: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'bags', label: 'Bags' },
  { id: 'makeup', label: 'Beauty' },
]

export default function FeedPage() {
  const { userProfile, selectedProduct, setSelectedProduct } = useApp()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'match' | 'price-asc' | 'price-desc' | 'rating'>('match')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (search) params.set('search', search)

    setLoading(true)
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data: Product[]) => {
        const palette = userProfile?.palette
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
  }, [category, search, userProfile?.palette])

  const sorted = useMemo(() => {
    const arr = [...products]
    if (sortBy === 'match') arr.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    if (sortBy === 'price-asc') arr.sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc') arr.sort((a, b) => b.price - a.price)
    if (sortBy === 'rating') arr.sort((a, b) => b.rating - a.rating)
    return arr
  }, [products, sortBy])

  const palette = userProfile?.palette

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Palette banner */}
      {palette && (
        <div className="bg-white border-b border-stone-100 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex gap-1">
              {palette.dominantColors.map((hex, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            <span className="text-xs text-stone-500 font-medium">
              Showing products matched to your{' '}
              <span className="font-semibold text-stone-800">{palette.seasonalType}</span> palette
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="sticky top-14 sm:top-[57px] z-30 bg-[#FAFAF7]/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Search */}
          <div className="relative flex-shrink-0">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
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
                <div
                  className={`bg-stone-100 rounded-xl animate-pulse ${
                    i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'
                  }`}
                />
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
            <p className="font-serif text-xl text-stone-700 mb-2">Nothing found</p>
            <p className="text-sm text-stone-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="masonry">
            {sorted.map((product) => (
              <div key={product.id} className="masonry-item">
                <ProductCard
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
