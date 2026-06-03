import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { AxiosError } from 'axios'

export interface AuthUser {
    id: string
    name: string
    email: string
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<AuthUser | null>(
        JSON.parse(localStorage.getItem('dezpay_user') ?? 'null')
    )
    const token = ref<string | null>(localStorage.getItem('dezpay_token'))
    const isAdmin = ref(false)

    const isAuthenticated = computed(() => !!token.value)
    const hasPin = ref<boolean>(false)

    async function login(email: string, password: string) {
        const res = await authApi.login({ email, password })
        const { user: userData, token: jwt } = res.data.data
        user.value = userData
        token.value = jwt
        localStorage.setItem('dezpay_token', jwt)
        localStorage.setItem('dezpay_user', JSON.stringify(userData))
        isAdmin.value = false
    }

    async function register(name: string, email: string, password: string) {
        const res = await authApi.register({ name, email, password })
        const { user: userData, token: jwt } = res.data.data
        user.value = userData
        token.value = jwt
        localStorage.setItem('dezpay_token', jwt)
        localStorage.setItem('dezpay_user', JSON.stringify(userData))
    }

    async function logout() {
        try { await authApi.logout() } catch { /* ignore */ }
        user.value = null
        token.value = null
        hasPin.value = false
        localStorage.removeItem('dezpay_token')
        localStorage.removeItem('dezpay_user')
    }

    function setHasPin(value: boolean) {
        hasPin.value = value
    }

    return { user, token, isAuthenticated, isAdmin, hasPin, login, register, logout, setHasPin }
})

export const useAdminAuthStore = defineStore('adminAuth', () => {
    const admin = ref<{ id: string; name: string; email: string; role: string } | null>(
        JSON.parse(localStorage.getItem('dezpay_admin') ?? 'null')
    )
    const token = ref<string | null>(localStorage.getItem('dezpay_admin_token'))
    const isAuthenticated = computed(() => !!token.value)

    async function login(email: string, password: string) {
        const res = await authApi.login({ email, password })
        // Admin login uses /admin/login endpoint via adminApi
        const { admin: adminData, token: jwt } = res.data.data
        admin.value = adminData
        token.value = jwt
        localStorage.setItem('dezpay_admin_token', jwt)
        localStorage.setItem('dezpay_admin', JSON.stringify(adminData))
    }

    async function logout() {
        admin.value = null
        token.value = null
        localStorage.removeItem('dezpay_admin_token')
        localStorage.removeItem('dezpay_admin')
    }

    return { admin, token, isAuthenticated, login, logout }
})
