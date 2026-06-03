import { describe, it, expect } from 'vitest'

// Simple utility tests for common operations
describe('Common Utilities', () => {
    describe('Currency Formatting', () => {
        const formatCurrency = (amount: number): string => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(amount)
        }

        it('should format currency correctly', () => {
            expect(formatCurrency(10000)).toContain('Rp')
            expect(formatCurrency(1000000)).toContain('Rp')
        })

        it('should handle zero amount', () => {
            const result = formatCurrency(0)
            expect(result).toContain('Rp')
            expect(result).toContain('0')
        })

        it('should format large numbers', () => {
            const result = formatCurrency(10000000)
            expect(result).toContain('Rp')
        })
    })

    describe('Date Formatting', () => {
        const formatDate = (date: Date): string => {
            return new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(date)
        }

        it('should format date correctly', () => {
            const date = new Date('2024-06-03T14:30:00')
            const result = formatDate(date)
            expect(result).toBeTruthy()
            expect(result.length).toBeGreaterThan(0)
        })

        it('should handle different dates', () => {
            const date1 = new Date('2024-01-15')
            const date2 = new Date('2024-12-25')
            const result1 = formatDate(date1)
            const result2 = formatDate(date2)
            
            expect(result1).not.toBe(result2)
        })
    })

    describe('Validation Helpers', () => {
        const isValidPhoneNumber = (phone: string): boolean => {
            // Remove non-digit characters, then check
            const digits = phone.replace(/\D/g, '')
            // Must be 10-13 digits (for Indonesian numbers)
            return /^\d{10,13}$/.test(digits)
        }

        const isValidUsername = (username: string): boolean => {
            return /^[a-zA-Z0-9_]{3,20}$/.test(username)
        }

        it('should validate Indonesian phone numbers', () => {
            expect(isValidPhoneNumber('081234567890')).toBe(true)
            expect(isValidPhoneNumber('+6281234567890')).toBe(true)
            expect(isValidPhoneNumber('08123')).toBe(false)
            expect(isValidPhoneNumber('08-1234-567890')).toBe(true)
        })

        it('should validate usernames', () => {
            expect(isValidUsername('john_doe')).toBe(true)
            expect(isValidUsername('user123')).toBe(true)
            expect(isValidUsername('ab')).toBe(false)
            expect(isValidUsername('user@name')).toBe(false)
        })
    })

    describe('Array & Object Helpers', () => {
        const groupBy = <T, K extends PropertyKey>(
            array: T[],
            getKey: (item: T) => K
        ): Record<K, T[]> => {
            return array.reduce((result, item) => {
                const key = getKey(item)
                if (!result[key]) {
                    result[key] = []
                }
                result[key].push(item)
                return result
            }, {} as Record<K, T[]>)
        }

        it('should group array by key', () => {
            const items = [
                { id: 1, category: 'A' },
                { id: 2, category: 'B' },
                { id: 3, category: 'A' },
            ]

            const grouped = groupBy(items, (item) => item.category)

            expect(Object.keys(grouped)).toHaveLength(2)
            expect(grouped['A']).toHaveLength(2)
            expect(grouped['B']).toHaveLength(1)
        })
    })
})
