import request from '../app/request';

export interface Category {
  id: number;
  name: string;
  icon?: string;
  sort_order: number;
  created_at?: string;
}

export interface Entry {
  id: number;
  category_id?: number;
  title: string;
  account: string;
  url?: string;
  remark?: string;
  is_favorite: number;
  created_at?: string;
  // password is not returned in list
}

export const getCategories = () => request.get<any, Category[]>('/api/password/categories');
export const createCategory = (data: Partial<Category>) => request.post<any, any>('/api/password/categories', data);
export const updateCategory = (id: number, data: Partial<Category>) => request.put<any, any>(`/api/password/categories/${id}`, data);
export const deleteCategory = (id: number) => request.delete<any, any>(`/api/password/categories/${id}`);

export const getEntries = (params?: { category_id?: number; is_favorite?: boolean; keyword?: string }) => request.get<any, Entry[]>('/api/password/entries', { params });
export const createEntry = (data: any) => request.post<any, any>('/api/password/entries', data);
export const updateEntry = (id: number, data: any) => request.put<any, any>(`/api/password/entries/${id}`, data);
export const deleteEntry = (id: number) => request.delete<any, any>(`/api/password/entries/${id}`);
export const getEntryPassword = (id: number) => request.get<any, { password: string }>(`/api/password/entries/${id}/password`);
