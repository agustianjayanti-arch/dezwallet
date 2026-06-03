import client from './client'

export const requestApi = {
    createMoneyRequest: (data: { targetId: string; amount: number; notes?: string }) =>
        client.post('/requests', data),
    getMoneyRequests: (params?: { type?: 'sent' | 'received' | 'all'; page?: number; limit?: number }) =>
        client.get('/requests', { params }),
    approveMoneyRequest: (id: string, pin: string) =>
        client.put(`/requests/${id}/approve`, { pin }),
    rejectMoneyRequest: (id: string) => client.put(`/requests/${id}/reject`),
}
