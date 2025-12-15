import axios from 'axios';
import { useMessageStore } from './store/message';

const request = axios.create({
  baseURL: '/',
  timeout: 10000,
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = useMessageStore();
    if (error.response) {
      const { data } = error.response;
      msg.show(data.error || '请求失败', 'error');
    } else {
      msg.show('网络错误，请稍后重试', 'error');
    }
    return Promise.reject(error);
  }
);

export default request;
