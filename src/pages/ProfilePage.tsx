import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import PaletteDisplay from '../components/PaletteDisplay'
import BodyStyleDisplay from '../components/BodyStyleDisplay'
import MakeupDisplay from '../components/MakeupDisplay'
import ProductModal from '../components/ProductModal'

const ALL_RETAILERS = [
  'Revolve', 'Aritzia', 'Free People', 'Mango', 'ASOS',
  'Zara', 'Reformation', 'H&M', '& Other Stories', 'Everlane',
  'J.Crew', 'Madewell', 'Steve Madden', 'Mejuri', 'Sephora',
]

export default function ProfilePage() {
  const { userProfile, savedProducts, boards, setCurrentPage, selectedProduct, setSelectedProduct, updateRetailers } =
    useApp()
  const [tab, setTab] = useState<'palette' | 'saved' | 'boards' | 'stores'>('palette')
  const [showAddStores, setShowAddStores] = useState(false)

  if (!userProfile) return null

  const publicBoards = boards.filter((b) => b.isPublic)

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
                </p>
              )}
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-serif text-stone-900">{savedProducts.length}</div>
              <div className="text-xs text-stone-400">saved</div>
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

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border border-stone-100 rounded-xl p-1 bg-stone-50">
            {([
              { id: 'palette', label: 'My Palette' },
              { id: 'saved', label: `Saved (${savedProducts.length})` },
              { id: 'boards', label: `Boards (${boards.length})` },
              { id: 'stores', label: 'Stores' },
            ] as { id: typeof tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
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

            {/* Makeup recommendations */}
            <div className="bg-white rounded-2xl p-5 border border-stone-100 space-y-5">
              <h3 className="font-serif text-lg text-stone-900">Makeup Shades</h3>
              <MakeupDisplay seasonalType={userProfile.palette.seasonalType} />
            </div>

            {userProfile.bodyProfile?.bodyType && (
              <div className="bg-white rounded-2xl p-5 border border-stone-100 space-y-5">
                <h3 className="font-serif text-lg text-stone-900">Style Profile</h3>
                <BodyStyleDisplay bodyType={userProfile.bodyProfile.bodyType} />
                {(userProfile.bodyProfile.height || userProfile.bodyProfile.bust ||
                  userProfile.bodyProfile.waist || userProfile.bodyProfile.hips) && (
                  <div className="pt-4 border-t border-stone-100">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
                      Measurements
                    </p>
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
              </div>
            )}

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

        {/* Saved tab */}
        {tab === 'saved' && (
          <div className="animate-fade-in">
            {savedProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">♡</p>
                <h2 className="font-serif text-xl text-stone-700 mb-2">Nothing saved yet</h2>
                <p className="text-sm text-stone-400 mb-6">
                  Heart products in your feed to save them here.
                </p>
                <button
                  onClick={() => setCurrentPage('feed')}
                  className="px-5 py-2.5 bg-stone-900 text-white text-sm rounded-xl"
                >
                  Browse Your Feed
                </button>
              </div>
            ) : (
              <div className="masonry">
                {savedProducts.map((product) => (
                  <div key={product.id} className="masonry-item">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-full group"
                    >
                      <div
                        className={`rounded-xl overflow-hidden bg-stone-100 ${
                          product.aspectRatio === 'tall' ? 'aspect-[3/4]' : 'aspect-square'
                        }`}
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2 text-left">
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                          {product.brand}
                        </p>
                        <p className="text-xs text-stone-800 font-medium mt-0.5 line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-sm font-semibold text-stone-900 mt-0.5">${product.price}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Boards tab */}
        {tab === 'boards' && (
          <div className="animate-fade-in">
            {boards.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🗂</p>
                <h2 className="font-serif text-xl text-stone-700 mb-2">No boards yet</h2>
                <button
                  onClick={() => setCurrentPage('boards')}
                  className="px-5 py-2.5 bg-stone-900 text-white text-sm rounded-xl"
                >
                  Create a Board
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => setCurrentPage('boards')}
                    className="bg-white rounded-2xl border border-stone-100 overflow-hidden text-left hover:shadow-sm transition-shadow"
                  >
                    {/* Mini mosaic */}
                    <div className="grid grid-cols-3 h-28">
                      {board.products.slice(0, 3).map((p, i) => (
                        <img key={i} src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      ))}
                      {board.products.length === 0 && (
                        <div className="col-span-3 flex items-center justify-center text-stone-200 text-3xl">
                          ✦
                        </div>
                      )}
                      {board.products.length > 0 && board.products.length < 3 &&
                        Array.from({ length: 3 - board.products.length }).map((_, i) => (
                          <div key={i} className="bg-stone-50" />
                        ))
                      }
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-stone-900 text-sm">{board.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5 capitalize">
                        {board.type} · {board.products.length} items ·{' '}
                        {board.isPublic ? 'Public' : 'Private'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

        {/* Stores tab */}
        {tab === 'stores' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg text-stone-900">Your Stores</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Your feed only shows products from these retailers.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddStores((v) => !v)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors"
                >
                  {showAddStores ? 'Done' : '+ Add'}
                </button>
              </div>

              {/* Current retailers */}
              {(userProfile.favoriteRetailers ?? []).length === 0 ? (
                <p className="text-sm text-stone-400 py-2">No stores selected yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(userProfile.favoriteRetailers ?? []).map((r) => (
                    <span
                      key={r}
                      className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-full"
                    >
                      {r}
                      <button
                        onClick={() =>
                          updateRetailers(
                            (userProfile.favoriteRetailers ?? []).filter((x) => x !== r)
                          )
                        }
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                        aria-label={`Remove ${r}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add stores panel */}
              {showAddStores && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
                    Add a store
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_RETAILERS.filter(
                      (r) => !(userProfile.favoriteRetailers ?? []).includes(r)
                    ).map((r) => (
                      <button
                        key={r}
                        onClick={() =>
                          updateRetailers([...(userProfile.favoriteRetailers ?? []), r])
                        }
                        className="px-3.5 py-1.5 text-xs font-medium bg-white border border-stone-200 text-stone-600 rounded-full hover:border-stone-900 hover:text-stone-900 transition-colors"
                      >
                        + {r}
                      </button>
                    ))}
                    {ALL_RETAILERS.every((r) =>
                      (userProfile.favoriteRetailers ?? []).includes(r)
                    ) && (
                      <p className="text-xs text-stone-400">All stores already added.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(userProfile.favoriteRetailers ?? []).length > 0 && (
              <button
                onClick={() => setCurrentPage('feed')}
                className="w-full py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
              >
                Browse Your Feed →
              </button>
            )}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  )
}
