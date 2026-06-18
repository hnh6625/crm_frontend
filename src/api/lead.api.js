import api from './axios'

export const leadApi = {
  getSources: () => api.get('/api/leads/sources'),
  getStatuses: () => api.get('/api/leads/statuses'),
  getTags: () => api.get('/api/leads/tags'),
  getList: params => api.get('/api/leads', {params}),
  getById: id => api.get(`/api/leads/${id}`),
  create: data => api.post('/api/leads', data),
  update: (id, data) => api.put(`/api/leads/${id}`, data),
  assign: (id, data) => api.patch(`/api/leads/${id}/assign`, data),
  delete: id => api.delete(`/api/leads/${id}`),
  getHistory: id => api.get(`/api/leads/${id}/history`),
  getCount: () => api.get('/api/leads/count'),
  getStatusStats: () => api.get('/api/leads/stats/status'),
}
