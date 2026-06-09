import api from './axios'

export const authApi = {
  login:          data => api.post('/api/auth/login', data),
  logout:         ()   => api.post('/api/auth/logout'),
  refresh:        data => api.post('/api/auth/refresh', data),
  me:             ()   => api.get('/api/auth/me'),
  changePassword: data => api.post('/api/auth/change-password', data),
}
