import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { UserProfile, Product, WishList, WishListItem, CartItem, Page, SavedAnalysis, FaceAnalysis } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface AppState {
  currentPage: Page
  userProfile: UserProfile | null
  savedProducts: Product[]
  wishLists: WishList[]
  cart: CartItem[]
  analyses: SavedAnalysis[]
  selectedProduct: Product | null
  initialized: boolean
  dataLoading: boolean
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  const [currentPage, setCurrentPageState] = useState<Page>('landing')
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null)
  const [savedProducts, setSavedProducts] = useState<Product[]>([])
  const [wishLists, setWishLists] = useState<WishList[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)

  // Keep a ref to user so async callbacks can read current value without stale closure
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  // ─── Load / clear on auth change ────────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      setUserProfileState(null)
      setWishLists([])
      setAnalyses([])
      setSavedProducts([])
      setCart([])
      setCurrentPageState('landing')
      setInitialized(true)
      return
    }
    loadUserData(user.id)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handle extension → web-app hash saves ───────────────────────────────────

  useEffect(() => {
    if (!user) return
    const hash = window.location.hash
    if (!hash.startsWith('#atelier-save=')) return
    try {
      const encoded = hash.slice('#atelier-save='.length)
      const payload = JSON.parse(atob(encoded)) as { wishListId: string | null; item: WishListItem }
      window.history.replaceState(null, '', window.location.pathname)
      const matchId = payload.wishListId

      setWishLists((prev) => {
        const hasMatch = matchId && prev.find((l) => l.id === matchId)
        if (hasMatch) {
          return prev.map((l) =>
            l.id === matchId
              ? { ...l, items: [...l.items, payload.item], updatedAt: new Date().toISOString() }
              : l
          )
        }
        const newList: WishList = {
          id: matchId ?? crypto.randomUUID(),
          name: 'From Extension',
          isPublic: false,
          items: [payload.item],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        // Persist the new list to Supabase
        supabase.from('wish_lists').insert({
          id: newList.id, user_id: user.id, name: newList.name,
          is_public: false, created_at: newList.createdAt, updated_at: newList.updatedAt,
        }).then(() => {
          supabase.from('wish_list_items').insert({
            id: payload.item.id, wish_list_id: newList.id, user_id: user.id,
            data: payload.item, added_at: payload.item.addedAt,
          })
        })
        return [newList, ...prev]
      })
      setCurrentPageState('wishlists')
    } catch {}
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Data loading ─────────────────────────────────────────────────────────

  async function loadUserData(userId: string) {
    setDataLoading(true)
    try {
      const [profileRes, wishListsRes, analysesRes, savedRes, cartRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('wish_lists').select('*, wish_list_items(*)').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('analyses').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('saved_products').select('*').eq('user_id', userId).order('saved_at', { ascending: false }),
        supabase.from('cart_items').select('*').eq('user_id', userId),
      ])

      if (profileRes.data) {
        const p = profileRes.data
        setUserProfileState({
          id: userId,
          name: p.name || '',
          username: p.username || '',
          palette: p.palette ?? undefined,
          bodyProfile: p.body_profile ?? undefined,
          faceAnalysis: p.face_analysis ?? undefined,
          favoriteRetailers: p.favorite_retailers ?? [],
        })
        setCurrentPageState(p.palette ? 'profile' : 'onboarding')
      } else {
        setCurrentPageState('onboarding')
      }

      if (wishListsRes.data) {
        setWishLists(wishListsRes.data.map((l: any) => ({
          id: l.id, name: l.name, isPublic: l.is_public,
          items: (l.wish_list_items ?? []).map((i: any) => i.data as WishListItem),
          createdAt: l.created_at, updatedAt: l.updated_at,
        })))
      }

      if (analysesRes.data) {
        setAnalyses(analysesRes.data.map((a: any) => a.data as SavedAnalysis))
      }

      if (savedRes.data) {
        setSavedProducts(savedRes.data.map((s: any) => s.data as Product))
      }

      if (cartRes.data) {
        setCart(cartRes.data.map((c: any) => ({
          product: c.product as Product, size: c.size ?? undefined, quantity: c.quantity,
        })))
      }
    } finally {
      setDataLoading(false)
      setInitialized(true)
    }
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  const setCurrentPage = (page: Page) => setCurrentPageState(page)

  const setUserProfile = useCallback((profile: UserProfile) => {
    setUserProfileState(profile)
    const uid = userRef.current?.id
    if (!uid) return
    supabase.from('profiles').upsert({
      id: uid, name: profile.name, username: profile.username,
      palette: profile.palette ?? null, body_profile: profile.bodyProfile ?? null,
      face_analysis: profile.faceAnalysis ?? null,
      favorite_retailers: profile.favoriteRetailers ?? [],
      updated_at: new Date().toISOString(),
    })
  }, [])

  const updateRetailers = useCallback((retailers: string[]) => {
    setUserProfileState((prev) => prev ? { ...prev, favoriteRetailers: retailers } : prev)
    const uid = userRef.current?.id
    if (!uid) return
    supabase.from('profiles').update({ favorite_retailers: retailers, updated_at: new Date().toISOString() }).eq('id', uid)
  }, [])

  const saveFaceAnalysis = useCallback((analysis: FaceAnalysis) => {
    setUserProfileState((prev) => prev ? { ...prev, faceAnalysis: analysis } : prev)
    const uid = userRef.current?.id
    if (!uid) return
    supabase.from('profiles').update({ face_analysis: analysis, updated_at: new Date().toISOString() }).eq('id', uid)
  }, [])

  // ─── Saved products ───────────────────────────────────────────────────────

  const saveProduct = useCallback((product: Product) => {
    setSavedProducts((prev) => prev.find((p) => p.id === product.id) ? prev : [product, ...prev])
    const uid = userRef.current?.id
    if (!uid) return
    supabase.from('saved_products').upsert({ id: product.id, user_id: uid, data: product, saved_at: new Date().toISOString() })
  }, [])

  const unsaveProduct = useCallback((productId: string) => {
    setSavedProducts((prev) => prev.filter((p) => p.id !== productId))
    const uid = userRef.current?.id
    if (!uid) return
    supabase.from('saved_products').delete().eq('id', productId).eq('user_id', uid)
  }, [])

  const isProductSaved = useCallback(
    (productId: string) => savedProducts.some((p) => p.id === productId),
    [savedProducts]
  )

  // ─── Cart ─────────────────────────────────────────────────────────────────

  const persistCart = useCallback(async (uid: string, items: CartItem[]) => {
    await supabase.from('cart_items').delete().eq('user_id', uid)
    if (items.length > 0) {
      await supabase.from('cart_items').insert(
        items.map((item) => ({ user_id: uid, product: item.product, size: item.size ?? null, quantity: item.quantity }))
      )
    }
  }, [])

  const addToCart = useCallback((product: Product, size?: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size)
      const next = existing
        ? prev.map((i) => i.product.id === product.id && i.size === size ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { product, size, quantity: 1 }]
      const uid = userRef.current?.id
      if (uid) persistCart(uid, next)
      return next
    })
  }, [persistCart])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.product.id !== productId)
      const uid = userRef.current?.id
      if (uid) persistCart(uid, next)
      return next
    })
  }, [persistCart])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // ─── Wish lists ───────────────────────────────────────────────────────────

  const createWishList = useCallback((name: string): WishList => {
    const list: WishList = {
      id: crypto.randomUUID(), name, isPublic: false, items: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    setWishLists((prev) => [list, ...prev])
    const uid = userRef.current?.id
    if (uid) {
      supabase.from('wish_lists').insert({
        id: list.id, user_id: uid, name: list.name,
        is_public: false, created_at: list.createdAt, updated_at: list.updatedAt,
      })
    }
    return list
  }, [])

  const addToWishList = useCallback((wishListId: string, analysis: SavedAnalysis, chosenColor: WishListItem['chosenColor']) => {
    const item: WishListItem = {
      id: crypto.randomUUID(), addedAt: new Date().toISOString(), analysisId: analysis.id,
      productName: analysis.productName, productBrand: analysis.productBrand,
      productCategory: analysis.productCategory,
      productImageUrl: chosenColor?.imageUrl ?? analysis.productImageUrl,
      productPrice: analysis.productPrice, storeName: analysis.storeName,
      colorScore: chosenColor?.matchScore ?? analysis.colorScore,
      colorVerdict: chosenColor?.verdict ?? analysis.colorVerdict, chosenColor,
    }
    setWishLists((prev) =>
      prev.map((l) => l.id === wishListId ? { ...l, items: [...l.items, item], updatedAt: new Date().toISOString() } : l)
    )
    setAnalyses((prev) =>
      prev.map((a) => a.id === analysis.id ? { ...a, wishListIds: [...new Set([...(a.wishListIds ?? []), wishListId])] } : a)
    )
    const uid = userRef.current?.id
    if (uid) {
      supabase.from('wish_list_items').insert({ id: item.id, wish_list_id: wishListId, user_id: uid, data: item, added_at: item.addedAt })
      supabase.from('wish_lists').update({ updated_at: new Date().toISOString() }).eq('id', wishListId)
    }
  }, [])

  const removeFromWishList = useCallback((wishListId: string, itemId: string) => {
    setWishLists((prev) =>
      prev.map((l) => {
        if (l.id !== wishListId) return l
        const removed = l.items.find((i) => i.id === itemId)
        const newItems = l.items.filter((i) => i.id !== itemId)
        if (removed) {
          const stillInList = newItems.some((i) => i.analysisId === removed.analysisId)
          if (!stillInList) {
            setAnalyses((prev) =>
              prev.map((a) => a.id === removed.analysisId
                ? { ...a, wishListIds: (a.wishListIds ?? []).filter((id) => id !== wishListId) }
                : a)
            )
          }
        }
        return { ...l, items: newItems, updatedAt: new Date().toISOString() }
      })
    )
    const uid = userRef.current?.id
    if (uid) supabase.from('wish_list_items').delete().eq('id', itemId).eq('user_id', uid)
  }, [])

  const deleteWishList = useCallback((wishListId: string) => {
    setWishLists((prev) => {
      const list = prev.find((l) => l.id === wishListId)
      if (list) {
        const analysisIds = [...new Set(list.items.map((i) => i.analysisId))]
        setAnalyses((prev) =>
          prev.map((a) => analysisIds.includes(a.id)
            ? { ...a, wishListIds: (a.wishListIds ?? []).filter((id) => id !== wishListId) }
            : a)
        )
      }
      return prev.filter((l) => l.id !== wishListId)
    })
    const uid = userRef.current?.id
    if (uid) supabase.from('wish_lists').delete().eq('id', wishListId).eq('user_id', uid)
  }, [])

  const toggleWishListVisibility = useCallback((wishListId: string) => {
    setWishLists((prev) => prev.map((l) => {
      if (l.id !== wishListId) return l
      const next = { ...l, isPublic: !l.isPublic }
      supabase.from('wish_lists').update({ is_public: next.isPublic }).eq('id', wishListId)
      return next
    }))
  }, [])

  const renameWishList = useCallback((wishListId: string, name: string) => {
    setWishLists((prev) => prev.map((l) => l.id === wishListId ? { ...l, name } : l))
    supabase.from('wish_lists').update({ name }).eq('id', wishListId)
  }, [])

  // ─── Analyses ─────────────────────────────────────────────────────────────

  const saveAnalysis = useCallback((analysis: SavedAnalysis) => {
    setAnalyses((prev) => [analysis, ...prev])
    const uid = userRef.current?.id
    if (uid) {
      supabase.from('analyses').insert({ id: analysis.id, user_id: uid, data: analysis, created_at: analysis.savedAt })
    }
  }, [])

  const deleteAnalysis = useCallback((id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id))
    const uid = userRef.current?.id
    if (uid) supabase.from('analyses').delete().eq('id', id).eq('user_id', uid)
  }, [])

  const toggleFavoriteAnalysis = useCallback((id: string) => {
    setAnalyses((prev) => prev.map((a) => {
      if (a.id !== id) return a
      const updated = { ...a, isFavorited: !a.isFavorited }
      supabase.from('analyses').update({ data: updated }).eq('id', id)
      return updated
    }))
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentPage, userProfile, savedProducts, wishLists, cart, analyses,
        selectedProduct, initialized, dataLoading,
        setCurrentPage, setUserProfile, setSelectedProduct,
        saveProduct, unsaveProduct, isProductSaved,
        addToCart, removeFromCart, cartCount,
        createWishList, addToWishList, removeFromWishList, deleteWishList,
        toggleWishListVisibility, renameWishList,
        updateRetailers, saveAnalysis, deleteAnalysis, toggleFavoriteAnalysis, saveFaceAnalysis,
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
