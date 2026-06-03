import client from './client'

export const qrApi = {
    generateQRCode: (data: { amount: number }) => client.post('/qr/generate', data),
    processQRPayment: (data: { qrToken: string; pin: string }) =>
        client.post('/qr/pay', data),
    getQRStatus: (token: string) => client.get(`/qr/${token}/status`),
}
