import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationApi } from '@/api/notification'

export interface Notification {
    id: string
    type: string
    payload: Record<string, unknown>
    is_read: boolean
    created_at: string
}

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<Notification[]>([])
    const total = ref(0)

    const unreadCount = computed(() =>
        notifications.value.filter(n => !n.is_read).length
    )

    async function fetchNotifications(page = 1, limit = 20) {
        const res = await notificationApi.getNotifications({ page, limit })
        notifications.value = res.data.data.notifications
        total.value = res.data.data.pagination.total
    }

    async function markAsRead(id: string) {
        await notificationApi.markAsRead(id)
        const n = notifications.value.find(n => n.id === id)
        if (n) n.is_read = true
    }

    async function markAllAsRead() {
        await notificationApi.markAllAsRead()
        notifications.value.forEach(n => { n.is_read = true })
    }

    return { notifications, total, unreadCount, fetchNotifications, markAsRead, markAllAsRead }
})
