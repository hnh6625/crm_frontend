import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
})

// Request: tự gắn JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: auto refresh + hiển thị lỗi
let isRefreshing = false
let waitQueue    = []

api.interceptors.response.use(
  res => {
    if (res.data && res.data.code !== undefined && res.data.data !== undefined) {
      res.data = res.data.data;
    }
    return res;
  },

  async err => {
    const original = err.config
    const status   = err.response?.status

    // Token hết hạn → thử refresh
    if (status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => waitQueue.push({ resolve, reject }))
          .then(() => api(original))
          .catch(e => Promise.reject(e))
      }

      isRefreshing = true
      try {
        const refresh = localStorage.getItem('refreshToken')
        if (!refresh) throw new Error('no_refresh_token')

        // Dùng axios thuần để gọi refresh, tránh kẹt vòng lặp interceptor
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, { refreshToken: refresh })

        const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
        const newRefreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;

        localStorage.setItem('accessToken',  newAccessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        original.headers.Authorization = `Bearer ${newAccessToken}`
        waitQueue.forEach(p => p.resolve())
        waitQueue = []
        return api(original)
      } catch (error) {
        waitQueue.forEach(p => p.reject(error))
        waitQueue = []
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    // Hiển thị lỗi — trừ 401 (đã xử lý ở trên)
    const msg = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại'
    if (status !== 401) ElMessage.error(msg)

    return Promise.reject(err.response?.data || err)
  }
)

export default api
