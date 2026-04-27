import React from 'react'
import { useApp } from '../context/AppContext'
import { CartItem, BodyProfile } from '../types'

// Estimate clothing size from body measurements (US women's standard)
function estimateSize(body?: BodyProfile | null): string | null {
  if (!body) return null
  const bust = parseFloat(body.bust ?? '')
  const waist = parseFloat(body.waist ?? '')
  const hips = parseFloat(body.hips ?? '')
  const ref = !isNaN(bust) ? bust : !isNaN(hips) ? hips - 2 : !isNaN(waist) ? waist + 10 : NaN
  if (isNaN(ref)) return null
  if (ref <= 33) return 'XS'
  if (ref <= 35) return 'S'
  if (ref <= 37.5) return 'M'
  if (ref <= 40) return 'L'
  if (ref <= 42) return 'XL'
  return 'XXL'
}

function itemUrl(item: CartItem, estimatedSize: string | null): string {
  let url = item.product.affiliateUrl || '#'
  if (!url.startsWith('http')) return url
  const sizeToApply = item.size || estimatedSize
  if (!sizeToApply) return url
  try {
    const u = new URL(url)
    if (!u.searchParams.has('size') && !u.searchParams.has('sz') && !u.searchParams.has('variant')) {
      u.searchParams.set('size', sizeToApply)
    }
    return u.href
  } catch { return url }
}

// For Shopify stores: if every item has ?variant=ID, build /cart/ID:qty,ID:qty
function buildCheckoutUrl(items: CartItem[]): string {
  try {
    const origin = new URL(items[0].product.affiliateUrl).origin
    const parts: string[] = []
    for (const item of items) {
      const u = new URL(item.product.affiliateUrl)
      const variantId = u.searchParams.get('variant')
      // Shopify variant IDs are long numeric strings
      if (!variantId || !/^\d{8,}$/.test(variantId)) return items[0].product.affiliateUrl
      parts.push(`${variantId}:${item.quantity}`)
    }
    // Verify all items share the same origin (same Shopify store)
    const sameOrigin = items.every(i => {
      try { return new URL(i.product.affiliateUrl).origin === origin } catch { return false }
    })
    if (!sameOrigin) return items[0].product.affiliateUrl
    return `${origin}/cart/${parts.join(',')}`
  } catch {
    return items[0].product.affiliateUrl
  }
}

export default function CartPage() {
  const { cart, removeFromCart, setCurrentPage, userProfile } = useApp()
  const estimatedSize = estimateSize(userProfile?.bodyProfile)

  const byRetailer = cart.reduce<Record<string, CartItem[]>>((acc, item) => {
    const r = item.product.retailer
    acc[r] = acc[r] ? [...acc[r], item] : [item]
    return acc
  }, {})

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-5xl mb-4">🛍</div>
          <h1 className="font-serif text-2xl text-stone-900 mb-2">Your cart is empty</h1>
          <p className="text-sm text-stone-400 mb-8 max-w-xs mx-auto">
            Discover palette-matched products and add them here.
          </p>
          <button
            onClick={() => setCurrentPage('feed')}
            className="px-7 py-3.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
          >
            Browse Your Feed
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-stone-900">Cart</h1>
          <p className="text-sm text-stone-400">
            {cart.length} item{cart.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Estimated size banner */}
        {estimatedSize && (
          <div className="mb-6 bg-white rounded-2xl border border-stone-100 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {estimatedSize}
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">Your estimated size: {estimatedSize}</p>
              <p className="text-xs text-stone-400 mt-0.5">Based on your measurements — sizes vary by brand, check each retailer's size guide.</p>
            </div>
          </div>
        )}

        {/* Per-retailer groups */}
        <div className="space-y-6">
          {Object.entries(byRetailer).map(([retailer, items]) => {
            const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
            const checkoutUrl = buildCheckoutUrl(items)
            const isShopifyCart = checkoutUrl.includes('/cart/') && !checkoutUrl.includes('/products/')

            return (
              <div key={retailer} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                {/* Retailer header */}
                <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between">
                  <p className="font-semibold text-stone-900 text-sm">{retailer}</p>
                  <p className="text-xs text-stone-400">${subtotal.toFixed(2)} subtotal</p>
                </div>

                {/* Items */}
                <div className="divide-y divide-stone-50">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-400 font-medium">{item.product.brand}</p>
                        <a
                          href={itemUrl(item, estimatedSize)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-stone-800 font-medium leading-tight line-clamp-1 mt-0.5 hover:underline block"
                        >
                          {item.product.name}
                        </a>
                        <div className="flex items-center gap-2 mt-1.5">
                          {estimatedSize && item.product.category === 'clothing' && (
                            <span className="text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-medium">
                              Est. size {estimatedSize}
                            </span>
                          )}
                          {item.size && (
                            <span className="text-xs text-stone-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                              {item.size}
                            </span>
                          )}
                          <div className="flex gap-1">
                            {item.product.hexColors.map((hex, i) => (
                              <div
                                key={i}
                                className="w-3 h-3 rounded-full border border-stone-200"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-semibold text-stone-900 text-sm">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-stone-400">×{item.quantity}</p>
                        )}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-xs text-stone-400 hover:text-rose-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Checkout button per retailer */}
                <div className="px-5 py-4 bg-stone-50 space-y-2">
                  {isShopifyCart ? (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
                    >
                      {`Add All to ${retailer} Cart`}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <button
                      onClick={() => {
                        items.forEach(item => {
                          const a = document.createElement('a')
                          let finalUrl = item.product.affiliateUrl || '#'
                          const sizeToApply = item.size || estimatedSize
                          if (sizeToApply && finalUrl.startsWith('http')) {
                            try {
                              const u = new URL(finalUrl)
                              if (!u.searchParams.has('size') && !u.searchParams.has('sz')) {
                                u.searchParams.set('size', sizeToApply)
                              }
                              finalUrl = u.href
                            } catch {}
                          }
                          a.href = finalUrl
                          a.target = '_blank'
                          a.rel = 'noopener noreferrer'
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        })
                      }}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
                    >
                      {`Shop at ${retailer}`}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  )}
                  <p className="text-[10px] text-stone-400 text-center">
                    {isShopifyCart
                      ? `Opens ${retailer}'s cart with your items pre-loaded`
                      : items.length > 1
                        ? `Opens ${items.length} product tabs on ${retailer}'s website`
                        : `Opens the product page on ${retailer}'s website`}
                    {estimatedSize ? ` · Your est. size: ${estimatedSize}` : ''}
                  </p>
                  {!isShopifyCart && items.length > 1 && (
                    <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1.5 rounded-lg text-center font-medium">
                      ⚠️ Note: You may need to click "Allow pop-ups" in your browser's address bar to open all tabs at once.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div className="mt-6 bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {Object.entries(byRetailer).map(([retailer, items]) => (
              <div key={retailer} className="flex justify-between text-stone-600">
                <span>{retailer}</span>
                <span>${items.reduce((s, i) => s + i.product.price * i.quantity, 0).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-stone-100 pt-2 flex justify-between font-semibold text-stone-900">
              <span>Total (estimated)</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-[11px] text-stone-400 mt-3 leading-relaxed">
            Each retailer processes their order separately. Atelier earns a small affiliate commission from partner retailers at no extra cost to you.
          </p>
        </div>
      </div>
    </div>
  )
}
