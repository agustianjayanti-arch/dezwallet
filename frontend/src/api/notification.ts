import client from './client'

export const notificationApi = {
    getNotifications: (params?: { page?: number; limit?: number }) =>
        client.get('/notifications', { params }),
    markAsRead: (id: string) => client.put(`/notifications/${id}/read`),
    markAllAsRead: () => client.put('/notifications/read-all'),
}
