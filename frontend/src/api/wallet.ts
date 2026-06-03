import client from './client'

export const walletApi = {
    getBalance: () => client.get('/wallet/balance'),
    getTransactions: (params?: { page?: number; limit?: number }) =>
        client.get('/wallet/transactions', { params }),
    getLedger: (params?: { page?: number; limit?: number }) =>
        client.get('/wallet/ledger', { params }),
}
