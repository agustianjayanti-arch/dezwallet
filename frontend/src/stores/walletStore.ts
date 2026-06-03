import { defineStore } from 'pinia'
import { ref } from 'vue'
import { walletApi } from '@/api/wallet'

export interface Transaction {
    id: string
    type: string
    status: string
    amount: string
    notes: string | null
    created_at: string
}

export interface PaginationMeta {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

export const useWalletStore = defineStore('wallet', () => {
    const balance = ref<number>(0)
    const currency = ref<string>('IDR')
    const transactions = ref<Transaction[]>([])
    const pagination = ref<PaginationMeta | null>(null)
    const loading = ref(false)

    async function fetchBalance() {
        loading.value = true
        try {
            const res = await walletApi.getBalance()
            balance.value = res.data.data.balance
            currency.value = res.data.data.currency
        } finally {
            loading.value = false
        }
    }

    async function fetchTransactions(page = 1, limit = 20) {
        const res = await walletApi.getTransactions({ page, limit })
        transactions.value = res.data.data.transactions
        pagination.value = res.data.data.pagination
    }

    return { balance, currency, transactions, pagination, loading, fetchBalance, fetchTransactions }
})
