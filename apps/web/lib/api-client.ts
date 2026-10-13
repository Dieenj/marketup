import axios from 'axios';

export const API_BASE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  const fallback = 'http://localhost:3001/api';
  if (!envUrl) return fallback;
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
})();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm một request interceptor để đính kèm JWT token vào các headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-storage') 
        ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token 
        : null;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Lỗi kiểm tra do client chủ động ném, message viết sẵn để hiển thị cho người dùng
export class UserFacingError extends Error {}

// Lấy thông báo lỗi để hiển thị:
// - lỗi API: `message` từ NestJS (chuỗi hoặc mảng); lỗi mạng của axios không có message dễ hiểu → fallback
// - UserFacingError (vd. biến thể thiếu giá) → dùng chính message đó
// - lỗi khác (bug lập trình) → fallback, không lộ message kỹ thuật
export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message) && message.length > 0) return message.join(', ');
    if (typeof message === 'string' && message) return message;
    return fallback;
  }
  if (error instanceof UserFacingError) return error.message;
  return fallback;
}

// Mã HTTP của lỗi API (undefined nếu là lỗi mạng / timeout)
export function getErrorStatus(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export default api;
