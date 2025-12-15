import { defineStore } from 'pinia';
import request from '../request';
import { useMessageStore } from './message';

export const useFamilyStore = defineStore('family', {
  state: () => ({
    list: [] as any[],
    loading: false,
  }),
  actions: {
    async fetchFamilyList() {
      this.loading = true;
      const messageStore = useMessageStore();
      try {
        const res: any = await request.get('/api/family');
        // console.log('Family list response:', res); // Debug log
        
        // 兼容不同的后端返回格式
        // 1. 直接返回数组: [{}, {}]
        // 2. 包装在对象中: { data: [{}, {}] }
        // 3. 包装在对象中且有 success 字段: { success: true, data: [{}, {}] }
        // 4. 包装在对象中且有 list 字段: { list: [{}, {}] }
        
        let listData = [];
        
        if (Array.isArray(res)) {
          listData = res;
        } else if (res && Array.isArray(res.data)) {
          listData = res.data;
        } else if (res && Array.isArray(res.list)) {
          listData = res.list;
        } else {
           // 尝试解析可能的结构
           console.error('Family list data format error:', res);
           this.list = [];
           // 如果数据实际上是空的或者某种特殊成功状态，不应该报错
           // 这里我们放宽一点，如果实在解析不出数组，就默认空数组，但记录错误
           // messageStore.show('获取家人列表数据格式错误', 'error');
           return;
        }
        
        this.list = listData;

      } catch (e) {
        console.error('Failed to fetch family list', e);
        this.list = [];
        // Error message is already handled by request interceptor usually, 
        // but we can add specific one here if needed or rely on interceptor.
        // If interceptor shows error, we might not need to show another one here 
        // unless we want to be specific about the context.
        // messageStore.show('获取家人列表失败，请检查网络', 'error'); 
      } finally {
        this.loading = false;
      }
    },
    async updateCustomCall(relatedUserId: number, customCall: string) {
      try {
        await request.post('/api/family/custom-call', {
          relatedUserId,
          customCall
        });
        // 更新成功后刷新列表
        await this.fetchFamilyList();
        return true;
      } catch (e) {
        console.error('Failed to update custom call', e);
        return false;
      }
    },
    async searchUser(keyword: string) {
      try {
        const res: any = await request.get('/api/family/search', { params: { keyword } });
        return res;
      } catch (e) {
        console.error('Failed to search user', e);
        return [];
      }
    },
    async addRelation(relatedUserId: number, relationType: string) {
      try {
        await request.post('/api/family/relation', {
          relatedUserId,
          relationType
        });
        await this.fetchFamilyList();
        return true;
      } catch (e) {
        console.error('Failed to add relation', e);
        return false;
      }
    }
  }
});
