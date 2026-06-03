import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // ── Auth ──────────────────────────────────────────────────────────────────
        { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
        { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
        { path: '/create-pin', name: 'CreatePin', component: () => import('@/views/CreatePinView.vue'), meta: { requiresAuth: true } },

        // ── User App ──────────────────────────────────────────────────────────────
        {
            path: '/',
            component: () => import('@/components/layout/AppLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                { path: '', redirect: '/dashboard' },
                { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },
                { path: 'wallet', name: 'Wallet', component: () => import('@/views/WalletView.vue') },
                { path: 'transfer', name: 'Transfer', component: () => import('@/views/TransferView.vue') },
                { path: 'topup', name: 'TopUp', component: () => import('@/views/TopUpView.vue') },
                { path: 'qr', name: 'QR', component: () => import('@/views/QRView.vue') },
                { path: 'requests', name: 'Requests', component: () => import('@/views/RequestView.vue') },
                { path: 'notifications', name: 'Notifications', component: () => import('@/views/NotificationView.vue') },
                { path: 'profile', name: 'Profile', component: () => import('@/views/ProfileView.vue') },
                { path: 'profile/info', name: 'ProfileInfo', component: () => import('@/views/ProfileInfoView.vue') },
                { path: 'profile/security', name: 'ProfileSecurity', component: () => import('@/views/ProfileSecurityView.vue') },
                { path: 'profile/statement', name: 'ProfileStatement', component: () => import('@/views/ProfileStatementView.vue') },
                { path: 'profile/settings', name: 'ProfileSettings', component: () => import('@/views/ProfileSettingsView.vue') },
            ]
        },

        // ── Admin ─────────────────────────────────────────────────────────────────
        { path: '/admin/login', name: 'AdminLogin', component: () => import('@/views/admin/AdminLoginView.vue'), meta: { guest: true } },
        {
            path: '/admin',
            component: () => import('@/components/layout/AdminLayout.vue'),
            meta: { requiresAdmin: true },
            children: [
                { path: '', redirect: '/admin/dashboard' },
                { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/AdminDashboardView.vue') },
                { path: 'users', name: 'AdminUsers', component: () => import('@/views/admin/AdminUsersView.vue') },
                { path: 'users/:id', name: 'AdminUserDetail', component: () => import('@/views/admin/AdminUserDetailView.vue') },
                { path: 'transactions', name: 'AdminTransactions', component: () => import('@/views/admin/AdminTransactionsView.vue') },
                { path: 'transactions/:id', name: 'AdminTransactionDetail', component: () => import('@/views/admin/AdminTransactionDetailView.vue') },
                { path: 'topups', name: 'AdminTopUps', component: () => import('@/views/admin/AdminTopUpsView.vue') },
                { path: 'audit-logs', name: 'AdminAuditLogs', component: () => import('@/views/admin/AdminAuditLogView.vue') },
                { path: 'notifications/send', name: 'AdminSendNotification', component: () => import('@/views/admin/AdminSendNotificationView.vue') },
            ]
        },

        { path: '/:pathMatch(.*)*', redirect: '/' },
    ]
})

// Navigation guards
router.beforeEach((to) => {
    const authStore = useAuthStore()
    const adminToken = localStorage.getItem('dezpay_admin_token')
    const userToken = localStorage.getItem('dezpay_token')

    // Admin routes — cek admin token
    if (to.meta.requiresAdmin && !adminToken) {
        return { name: 'AdminLogin' }
    }

    // User routes — cek user token
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return { name: 'Login' }
    }

    // Guest routes — jangan redirect admin/login ke dashboard user
    if (to.meta.guest) {
        if (to.path.startsWith('/admin') && adminToken) {
            return { name: 'AdminDashboard' }
        }
        if (!to.path.startsWith('/admin') && userToken) {
            return { name: 'Dashboard' }
        }
    }
})

export default router
