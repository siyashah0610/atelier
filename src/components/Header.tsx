import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { Page } from '../types'

export default function Header() {
  const { currentPage, setCurrentPage, userProfile, cartCount } = useApp()
  const { signOut } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const hasProfile = !!userProfile?.palette

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      setCurrentPage('landing')
    } catch (err) {
      console.error('Sign out failed:', err)
      setIsSigningOut(false)
    }
  }

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
              {navLink('check', 'Check Item')}
              {navLink('wishlists', 'Wish Lists')}
              {navLink('analyses', 'Analyses')}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Profile menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-semibold hover:bg-stone-800 transition-colors"
                  title={userProfile?.name || 'Profile'}
                >
                  {(userProfile?.name || 'A')[0].toUpperCase()}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">Account</p>
                      <p className="text-sm text-stone-900 font-medium mt-1">{userProfile?.name || 'Atelier User'}</p>
                      <p className="text-xs text-stone-400 mt-0.5">@{userProfile?.username || 'my_atelier'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        setCurrentPage('profile')
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        setCurrentPage('profile')
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-stone-100 disabled:opacity-50"
                    >
                      {isSigningOut ? 'Signing out…' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile nav */}
      {hasProfile && (
        <div className="sm:hidden flex border-t border-stone-100">
          {(['feed', 'check', 'wishlists', 'analyses', 'profile', 'cart'] as Page[]).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex-1 py-2 text-xs font-medium capitalize ${
                currentPage === page ? 'text-stone-900 bg-stone-50' : 'text-stone-500'
              }`}
            >
              {page === 'feed' ? 'discover'
                : page === 'check' ? 'check'
                : page === 'wishlists' ? 'lists'
                : page === 'analyses' ? 'history'
                : page}
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
