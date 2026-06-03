import axios from 'axios'
import type { AxiosInstance } from 'axios'

function createClient(tokenKey: string, redirectPath: string): AxiosInstance {
    const instance = axios.create({
        baseURL: '/api',
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
    })

    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem(tokenKey)
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
    })

    instance.interceptors.response.use(
        (res) => res,
        (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem(tokenKey)
                window.location.href = redirectPath
            }
            return Promise.reject(error)
        }
    )

    return instance
}

// Client untuk user biasa
export const userClient = createClient('dezpay_token', '/login')

// Client untuk admin
export const adminClient = createClient('dezpay_admin_token', '/admin/login')

// Default export = user client (backward compat)
export default userClient
