import { defineStore } from 'pinia';
import request from '../request';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    loading: false,
  }),
  actions: {
    async login(data: any) {
      this.loading = true;
      try {
        const res: any = await request.post('/auth/login', data);
        this.token = res.token;
        this.user = res.user;
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        return true;
      } catch (e) {
        return false;
      } finally {
        this.loading = false;
      }
    },
    async register(data: any) {
      this.loading = true;
      try {
        await request.post('/auth/register', data);
        return true;
      } catch (e) {
        return false;
      } finally {
        this.loading = false;
      }
    },
    async resetPassword(data: any) {
      this.loading = true;
      try {
        await request.post('/auth/reset-password', data);
        return true;
      } catch (e) {
        return false;
      } finally {
        this.loading = false;
      }
    },
    async fetchProfile() {
      if (!this.token) return;
      this.loading = true;
      try {
        const res: any = await request.get('/auth/me');
        this.user = res.user;
        localStorage.setItem('user', JSON.stringify(res.user));
      } catch (e: any) {
        console.error('Failed to fetch profile', e);
        // Handle 401 (Unauthorized), 403 (Forbidden), 404 (User Not Found)
        if (e.response && [401, 403, 404].includes(e.response.status)) {
          this.logout();
        }
      } finally {
        this.loading = false;
      }
    },
    async updateProfile(data: any) {
      this.loading = true;
      try {
        await request.put('/auth/me', data);
        await this.fetchProfile();
        return true;
      } catch (e) {
        return false;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.href = '/login';
    }
  }
});
