import React, { useState, useEffect } from 'react'
import { Product, Board } from '../types'
import { useApp } from '../context/AppContext'
import { getMatchColor, getMatchLabel } from '../utils/colorUtils'

interface Props {
  product: Product
  onClose: () => void
}

export default function ProductModal({ product, onClose }: Props) {
  const {
    isProductSaved,
    saveProduct,
    unsaveProduct,
    addToCart,
    boards,
    createBoard,
    addToBoard,
  } = useApp()

  const saved = isProductSaved(product.id)
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product.sizes?.[0]
  )
  const [showBoardPicker, setShowBoardPicker] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [addedToCart, setAddedToCart] = useState(false)
  const score = product.matchScore

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleAddToCart = () => {
    addToCart(product, selectedSize)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleSaveToBoard = (boardId: string) => {
    addToBoard(boardId, product)
    setShowBoardPicker(false)
  }

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return
    const board = createBoard(newBoardName.trim(), 'inspiration')
    addToBoard(board.id, product)
    setNewBoardName('')
    setShowBoardPicker(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
        >
          ✕
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-5/12 aspect-[3/4] sm:aspect-auto bg-stone-100 flex-shrink-0">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover sm:rounded-l-2xl"
            />
          </div>

          {/* Details */}
          <div className="flex-1 p-5 sm:p-6 space-y-4">
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
                {product.brand} · {product.retailer}
              </p>
              <h2 className="font-serif text-xl text-stone-900 mt-1">{product.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold text-stone-900">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-sm text-stone-400 line-through">
                    ${product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Match score */}
            {score !== undefined && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: getMatchColor(score) }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {getMatchLabel(score)} palette match — {score}%
              </div>
            )}

            {/* Colors */}
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                Color
              </p>
              <div className="flex gap-2">
                {product.hexColors.map((hex, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">
                  Size
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                        selectedSize === size
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 text-stone-600 hover:border-stone-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(product.rating) ? 'text-amber-400' : 'text-stone-200'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-stone-500">
                {product.rating} ({product.reviewCount.toLocaleString()} reviews)
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-stone-100 text-stone-600 text-[11px] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleAddToCart}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => (saved ? unsaveProduct(product.id) : saveProduct(product))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    saved
                      ? 'border-rose-300 bg-rose-50 text-rose-600'
                      : 'border-stone-200 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {saved ? '♥ Saved' : '♡ Save'}
                </button>
                <button
                  onClick={() => setShowBoardPicker(!showBoardPicker)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-700 hover:border-stone-400 transition-colors"
                >
                  + Board
                </button>
              </div>

              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl text-sm font-medium border border-stone-200 text-center text-stone-600 hover:border-stone-400 transition-colors"
              >
                View on {product.retailer} →
              </a>
            </div>

            {/* Board picker */}
            {showBoardPicker && (
              <div className="border border-stone-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
                  Save to Board
                </p>
                {boards.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {boards.map((board: Board) => (
                      <button
                        key={board.id}
                        onClick={() => handleSaveToBoard(board.id)}
                        className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 rounded-lg flex items-center justify-between"
                      >
                        <span>{board.name}</span>
                        <span className="text-stone-400 text-xs">
                          {board.products.length} items
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                    placeholder="New board name..."
                    className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
                  />
                  <button
                    onClick={handleCreateBoard}
                    className="px-3 py-2 text-xs bg-stone-900 text-white rounded-lg font-medium"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
