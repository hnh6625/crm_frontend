import { defineStore } from 'pinia'
import { ref } from 'vue'
import { enrollmentApi } from '@/api/enrollment.api'
import { ElMessage } from 'element-plus'

export const useEnrollmentStore = defineStore('enrollment', () => {
  const list      = ref([])
  const total     = ref(0)
  const loading   = ref(false)
  const majors    = ref([])
  const campuses  = ref([])
  const semesters = ref([])

  async function fetchList(params) {
    loading.value = true
    try {
      const res   = await enrollmentApi.getList(params)
      list.value  = res.data.content
      total.value = res.data.totalElements
    } finally { loading.value = false }
  }

  async function fetchDropdowns() {
    if (majors.value.length) return
    const [m, c, s] = await Promise.all([
      enrollmentApi.getMajors(),
      enrollmentApi.getCampuses(),
      enrollmentApi.getSemesters(),
    ])
    majors.value    = m.data || []
    campuses.value  = c.data || []
    semesters.value = s.data || []
  }

  async function create(data) {
    await enrollmentApi.create(data)
    ElMessage.success('Tạo đăng ký thành công')
  }

  async function update(id, data) {
    await enrollmentApi.update(id, data)
    ElMessage.success('Cập nhật thành công')
  }

  async function updateStatus(id, status) {
    await enrollmentApi.updateStatus(id, status)
    ElMessage.success('Cập nhật trạng thái thành công')
  }

  return {
    list, total, loading, majors, campuses, semesters,
    fetchList, fetchDropdowns, create, update, updateStatus,
  }
})
