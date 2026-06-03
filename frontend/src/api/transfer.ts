import client from './client'

export const transferApi = {
    initiateTransfer: (data: { receiverId: string; amount: number; pin: string }) =>
        client.post('/transfers', data),
    getTransferStatus: (id: string) => client.get(`/transfers/${id}`),
    getTransferHistory: (params?: { page?: number; limit?: number }) =>
        client.get('/transfers', { params }),
}
