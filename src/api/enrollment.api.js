import api from './axios'

export const enrollmentApi = {
  getMajors: () => api.get('/api/enrollments/majors'),
  getCampuses: () => api.get('/api/enrollments/campuses'),
  getSemesters: () => api.get('/api/enrollments/semesters'),
  getList: params => api.get('/api/enrollments', {params}),
  getById: (id) => api.get(`/api/enrollments/${id}`),
  getByLead: (leadId) => api.get('/api/enrollments', {params: {leadId}}),
  create: data => api.post('/api/enrollments', data),
  update: (id, data) => api.put(`/api/enrollments/${id}`, data),
  updateStatus: (id, status) => api.patch(`/api/enrollments/${id}/status`, null, {params: {status}}),
}
