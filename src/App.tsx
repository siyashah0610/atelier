import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import FeedPage from './pages/FeedPage'
import WishListsPage from './pages/WishListsPage'
import ProfilePage from './pages/ProfilePage'
import CartPage from './pages/CartPage'
import CheckPage from './pages/CheckPage'
import AnalysesPage from './pages/AnalysesPage'

function Pages() {
  const { currentPage } = useApp()

  return (
    <>
      {currentPage !== 'landing' && currentPage !== 'onboarding' && <Header />}
      {currentPage === 'landing' && <Landing />}
      {currentPage === 'onboarding' && <Onboarding />}
      {currentPage === 'feed' && <FeedPage />}
      {currentPage === 'check' && <CheckPage />}
      {currentPage === 'wishlists' && <WishListsPage />}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'cart' && <CartPage />}
      {currentPage === 'analyses' && <AnalysesPage />}
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Pages />
    </AppProvider>
  )
}
