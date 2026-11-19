import { getSupabaseClient } from '../../lib/supabase'
import type { WishlistItem } from './WishlistPanel'

interface WishlistRow {
  id: string
  name: string
  price_cents: number
  added_by: string
}

function mapItem(
  row: WishlistRow,
  userId: string,
  isLeader: boolean,
): WishlistItem {
  return {
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    canManage: isLeader || row.added_by === userId,
  }
}

const ITEM_SELECT = 'id, name, price_cents, added_by'

export async function loadWishlist(
  groupId: string,
  userId: string,
  isLeader: boolean,
): Promise<WishlistItem[]> {
  const { data, error } = await getSupabaseClient()
    .from('wishlist_items')
    .select(ITEM_SELECT)
    .eq('group_id', groupId)
    .order('created_at')

  if (error) throw error

  return data.map((item) => mapItem(item, userId, isLeader))
}

export async function addWishlistItem(
  groupId: string,
  name: string,
  priceCents: number,
  userId: string,
  isLeader: boolean,
): Promise<WishlistItem> {
  const { data, error } = await getSupabaseClient()
    .from('wishlist_items')
    .insert({ group_id: groupId, name, price_cents: priceCents })
    .select(ITEM_SELECT)
    .single()

  if (error) throw error

  return mapItem(data, userId, isLeader)
}

export async function updateWishlistItem(
  itemId: string,
  name: string,
  priceCents: number,
  userId: string,
  isLeader: boolean,
): Promise<WishlistItem> {
  const { data, error } = await getSupabaseClient()
    .from('wishlist_items')
    .update({ name, price_cents: priceCents })
    .eq('id', itemId)
    .select(ITEM_SELECT)
    .single()

  if (error) throw error

  return mapItem(data, userId, isLeader)
}

export async function deleteWishlistItem(itemId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('wishlist_items')
    .delete()
    .eq('id', itemId)
    .select('id')
    .single()

  if (error) throw error
}
