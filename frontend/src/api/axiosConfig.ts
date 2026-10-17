import axios from 'axios';
import { getFeedbackBridge } from '../utils/feedbackBridge';

import { API_BASE_URL } from './apiBase';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];
let pendingMutations = 0;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const isMutation = (method?: string) => {
  const m = (method || 'get').toLowerCase();
  return m === 'post' || m === 'put' || m === 'patch' || m === 'delete';
};

const skipGlobalLoader = (url?: string) => {
  if (!url) return false;
  return url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/public/campaign') || url.includes('/public/forms');
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('btn-token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (isMutation(config.method) && !skipGlobalLoader(config.url) && !(config as any)._skipFeedback) {
      pendingMutations += 1;
      if (pendingMutations === 1) {
        getFeedbackBridge()?.startLoading('Saving…');
      }
      (config as any)._feedbackTracked = true;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const endMutationFeedback = (config?: any) => {
  if (config?._feedbackTracked) {
    pendingMutations = Math.max(0, pendingMutations - 1);
    if (pendingMutations === 0) {
      getFeedbackBridge()?.stopLoading();
    }
  }
};

axiosInstance.interceptors.response.use(
  (response) => {
    endMutationFeedback(response.config);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    endMutationFeedback(originalRequest);

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/public/campaign')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('btn-refresh-token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem('btn-token', accessToken);
          localStorage.setItem('btn-refresh-token', newRefreshToken);

          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          processQueue(null, accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
        throw new Error('Refresh failed');
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
