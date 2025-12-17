import request from '../app/request';

export interface WishlistItem {
  id: number;
  user_id: number;
  name: string;
  type: 'food' | 'shop' | 'travel' | 'goods' | 'other';
  location?: string;
  remark?: string;
  is_completed: number; // 0 或 1
  created_at: string;
  user_nickname?: string;
  user_avatar?: string;
}

export const getWishlist = () => {
  return request.get<WishlistItem[]>('/api/wishlist');
};

export const getWishlistItem = (id: number) => {
  return request.get<WishlistItem>(`/api/wishlist/${id}`);
};

export const createWishlist = (data: {
  name: string;
  type: string;
  location?: string;
  remark?: string;
}) => {
  return request.post('/api/wishlist', data);
};

export const updateWishlist = (
  id: number,
  data: {
    name: string;
    type: string;
    location?: string;
    remark?: string;
    is_completed: number;
  }
) => {
  return request.put(`/api/wishlist/${id}`, data);
};

export const deleteWishlist = (id: number) => {
  return request.delete(`/api/wishlist/${id}`);
};
