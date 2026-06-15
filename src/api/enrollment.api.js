import api from './axios'

export const enrollmentApi = {
  // Dropdown Khoa/Ngành
  getMajors: () => api.get('/api/enrollments/majors'),

  // Quản lý danh sách
  getList: (params) => api.get('/api/enrollments', { params }),
  getByLead: (leadId) => api.get(`/api/enrollments/by-lead/${leadId}`),

  // Chốt nhập học
  create: (data) => api.post('/api/enrollments', data),

  // Cập nhật hồ sơ
  update: (id, data) => api.put(`/api/enrollments/${id}`, data),

  // Cập nhật trạng thái
  updateStatus: (id, status) => api.patch(`/api/enrollments/${id}/status?status=${status}`)
}
