import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { UserProfile, Product, WishList, WishListItem, CartItem, Page, SavedAnalysis, FaceAnalysis } from '../types'

interface AppState {
  currentPage: Page
  userProfile: UserProfile | null
  savedProducts: Product[]
  wishLists: WishList[]
  cart: CartItem[]
  analyses: SavedAnalysis[]
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
  createWishList: (name: string) => WishList
  addToWishList: (wishListId: string, analysis: SavedAnalysis, chosenColor: WishListItem['chosenColor']) => void
  removeFromWishList: (wishListId: string, itemId: string) => void
  deleteWishList: (wishListId: string) => void
  toggleWishListVisibility: (wishListId: string) => void
  renameWishList: (wishListId: string, name: string) => void
  updateRetailers: (retailers: string[]) => void
  saveAnalysis: (analysis: SavedAnalysis) => void
  deleteAnalysis: (id: string) => void
  toggleFavoriteAnalysis: (id: string) => void
  saveFaceAnalysis: (analysis: FaceAnalysis) => void
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
  const [wishLists, setWishLists] = useState<WishList[]>(() => load('atelier_wishlists', []))
  const [cart, setCart] = useState<CartItem[]>(() => load('atelier_cart', []))
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>(() => load('atelier_analyses', []))
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => { save('atelier_profile', userProfile) }, [userProfile])
  useEffect(() => { save('atelier_saved', savedProducts) }, [savedProducts])
  useEffect(() => { save('atelier_wishlists', wishLists) }, [wishLists])
  useEffect(() => { save('atelier_cart', cart) }, [cart])
  useEffect(() => { save('atelier_analyses', analyses) }, [analyses])

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

  const createWishList = useCallback((name: string): WishList => {
    const list: WishList = {
      id: crypto.randomUUID(),
      name,
      isPublic: false,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setWishLists((prev) => [list, ...prev])
    return list
  }, [])

  const addToWishList = useCallback((wishListId: string, analysis: SavedAnalysis, chosenColor: WishListItem['chosenColor']) => {
    const item: WishListItem = {
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
      analysisId: analysis.id,
      productName: analysis.productName,
      productBrand: analysis.productBrand,
      productCategory: analysis.productCategory,
      productImageUrl: chosenColor?.imageUrl ?? analysis.productImageUrl,
      productPrice: analysis.productPrice,
      storeName: analysis.storeName,
      colorScore: chosenColor?.matchScore ?? analysis.colorScore,
      colorVerdict: chosenColor?.verdict ?? analysis.colorVerdict,
      chosenColor,
    }
    setWishLists((prev) =>
      prev.map((l) =>
        l.id === wishListId
          ? { ...l, items: [...l.items, item], updatedAt: new Date().toISOString() }
          : l
      )
    )
    setAnalyses((prev) =>
      prev.map((a) =>
        a.id === analysis.id
          ? { ...a, wishListIds: [...new Set([...(a.wishListIds ?? []), wishListId])] }
          : a
      )
    )
  }, [])

  const removeFromWishList = useCallback((wishListId: string, itemId: string) => {
    setWishLists((prev) =>
      prev.map((l) => {
        if (l.id !== wishListId) return l
        const removed = l.items.find((i) => i.id === itemId)
        const newItems = l.items.filter((i) => i.id !== itemId)
        // If no more items from this analysis in this list, remove wishListId from analysis
        if (removed) {
          const stillInList = newItems.some((i) => i.analysisId === removed.analysisId)
          if (!stillInList) {
            setAnalyses((prev) =>
              prev.map((a) =>
                a.id === removed.analysisId
                  ? { ...a, wishListIds: (a.wishListIds ?? []).filter((id) => id !== wishListId) }
                  : a
              )
            )
          }
        }
        return { ...l, items: newItems, updatedAt: new Date().toISOString() }
      })
    )
  }, [])

  const deleteWishList = useCallback((wishListId: string) => {
    setWishLists((prev) => {
      const list = prev.find((l) => l.id === wishListId)
      if (list) {
        const analysisIds = [...new Set(list.items.map((i) => i.analysisId))]
        setAnalyses((prev) =>
          prev.map((a) =>
            analysisIds.includes(a.id)
              ? { ...a, wishListIds: (a.wishListIds ?? []).filter((id) => id !== wishListId) }
              : a
          )
        )
      }
      return prev.filter((l) => l.id !== wishListId)
    })
  }, [])

  const toggleWishListVisibility = useCallback((wishListId: string) => {
    setWishLists((prev) =>
      prev.map((l) => (l.id === wishListId ? { ...l, isPublic: !l.isPublic } : l))
    )
  }, [])

  const renameWishList = useCallback((wishListId: string, name: string) => {
    setWishLists((prev) =>
      prev.map((l) => (l.id === wishListId ? { ...l, name } : l))
    )
  }, [])

  const updateRetailers = useCallback((retailers: string[]) => {
    setUserProfileState((prev) => {
      if (!prev) return prev
      return { ...prev, favoriteRetailers: retailers }
    })
  }, [])

  const saveAnalysis = useCallback((analysis: SavedAnalysis) => {
    setAnalyses((prev) => [analysis, ...prev])
  }, [])

  const deleteAnalysis = useCallback((id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const toggleFavoriteAnalysis = useCallback((id: string) => {
    setAnalyses((prev) => prev.map((a) => a.id === id ? { ...a, isFavorited: !a.isFavorited } : a))
  }, [])

  const saveFaceAnalysis = useCallback((analysis: FaceAnalysis) => {
    setUserProfileState((prev) => {
      if (!prev) return prev
      return { ...prev, faceAnalysis: analysis }
    })
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentPage,
        userProfile,
        savedProducts,
        wishLists,
        cart,
        analyses,
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
        createWishList,
        addToWishList,
        removeFromWishList,
        deleteWishList,
        toggleWishListVisibility,
        renameWishList,
        updateRetailers,
        saveAnalysis,
        deleteAnalysis,
        toggleFavoriteAnalysis,
        saveFaceAnalysis,
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
