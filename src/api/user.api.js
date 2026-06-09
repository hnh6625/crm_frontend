import api from './axios'

export const userApi = {
  getRoles:       ()           => api.get('/api/users/roles'),
  getConsultants: ()           => api.get('/api/users/consultants'),
  getList:        params       => api.get('/api/users', { params }),
  getById:        id           => api.get(`/api/users/${id}`),
  create:         data         => api.post('/api/users', data),
  update:         (id, data)   => api.put(`/api/users/${id}`, data),
  updateStatus:   (id, data)   => api.patch(`/api/users/${id}/status`, data),
  resetPassword:  id           => api.post(`/api/users/${id}/reset-password`),
  unlock:         id           => api.post(`/api/users/${id}/unlock`),
  delete:         id           => api.delete(`/api/users/${id}`),
}
