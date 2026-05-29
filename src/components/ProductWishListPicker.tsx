import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Product, WishList } from '../types'
import { useApp } from '../context/AppContext'

interface Props {
  product: Product
  onClose: () => void
  onAdded?: () => void
  triggerRef?: React.RefObject<HTMLButtonElement>
}

export default function ProductWishListPicker({ product, onClose, onAdded, triggerRef }: Props) {
  const { wishLists, createWishList, addProductToWishList } = useApp()
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string; matchScore: number; url: string; imageUrl: string } | null>(
    product.colorOptions?.[0] ?? null
  )
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && (!triggerRef?.current || !triggerRef.current.contains(e.target as Node))) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, triggerRef])

  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8, // 8px below the button
        left: rect.left - 216, // w-72 = 288px, position so it aligns with button
      })
    } else {
      // Fallback position for when no trigger ref is provided (e.g., ProductModal)
      setPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 144,
      })
    }
  }, [triggerRef])

  function handleAdd(list: WishList) {
    const chosenColor = selectedColor
      ? {
          name: selectedColor.name,
          hex: selectedColor.hex,
          url: selectedColor.url,
          imageUrl: selectedColor.imageUrl,
          matchScore: selectedColor.matchScore,
          verdict: `Matches your palette at ${selectedColor.matchScore}%`,
        }
      : null
    addProductToWishList(list.id, product, chosenColor)
    setAddedTo((prev) => new Set([...prev, list.id]))
    onAdded?.()
  }

  function handleCreateAndAdd() {
    if (!newListName.trim()) return
    const list = createWishList(newListName.trim())
    const chosenColor = selectedColor
      ? {
          name: selectedColor.name,
          hex: selectedColor.hex,
          url: selectedColor.url,
          imageUrl: selectedColor.imageUrl,
          matchScore: selectedColor.matchScore,
          verdict: `Matches your palette at ${selectedColor.matchScore}%`,
        }
      : null
    addProductToWishList(list.id, product, chosenColor)
    setAddedTo((prev) => new Set([...prev, list.id]))
    setNewListName('')
    setCreating(false)
    onAdded?.()
  }

  const content = (
    <div
      ref={ref}
      className="fixed z-50 w-72 bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="px-4 pt-4 pb-3 border-b border-stone-100">
        <p className="text-xs font-semibold text-stone-900">Add to Wish List</p>
        {product.colorOptions && product.colorOptions.length > 1 && (
          <div className="mt-2">
            <p className="text-[10px] text-stone-400 mb-1.5">Choose a color:</p>
            <div className="flex gap-1.5 flex-wrap">
              {product.colorOptions.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => setSelectedColor(opt)}
                  title={`${opt.name} (${opt.matchScore}%)`}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedColor?.name === opt.name ? 'border-stone-900 scale-110' : 'border-white shadow ring-1 ring-stone-100'
                  }`}
                  style={{ backgroundColor: opt.hex }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-h-48 overflow-y-auto">
        {wishLists.length === 0 && !creating && (
          <p className="text-xs text-stone-400 text-center py-4">No lists yet</p>
        )}
        {wishLists.map((list) => {
          const saved = addedTo.has(list.id)
          return (
            <button
              key={list.id}
              onClick={() => !saved && handleAdd(list)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                saved ? 'bg-stone-50 text-stone-400' : 'hover:bg-stone-50 text-stone-800'
              }`}
            >
              <span className="text-sm font-medium truncate">{list.name}</span>
              {saved ? (
                <span className="text-[10px] text-emerald-600 font-semibold flex-shrink-0">Saved ✓</span>
              ) : (
                <span className="text-[10px] text-stone-400 flex-shrink-0">{list.items.length} items</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="border-t border-stone-100 p-3">
        {creating ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateAndAdd()
                if (e.key === 'Escape') setCreating(false)
              }}
              placeholder="List name…"
              className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
            />
            <button onClick={handleCreateAndAdd} className="px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg">
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full text-xs font-semibold text-stone-600 hover:text-stone-900 text-left transition-colors"
          >
            + New list
          </button>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
