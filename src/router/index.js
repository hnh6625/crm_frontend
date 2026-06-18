import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES }        from '@/constants/role'

const routes = [
  {
    path:      '/login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta:      { public: true, title: 'Đăng nhập' },
  },
  {
    path:      '/change-password',
    component: () => import('@/views/auth/ChangePasswordView.vue'),
    meta:      { title: 'Đổi mật khẩu' },
  },
  {
    path:      '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue'), meta: { title: 'Dashboard' } },
      { path: 'leads', component: () => import('@/views/leads/LeadListView.vue'), meta: { title: 'Quản lý Hồ sơ' } },
      { path: 'leads/:id', component: () => import('@/views/leads/LeadDetailView.vue'), meta: { title: 'Chi tiết Hồ sơ' } },
      { path: 'enrollments', component: () => import('@/views/enrollments/EnrollmentView.vue'), meta: { title: 'Nhập học' } },
      { path: 'enrollments/:id', component: () => import('@/views/enrollments/EnrollmentDetailView.vue'), meta: { title: 'Chi tiết Nhập học' } },
      { path: 'imports', component: () => import('@/views/imports/ImportView.vue'), meta: { title: 'Import Leads' } },

      { path: 'users', component: () => import('@/views/users/UserListView.vue'), meta: { title: 'Người dùng', roles: [ROLES.MANAGER] } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation Guard
router.beforeEach(to => {
  const auth = useAuthStore()

  if (!to.meta.public && !auth.isLoggedIn)
    return '/login'

  if (to.path === '/login' && auth.isLoggedIn)
    return '/'

  if (auth.isLoggedIn && auth.mustChange && to.path !== '/change-password')
    return '/change-password'

  if (to.meta.roles) {
    const userRole = String(auth.role).toUpperCase().replace('ROLE_', '')
    const allowedRoles = to.meta.roles.map(r => String(r).toUpperCase().replace('ROLE_', ''))

    if (!allowedRoles.includes(userRole)) {
      return '/'
    }
  }
})

export default router
