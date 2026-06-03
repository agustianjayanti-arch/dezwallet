import client from './client'

export const topupApi = {
    submitTopUp: (data: { amount: number; proofUrl?: string }) =>
        client.post('/topups', data),
    getTopUpHistory: (params?: { page?: number; limit?: number }) =>
        client.get('/topups', { params }),
    // Admin
    getPendingTopUps: (params?: { page?: number; limit?: number }) =>
        client.get('/topups/pending', { params }),
    approveTopUp: (id: string) => client.put(`/topups/${id}/approve`),
    rejectTopUp: (id: string, reason: string) =>
        client.put(`/topups/${id}/reject`, { reason }),
}
