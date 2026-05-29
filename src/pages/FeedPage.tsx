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

function useDropdownPosition(isOpen: boolean, buttonRef: React.RefObject<HTMLButtonElement>) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      setPosition(null)
      return
    }

    const updatePosition = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom,
        left: rect.left,
      })
    }

    updatePosition()
    const scrollHandler = () => updatePosition()
    window.addEventListener('scroll', scrollHandler, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', scrollHandler, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, buttonRef])

  return position
}

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

const CATEGORIES: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'clothing', label: 'Clothing' },
  { id: 'shoes',    label: 'Shoes'    },
  { id: 'jewelry',  label: 'Jewelry'  },
  { id: 'bags',     label: 'Bags'     },
]

const RETAILERS = ['All', 'Aritzia', 'Princess Polly', 'Reformation', 'Edikted', 'Brandy Melville', 'UNIQLO']
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
  const [categories, setCategories] = useState<(ProductCategory | 'all')[]>(['all'])
  const [retailers, setRetailers]   = useState<string[]>(['All'])
  const [colors, setColors]         = useState<string[]>([])
  const [sortBy, setSortBy]         = useState<'match' | 'price-asc' | 'price-desc'>('match')
  const [search, setSearch]         = useState('')
  const [retailerDropdownOpen, setRetailerDropdownOpen] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const categoryButtonRef = useRef<HTMLButtonElement>(null)
  const retailerButtonRef = useRef<HTMLButtonElement>(null)
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  const palette = userProfile?.palette

  const categoryDropdownPos = useDropdownPosition(categoryDropdownOpen, categoryButtonRef)
  const retailerDropdownPos = useDropdownPosition(retailerDropdownOpen, retailerButtonRef)
  const colorDropdownPos = useDropdownPosition(colorDropdownOpen, colorButtonRef)

  // Stable fetch function for a given page
  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (replace) setLoadingFirst(true)
      else setLoadingMore(true)

      const params = new URLSearchParams()
      if (palette) params.set('palette', palette.allHexCodes.join(','))
      if (!categories.includes('all') && categories.length === 1) params.set('category', categories[0])
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
    [categories, search, palette?.seasonalType]
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

  // Client-side category + retailer + color filter + sort (applied on top of server results)
  const visible = (() => {
    let arr = products
    if (!categories.includes('all')) {
      arr = arr.filter((p) => categories.includes(p.category as ProductCategory))
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

          {/* Category Dropdown */}
          <div className="flex-shrink-0">
            <button
              ref={categoryButtonRef}
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={`${FILTER_PILL_CLASS} flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${categoryDropdownOpen ? 'border-stone-300 bg-stone-50' : ''}`}
            >
              {categories.includes('all') ? 'All Categories' : `${categories.length} selected`}
              <svg className={`w-3 h-3 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {categoryDropdownOpen && categoryDropdownPos && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCategoryDropdownOpen(false)} />
                <div
                  className={`${DROPDOWN_PANEL_CLASS} fixed min-w-40 max-h-60 overflow-y-auto z-50 py-1`}
                  style={{ top: `${categoryDropdownPos.top}px`, left: `${categoryDropdownPos.left}px` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {CATEGORIES.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 cursor-pointer first:rounded-t-lg last:rounded-b-lg text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={categories.includes(c.id)}
                        onChange={(e) => {
                          if (c.id === 'all') {
                            setCategories(e.target.checked ? ['all'] : [])
                          } else {
                            const newCategories = e.target.checked
                              ? categories.filter(x => x !== 'all').concat(c.id)
                              : categories.filter(x => x !== c.id)
                            setCategories(newCategories.length === 0 ? ['all'] : newCategories)
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-stone-300 cursor-pointer"
                      />
                      <span className="text-stone-700">{c.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-px h-4 bg-stone-200 flex-shrink-0" />

          {/* Retailer Dropdown */}
          <div className="flex-shrink-0">
            <button
              ref={retailerButtonRef}
              onClick={() => setRetailerDropdownOpen(!retailerDropdownOpen)}
              className={`${FILTER_PILL_CLASS} flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${retailerDropdownOpen ? 'border-stone-300 bg-stone-50' : ''}`}
            >
              {retailers.includes('All') ? 'All Retailers' : `${retailers.length} selected`}
              <svg className={`w-3 h-3 transition-transform ${retailerDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {retailerDropdownOpen && retailerDropdownPos && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRetailerDropdownOpen(false)} />
                <div
                  className={`${DROPDOWN_PANEL_CLASS} fixed min-w-40 max-h-60 overflow-y-auto z-50 py-1`}
                  style={{ top: `${retailerDropdownPos.top}px`, left: `${retailerDropdownPos.left}px` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {RETAILERS.map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-50 cursor-pointer first:rounded-t-lg last:rounded-b-lg text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={retailers.includes(r)}
                        onChange={(e) => {
                          if (r === 'All') {
                            setRetailers(e.target.checked ? ['All'] : [])
                          } else {
                            const newRetailers = e.target.checked
                              ? retailers.filter(x => x !== 'All').concat(r)
                              : retailers.filter(x => x !== r)
                            setRetailers(newRetailers.length === 0 ? ['All'] : newRetailers)
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-stone-300 cursor-pointer"
                      />
                      <span className="text-stone-700">{r}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Color Dropdown */}
          <div className="flex-shrink-0">
            <button
              ref={colorButtonRef}
              onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
              className={`${FILTER_PILL_CLASS} flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${colorDropdownOpen ? 'border-stone-300 bg-stone-50' : ''}`}
            >
              {colors.length === 0 ? 'All Colors' : `${colors.length} selected`}
              <svg className={`w-3 h-3 transition-transform ${colorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {colorDropdownOpen && colorDropdownPos && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setColorDropdownOpen(false)} />
                <div
                  className={`${DROPDOWN_PANEL_CLASS} fixed min-w-48 max-h-60 overflow-y-auto z-50 py-1`}
                  style={{ top: `${colorDropdownPos.top}px`, left: `${colorDropdownPos.left}px` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {BASIC_COLORS.map((color) => (
                    <label
                      key={color.name}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 cursor-pointer first:rounded-t-lg last:rounded-b-lg text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={colors.includes(color.name.toLowerCase())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setColors([...colors, color.name.toLowerCase()])
                          } else {
                            setColors(colors.filter(c => c !== color.name.toLowerCase()))
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-stone-300 cursor-pointer"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-stone-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-stone-700 flex-1">{color.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sort */}
          <div className="flex-shrink-0 ml-auto">
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
