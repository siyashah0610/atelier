import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { UserProfile, Product, Board, CartItem, Page } from '../types'

interface AppState {
  currentPage: Page
  userProfile: UserProfile | null
  savedProducts: Product[]
  boards: Board[]
  cart: CartItem[]
  selectedProduct: Product | null
  setCurrentPage: (page: Page) => void
  setUserProfile: (profile: UserProfile) => void
  setSelectedProduct: (product: Product | null) => void
  saveProduct: (product: Product) => void
  unsaveProduct: (productId: string) => void
  isProductSaved: (productId: string) => boolean
  addToCart: (product: Product, size?: string) => void
  removeFromCart: (productId: string) => void
  cartCount: number
  createBoard: (name: string, type: Board['type']) => Board
  addToBoard: (boardId: string, product: Product) => void
  removeFromBoard: (boardId: string, productId: string) => void
  toggleBoardVisibility: (boardId: string) => void
  deleteBoard: (boardId: string) => void
  updateRetailers: (retailers: string[]) => void
}

const AppContext = createContext<AppState | null>(null)

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full — ignore
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPageState] = useState<Page>(() => {
    const profile = load<UserProfile | null>('atelier_profile', null)
    return profile?.palette ? 'feed' : 'landing'
  })
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(() =>
    load('atelier_profile', null)
  )
  const [savedProducts, setSavedProducts] = useState<Product[]>(() =>
    load('atelier_saved', [])
  )
  const [boards, setBoards] = useState<Board[]>(() => load('atelier_boards', []))
  const [cart, setCart] = useState<CartItem[]>(() => load('atelier_cart', []))
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => { save('atelier_profile', userProfile) }, [userProfile])
  useEffect(() => { save('atelier_saved', savedProducts) }, [savedProducts])
  useEffect(() => { save('atelier_boards', boards) }, [boards])
  useEffect(() => { save('atelier_cart', cart) }, [cart])

  const setCurrentPage = (page: Page) => setCurrentPageState(page)

  const setUserProfile = (profile: UserProfile) => setUserProfileState(profile)

  const saveProduct = useCallback((product: Product) => {
    setSavedProducts((prev) =>
      prev.find((p) => p.id === product.id) ? prev : [product, ...prev]
    )
  }, [])

  const unsaveProduct = useCallback((productId: string) => {
    setSavedProducts((prev) => prev.filter((p) => p.id !== productId))
  }, [])

  const isProductSaved = useCallback(
    (productId: string) => savedProducts.some((p) => p.id === productId),
    [savedProducts]
  )

  const addToCart = useCallback((product: Product, size?: string) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.size === size
      )
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, size, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }, [])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const createBoard = useCallback((name: string, type: Board['type']): Board => {
    const board: Board = {
      id: crypto.randomUUID(),
      name,
      type,
      isPublic: false,
      products: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setBoards((prev) => [board, ...prev])
    return board
  }, [])

  const addToBoard = useCallback((boardId: string, product: Product) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id === boardId && !b.products.find((p) => p.id === product.id)
          ? { ...b, products: [...b.products, product], updatedAt: new Date().toISOString() }
          : b
      )
    )
  }, [])

  const removeFromBoard = useCallback((boardId: string, productId: string) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id === boardId
          ? { ...b, products: b.products.filter((p) => p.id !== productId), updatedAt: new Date().toISOString() }
          : b
      )
    )
  }, [])

  const toggleBoardVisibility = useCallback((boardId: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, isPublic: !b.isPublic } : b))
    )
  }, [])

  const deleteBoard = useCallback((boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== boardId))
  }, [])

  const updateRetailers = useCallback((retailers: string[]) => {
    setUserProfileState((prev) => {
      if (!prev) return prev
      return { ...prev, favoriteRetailers: retailers }
    })
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentPage,
        userProfile,
        savedProducts,
        boards,
        cart,
        selectedProduct,
        setCurrentPage,
        setUserProfile,
        setSelectedProduct,
        saveProduct,
        unsaveProduct,
        isProductSaved,
        addToCart,
        removeFromCart,
        cartCount,
        createBoard,
        addToBoard,
        removeFromBoard,
        toggleBoardVisibility,
        deleteBoard,
        updateRetailers,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
