import client from './client'

export interface RegisterPayload { name: string; email: string; password: string }
export interface LoginPayload { email: string; password: string }

export const authApi = {
    register: (data: RegisterPayload) => client.post('/auth/register', data),
    login: (data: LoginPayload) => client.post('/auth/login', data),
    logout: () => client.post('/auth/logout'),
    changePassword: (data: { oldPassword: string; newPassword: string }) =>
        client.put('/auth/password', data),
    createPin: (data: { pin: string }) => client.post('/auth/pin', data),
    changePin: (data: { oldPin: string; newPin: string; password: string }) =>
        client.put('/auth/pin', data),
}
