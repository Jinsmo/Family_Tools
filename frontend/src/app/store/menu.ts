import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '../request';

export interface MenuItemSpec {
  name: string;
  options: string[];
  is_multiple: number;
}

export interface MenuItem {
  id: number;
  name: string;
  image_url: string;
  price_points: number;
  description: string;
  specs: MenuItemSpec[];
  sales?: number; // Monthly sales mock
}

export interface MenuCategory {
  id: number;
  name: string;
  items: MenuItem[];
}

export interface CartItem {
  itemId: number;
  name: string;
  image_url: string;
  price_points: number;
  quantity: number;
  selectedSpecs: Record<string, string | string[]>; // e.g. { "辣度": "微辣", "加料": ["珍珠", "椰果"] }
  specKey: string; // Unique key for this item+spec combo
}

export interface ItemDetail {
  id: number;
  item_id: number;
  ingredients: { name: string; amount: string }[];
  recipe_steps: string;
  tips: string;
}

export const useMenuStore = defineStore('menu', () => {
  const categories = ref<MenuCategory[]>([]);
  const cart = ref<CartItem[]>([]);
  const isLoading = ref(false);
  const searchValue = ref('');
  const itemDetails = ref<Record<number, ItemDetail>>({}); // Cache details by item ID

  // Computed
  const filteredCategories = computed(() => {
    if (!searchValue.value) return categories.value;
    
    // Deep filter
    return categories.value.map(cat => ({
      ...cat,
      items: cat.items.filter(item => 
        item.name.includes(searchValue.value) || 
        item.description?.includes(searchValue.value)
      )
    })).filter(cat => cat.items.length > 0);
  });

  const totalPoints = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.price_points * item.quantity, 0);
  });

  const totalCount = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.quantity, 0);
  });

  // Actions
  const setSearch = (val: string) => {
    searchValue.value = val;
  };
  
  const fetchMenu = async () => {
    isLoading.value = true;
    try {
      const res = await request.get('/api/menu/list');
      categories.value = res as any; // Type assertion needed because response interceptor returns data directly
    } catch (error) {
      console.error('Failed to fetch menu', error);
    } finally {
      isLoading.value = false;
    }
  };

  const fetchItemDetails = async (itemId: number) => {
    if (itemDetails.value[itemId]) return itemDetails.value[itemId]; // Return cached if exists

    try {
      const res = await request.get(`/api/menu/item/${itemId}/details`);
      if (res) {
        itemDetails.value[itemId] = res as unknown as ItemDetail;
        return itemDetails.value[itemId];
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch item details', error);
      return null;
    }
  };

  const addToCart = (item: MenuItem, specs: Record<string, string | string[]> = {}) => {
    // Generate a unique key based on item ID and selected specs
    // Sort keys and values (if array) to ensure consistent key generation
    const sortedSpecs: any = {};
    Object.keys(specs).sort().forEach(k => {
      const val = specs[k];
      if (Array.isArray(val)) {
        sortedSpecs[k] = [...val].sort();
      } else {
        sortedSpecs[k] = val;
      }
    });

    const specKey = `${item.id}-${JSON.stringify(sortedSpecs)}`;
    
    const existingItem = cart.value.find(i => i.specKey === specKey);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.value.push({
        itemId: item.id,
        name: item.name,
        image_url: item.image_url,
        price_points: item.price_points,
        quantity: 1,
        selectedSpecs: specs,
        specKey
      });
    }
  };

  const removeFromCart = (specKey: string) => {
    const index = cart.value.findIndex(i => i.specKey === specKey);
    if (index > -1) {
      const item = cart.value[index];
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        cart.value.splice(index, 1);
      }
    }
  };
  
  const clearCart = () => {
    cart.value = [];
  };

  const placeOrder = async (orderData: any) => {
    isLoading.value = true;
    try {
      await request.post('/api/menu/order', orderData);
      clearCart();
      return true;
    } catch (error) {
      console.error('Order failed', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    categories,
    filteredCategories,
    cart,
    isLoading,
    totalPoints,
    totalCount,
    searchValue,
    itemDetails,
    setSearch,
    fetchMenu,
    fetchItemDetails,
    addToCart,
    removeFromCart,
    clearCart,
    placeOrder
  };
});
