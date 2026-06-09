import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi }  from '@/api/auth.api'
import { ROLES }    from '@/constants/role'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const getSafeUser = () => {
    try {
      const val = localStorage.getItem('user');
      if (!val || val === 'undefined' || val === 'null') return null;
      return JSON.parse(val);
    } catch { return null; }
  }

  const user  = ref(getSafeUser())
  const token = ref(localStorage.getItem('accessToken') || '')

  const isLoggedIn  = computed(() => !!token.value)

  const isAdmin = computed(() => {
    const userRole = String(user.value?.role || '').toUpperCase().replace('ROLE_', '');
    const managerRole = String(ROLES.MANAGER || 'MANAGER').toUpperCase().replace('ROLE_', '');
    return userRole === managerRole;
  })

  const mustChange  = computed(() => user.value?.mustChangePassword === true)
  const fullName    = computed(() => user.value?.fullName || '')
  const role        = computed(() => user.value?.role || '')

  async function login(username, password) {
    const res = await authApi.login({ username, password })
    _saveSession(res.data)
    router.push(mustChange.value ? '/change-password' : '/')
  }

  async function logout() {
    await authApi.logout().catch(() => {})
    _clearSession()
    router.push('/login')
  }

  function _saveSession(data) {
    token.value = data.accessToken
    user.value  = data.user
    localStorage.setItem('accessToken',  data.accessToken || '')
    localStorage.setItem('refreshToken', data.refreshToken || '')
    localStorage.setItem('user',         JSON.stringify(data.user || null))
  }

  function _clearSession() {
    token.value = ''
    user.value  = null
    localStorage.clear()
  }

  return {
    user, token, isLoggedIn, isAdmin,
    mustChange, fullName, role,
    login, logout,
  }
})
