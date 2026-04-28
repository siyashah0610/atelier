import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { WishList, WishListItem } from '../types'

const VERDICT_COLOR: Record<string, string> = {
  perfect: '#059669',
  great: '#22C55E',
  good: '#F59E0B',
  fair: '#F97316',
  skip: '#EF4444',
}

function ItemCard({ item, onRemove }: { item: WishListItem; onRemove: () => void }) {
  const verdictColor = VERDICT_COLOR[item.colorVerdict] ?? '#A8A29E'
  const displayImage = item.chosenColor?.imageUrl ?? item.productImageUrl
  const shopUrl = item.chosenColor?.url ?? null

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden group">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={item.productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {item.chosenColor ? (
              <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: item.chosenColor.hex }} />
            ) : (
              <span className="text-3xl text-stone-200">✦</span>
            )}
          </div>
        )}

        {/* Match score badge */}
        <div
          className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: verdictColor }}
        >
          {item.colorScore}
        </div>

        {/* Color swatch */}
        {item.chosenColor && (
          <div
            className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: item.chosenColor.hex }}
            title={item.chosenColor.name}
          />
        )}

        {/* Remove on hover */}
        <button
          onClick={onRemove}
          className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 text-stone-500 hover:text-rose-500 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
        >
          ✕
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        {item.productBrand && (
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider truncate">{item.productBrand}</p>
        )}
        <p className="text-xs font-semibold text-stone-900 mt-0.5 leading-tight line-clamp-2">{item.productName}</p>
        {item.chosenColor && (
          <p className="text-[10px] text-stone-400 mt-1 truncate">{item.chosenColor.name}</p>
        )}
        {item.productPrice && (
          <p className="text-[10px] font-semibold text-stone-600 mt-1">${item.productPrice.toFixed(2)}</p>
        )}
        {shopUrl && (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block w-full py-1.5 rounded-lg bg-stone-900 text-white text-[10px] font-semibold text-center hover:bg-stone-700 transition-colors"
          >
            Shop →
          </a>
        )}
      </div>
    </div>
  )
}

function WishListCard({ list, onDelete, onToggleVisibility, onRemoveItem }: {
  list: WishList
  onDelete: () => void
  onToggleVisibility: () => void
  onRemoveItem: (itemId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const { renameWishList } = useApp()

  const coverImages = list.items
    .slice(0, 4)
    .map((i) => i.chosenColor?.imageUrl ?? i.productImageUrl)
    .filter(Boolean) as string[]

  function saveRename() {
    if (editName.trim() && editName.trim() !== list.name) renameWishList(list.id, editName.trim())
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        {/* Cover mosaic */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 grid grid-cols-2 gap-px"
        >
          {coverImages.length === 0 && (
            <div className="col-span-2 row-span-2 flex items-center justify-center text-stone-300 text-2xl">✦</div>
          )}
          {coverImages.slice(0, 4).map((src, i) => (
            <img key={i} src={src} alt="" className="w-full h-full object-cover" />
          ))}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={saveRename}
              onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditing(false) }}
              className="w-full text-sm font-semibold text-stone-900 border-b border-stone-300 focus:outline-none bg-transparent pb-0.5"
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-left font-semibold text-stone-900 text-sm hover:text-stone-600 transition-colors truncate block w-full"
            >
              {list.name}
            </button>
          )}
          <p className="text-xs text-stone-400 mt-0.5">
            {list.items.length} item{list.items.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleVisibility}
            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-colors ${
              list.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {list.isPublic ? 'Public' : 'Private'}
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-full flex items-center justify-center text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-stone-400 text-xs w-5 text-center"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded item grid */}
      {expanded && (
        <div className="border-t border-stone-50 p-4">
          {list.items.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">
              No items yet. Save an analysis here from the Analyses page.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {list.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => onRemoveItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WishListsPage() {
  const { wishLists, createWishList, deleteWishList, toggleWishListVisibility, removeFromWishList, setCurrentPage } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  function handleCreate() {
    if (!newName.trim()) return
    createWishList(newName.trim())
    setNewName('')
    setShowCreate(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-stone-900">Wish Lists</h1>
            <p className="text-sm text-stone-400 mt-1">
              {wishLists.length} list{wishLists.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition-colors"
          >
            <span className="text-lg leading-none">+</span> New List
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-6 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <p className="text-sm font-semibold text-stone-700 mb-3">Name your wish list</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. Summer in Europe, Work Capsule…"
                autoFocus
                className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-400"
              />
              <button onClick={handleCreate} className="px-4 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800">
                Create
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {wishLists.length === 0 && !showCreate && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">✦</div>
            <h2 className="font-serif text-2xl text-stone-700 mb-2">No wish lists yet</h2>
            <p className="text-sm text-stone-400 mb-6 max-w-sm mx-auto">
              Save your analyses here — by color, occasion, or vibe. Keep them private or share your atelier.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowCreate(true)}
                className="px-6 py-3 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800"
              >
                Create Your First List
              </button>
              <button
                onClick={() => setCurrentPage('analyses')}
                className="px-6 py-3 border border-stone-200 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50"
              >
                View Analyses
              </button>
            </div>
          </div>
        )}

        {/* List of wish lists */}
        <div className="space-y-4">
          {wishLists.map((list) => (
            <WishListCard
              key={list.id}
              list={list}
              onDelete={() => deleteWishList(list.id)}
              onToggleVisibility={() => toggleWishListVisibility(list.id)}
              onRemoveItem={(itemId) => removeFromWishList(list.id, itemId)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
