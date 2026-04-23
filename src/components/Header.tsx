import React from 'react'
import { useApp } from '../context/AppContext'
import { Page } from '../types'

export default function Header() {
  const { currentPage, setCurrentPage, userProfile, cartCount } = useApp()

  const hasProfile = !!userProfile?.palette

  const navLink = (page: Page, label: string) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`text-sm font-medium transition-colors ${
        currentPage === page
          ? 'text-stone-900 border-b border-stone-900'
          : 'text-stone-500 hover:text-stone-900'
      }`}
    >
      {label}
    </button>
  )

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => setCurrentPage(hasProfile ? 'feed' : 'landing')}
          className="font-serif text-xl font-semibold tracking-wide text-stone-900"
        >
          atelier
        </button>

        {hasProfile && (
          <>
            <nav className="hidden sm:flex items-center gap-7">
              {navLink('feed', 'Discover')}
              {navLink('boards', 'Boards')}
              {navLink('profile', 'Profile')}
            </nav>

            <div className="flex items-center gap-4">
              {userProfile.palette && (
                <div className="hidden sm:flex items-center gap-1.5">
                  {userProfile.palette.dominantColors.slice(0, 5).map((hex, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={() => setCurrentPage('cart')}
                className="relative flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-stone-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile nav */}
      {hasProfile && (
        <div className="sm:hidden flex border-t border-stone-100">
          {(['feed', 'boards', 'profile', 'cart'] as Page[]).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex-1 py-2 text-xs font-medium capitalize ${
                currentPage === page ? 'text-stone-900 bg-stone-50' : 'text-stone-500'
              }`}
            >
              {page === 'feed' ? 'discover' : page}
              {page === 'cart' && cartCount > 0 && (
                <span className="ml-1 text-[10px] bg-stone-900 text-white rounded-full px-1">
                  {cartCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
