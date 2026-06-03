import { adminClient, userClient } from './client'

export const adminApi = {
    // Login pakai userClient (belum ada token saat login)
    login: (data: { email: string; password: string }) =>
        userClient.post('/admin/login', data),

    // Semua endpoint admin pakai adminClient
    listUsers: (params?: { search?: string; page?: number; limit?: number }) =>
        adminClient.get('/admin/users', { params }),
    getUserDetail: (id: string) =>
        adminClient.get(`/admin/users/${id}`),
    freezeAccount: (id: string) =>
        adminClient.put(`/admin/users/${id}/freeze`),
    unfreezeAccount: (id: string) =>
        adminClient.put(`/admin/users/${id}/unfreeze`),
    listTransactions: (params?: Record<string, unknown>) =>
        adminClient.get('/admin/transactions', { params }),
    getTransactionDetail: (id: string) =>
        adminClient.get(`/admin/transactions/${id}`),
    getStats: () =>
        adminClient.get('/admin/stats'),
    getAuditLogs: (params?: Record<string, unknown>) =>
        adminClient.get('/admin/audit-logs', { params }),

    // Top up approval — pakai adminClient juga
    getPendingTopUps: (params?: { page?: number; limit?: number }) =>
        adminClient.get('/topups/pending', { params }),
    approveTopUp: (id: string) =>
        adminClient.put(`/topups/${id}/approve`),
    rejectTopUp: (id: string, reason: string) =>
        adminClient.put(`/topups/${id}/reject`, { reason }),
}

export const adminNotifApi = {
    sendNotification: (data: { userId?: string; title: string; message: string; broadcast?: boolean }) =>
        adminClient.post('/admin/notifications', data),
}
