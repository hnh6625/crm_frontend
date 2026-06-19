import api from './axios'

export const importApi = {
  upload:    file => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/api/imports/upload', fd, {
      timeout: 300000,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getStatus: id     => api.get(`/api/imports/${id}/status`),
  getHistory: params => api.get('/api/imports', { params }),
  getErrors:  id     => api.get(`/api/imports/${id}/errors`),
  downloadTemplate: () => {
    return api.get('/api/imports/template', { responseType: 'blob' })
  }
}
