import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import FeedPage from './pages/FeedPage'
import BoardsPage from './pages/BoardsPage'
import ProfilePage from './pages/ProfilePage'
import CartPage from './pages/CartPage'

function Pages() {
  const { currentPage } = useApp()

  return (
    <>
      {currentPage !== 'landing' && currentPage !== 'onboarding' && <Header />}
      {currentPage === 'landing' && <Landing />}
      {currentPage === 'onboarding' && <Onboarding />}
      {currentPage === 'feed' && <FeedPage />}
      {currentPage === 'boards' && <BoardsPage />}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'cart' && <CartPage />}
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
