import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../stores/authStore'

describe('Auth Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        localStorage.clear()
    })

    it('should initialize with default state', () => {
        const store = useAuthStore()
        
        expect(store.user).toBeNull()
        expect(store.token).toBeNull()
        expect(store.isAuthenticated).toBe(false)
        expect(store.isAdmin).toBe(false)
    })

    it('should track has pin state', () => {
        const store = useAuthStore()
        
        expect(store.hasPin).toBe(false)
        store.setHasPin(true)
        expect(store.hasPin).toBe(true)
    })

    it('should clear user and token on logout', async () => {
        const store = useAuthStore()
        // Directly set state for testing (simulating a logged-in state)
        store.user = { id: '1', email: 'test@example.com', name: 'Test User' }
        store.token = 'test-token'

        expect(store.isAuthenticated).toBe(true)

        // Call actual logout (it makes an API call but doesn't matter for this test)
        // We just verify the state is cleared
        await store.logout()

        expect(store.user).toBeNull()
        expect(store.token).toBeNull()
        expect(store.isAuthenticated).toBe(false)
    })

    it('should initialize from localStorage if present', () => {
        const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
        localStorage.setItem('dezpay_token', 'test-token-123')
        localStorage.setItem('dezpay_user', JSON.stringify(mockUser))

        const store = useAuthStore()

        expect(store.token).toBe('test-token-123')
        expect(store.user).toEqual(mockUser)
        expect(store.isAuthenticated).toBe(true)
    })
})
