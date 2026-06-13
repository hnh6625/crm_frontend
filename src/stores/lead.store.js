import { defineStore } from 'pinia'
import { ref } from 'vue'
import { leadApi } from '@/api/lead.api'
import { ElMessage } from 'element-plus'

export const useLeadStore = defineStore('lead', () => {
  const list     = ref([])
  const total    = ref(0)
  const loading  = ref(false)
  const sources  = ref([])
  const statuses = ref([])
  const tags     = ref([])

  async function fetchList(params) {
    loading.value = true
    try {
      const res = await leadApi.getList(params)
      list.value = res.data.content || []

      total.value = res.data.page?.totalElements || res.data.totalElements || 0

    } catch (error) {
      console.error("Lỗi khi tải danh sách lead:", error)
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdowns() {
    const [s, st, t] = await Promise.all([
      leadApi.getSources(),
      leadApi.getStatuses(),
      leadApi.getTags(),
    ])
    sources.value  = s.data || []
    statuses.value = st.data || []
    tags.value     = (t.data?.data || t.data || []).map(t => t.tagName) // thêm
  }

  async function create(data) {
    await leadApi.create(data)
    ElMessage.success('Tạo hồ sơ thành công')
  }

  async function update(id, data) {
    await leadApi.update(id, data)
    ElMessage.success('Cập nhật thành công')
  }

  async function assign(id, data) {
    await leadApi.assign(id, data)
    ElMessage.success('Phân công thành công')
  }

  async function remove(id) {
    await leadApi.delete(id)
    ElMessage.success('Đã xóa hồ sơ')
  }

  return {
    list, total, loading, sources, statuses, tags,
    fetchList, fetchDropdowns,
    create, update, assign, remove,
  }
})
