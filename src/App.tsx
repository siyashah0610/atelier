import React from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import WishListsPage from './pages/WishListsPage'
import ProfilePage from './pages/ProfilePage'
import CartPage from './pages/CartPage'
import CheckPage from './pages/CheckPage'
import AnalysesPage from './pages/AnalysesPage'

function Pages() {
  const { loading: authLoading } = useAuth()
  const { currentPage, initialized } = useApp()

  if (authLoading || !initialized) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="font-serif text-2xl text-stone-900">atelier</span>
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <>
      {currentPage !== 'landing' && currentPage !== 'onboarding' && currentPage !== 'auth' && <Header />}
      {currentPage === 'landing'    && <Landing />}
      {currentPage === 'auth'       && <AuthPage />}
      {currentPage === 'onboarding' && <Onboarding />}
      {currentPage === 'feed'       && <FeedPage />}
      {currentPage === 'check'      && <CheckPage />}
      {currentPage === 'wishlists'  && <WishListsPage />}
      {currentPage === 'profile'    && <ProfilePage />}
      {currentPage === 'cart'       && <CartPage />}
      {currentPage === 'analyses'   && <AnalysesPage />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Pages />
      </AppProvider>
    </AuthProvider>
  )
}
