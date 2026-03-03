import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api/v1',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: inject token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
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
            window.location.href = '/login';
        } else if (status === 403) {
            console.error('Access forbidden');
        } else if (status === 404) {
            console.error('Resource not found');
        } else if (status === 500) {
            console.error('Server error — please try again later');
        } else if (!error.response) {
            console.error('Network error — server may be down');
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
