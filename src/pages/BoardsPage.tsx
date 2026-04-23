import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Board } from '../types'
import ProductModal from '../components/ProductModal'

export default function BoardsPage() {
  const {
    boards,
    createBoard,
    deleteBoard,
    toggleBoardVisibility,
    removeFromBoard,
    selectedProduct,
    setSelectedProduct,
  } = useApp()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<Board['type']>('inspiration')
  const [expandedBoard, setExpandedBoard] = useState<string | null>(null)

  const handleCreate = () => {
    if (!newName.trim()) return
    createBoard(newName.trim(), newType)
    setNewName('')
    setShowCreate(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-stone-900">My Boards</h1>
            <p className="text-sm text-stone-400 mt-1">
              {boards.length} board{boards.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors"
          >
            <span className="text-lg leading-none">+</span> New Board
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-6 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm animate-slide-up">
            <p className="text-sm font-semibold text-stone-700 mb-3">Create New Board</p>
            <div className="space-y-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Board name (e.g. Summer in Europe)"
                autoFocus
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400"
              />
              <div className="flex gap-2">
                {(['inspiration', 'outfit', 'capsule'] as Board['type'][]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border capitalize transition-colors ${
                      newType === t
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl"
                >
                  Create Board
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm font-medium rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {boards.length === 0 && !showCreate && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🗂</div>
            <h2 className="font-serif text-2xl text-stone-700 mb-2">No boards yet</h2>
            <p className="text-sm text-stone-400 mb-6 max-w-sm mx-auto">
              Save products from your feed to boards. Keep inspiration private or share publicly.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-xl"
            >
              Create Your First Board
            </button>
          </div>
        )}

        {/* Board list */}
        <div className="space-y-4">
          {boards.map((board) => (
            <div key={board.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              {/* Board header */}
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setExpandedBoard(expandedBoard === board.id ? null : board.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {/* Cover mosaic */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 grid grid-cols-2 gap-px">
                    {board.products.slice(0, 4).map((p, i) => (
                      <img
                        key={i}
                        src={p.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ))}
                    {board.products.length === 0 && (
                      <div className="col-span-2 row-span-2 flex items-center justify-center text-stone-300 text-2xl">
                        ✦
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{board.name}</p>
                    <p className="text-xs text-stone-400 capitalize">
                      {board.type} · {board.products.length} item{board.products.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBoardVisibility(board.id)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      board.isPublic
                        ? 'bg-green-100 text-green-700'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {board.isPublic ? 'Public' : 'Private'}
                  </button>
                  <button
                    onClick={() => deleteBoard(board.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <span className="text-stone-300 text-sm">{expandedBoard === board.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded product grid */}
              {expandedBoard === board.id && (
                <div className="border-t border-stone-50 p-4">
                  {board.products.length === 0 ? (
                    <p className="text-sm text-stone-400 text-center py-6">
                      No products yet. Save items from your feed to this board.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {board.products.map((product) => (
                        <div key={product.id} className="relative group">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="w-full aspect-square rounded-xl overflow-hidden bg-stone-100 block"
                          >
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </button>
                          <button
                            onClick={() => removeFromBoard(board.id, product.id)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-stone-600 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            ✕
                          </button>
                          <p className="text-[10px] text-stone-500 mt-1 truncate">{product.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  )
}
