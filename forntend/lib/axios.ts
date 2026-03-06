import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// NOTE: backend runs on port 7000 (configured via .env) in development.
// You can override this with NEXT_PUBLIC_API_URL (e.g. for Docker or alternate host).
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api/v1',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: inject token and log (dev only)
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug('axios request', { url: config.url, baseURL: config.baseURL });
        }
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('gw_token');
            if (token) config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401, 403, 404, 500
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (typeof window === 'undefined') return Promise.reject(error);

        const status = error.response?.status;

        if (status === 401) {
            // Token expired or invalid → clear and redirect to login
            localStorage.removeItem('gw_token');
            localStorage.removeItem('gw_user');
            Cookies.remove('gw_token');
            window.location.href = '/login';
        } else if (status === 403) {
            console.error('Access forbidden');
        } else if (status === 404) {
            console.error('Resource not found');
        } else if (status === 500) {
            console.error('Server error — please try again later');
        } else if (!error.response) {
            // config may be undefined if request was never built
            console.error('Network error — server may be down', {
                url: error.config?.url ?? '<none>',
                baseURL: error.config?.baseURL ?? '<none>',
            });
        }

        return Promise.reject(error);
    }
);

export default api;

// ── Typed API helpers
export type ApiError = {
    message: string;
    status?: number;
};

export function getApiErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        return (error.response?.data as any)?.error ||
            (error.response?.data as any)?.message ||
            error.message ||
            'An unexpected error occurred';
    }
    return 'An unexpected error occurred';
}
