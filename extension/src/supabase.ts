/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

export interface WishListRow {
  id: string
  name: string
  is_public: boolean
  items: WishListItemData[]
}

export interface WishListItemData {
  id: string
  addedAt: string
  analysisId: string
  productName: string
  productBrand: string
  productCategory: string
  productImageUrl: string | null
  productPrice: number | null
  storeName: string
  colorScore: number
  colorVerdict: string
  chosenColor: {
    name: string; hex: string; url: string | null
    imageUrl: string | null; matchScore: number; verdict: string
  } | null
}

export async function fetchWishLists(): Promise<WishListRow[]> {
  const { data } = await supabase
    .from('wish_lists')
    .select('id, name, is_public, wish_list_items(data)')
    .order('created_at', { ascending: false })
  if (!data) return []
  return data.map((l: any) => ({
    id: l.id,
    name: l.name,
    is_public: l.is_public,
    items: (l.wish_list_items ?? []).map((i: any) => i.data as WishListItemData),
  }))
}

export async function createWishList(name: string): Promise<WishListRow | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const { error } = await supabase.from('wish_lists').insert({
    id, user_id: user.id, name, is_public: false, created_at: now, updated_at: now,
  })
  if (error) return null
  return { id, name, is_public: false, items: [] }
}

export async function saveItemToWishList(wishListId: string, item: WishListItemData): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { error } = await supabase.from('wish_list_items').insert({
    id: item.id, wish_list_id: wishListId, user_id: user.id,
    data: item, added_at: item.addedAt,
  })
  if (!error) {
    await supabase.from('wish_lists').update({ updated_at: new Date().toISOString() }).eq('id', wishListId)
  }
  return !error
}
