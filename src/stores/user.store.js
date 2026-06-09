import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '@/api/user.api'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const list    = ref([])
  const total   = ref(0)
  const loading = ref(false)
  const roles   = ref([])

  async function fetchList(params) {
    loading.value = true
    try {
      const res   = await userApi.getList(params)
      list.value  = res.data.content
      total.value = res.data.totalElements
    } finally { loading.value = false }
  }

  async function fetchRoles() {
    const res   = await userApi.getRoles()
    roles.value = res.data || []
  }

  async function create(data) {
    await userApi.create(data)
    ElMessage.success('Tạo người dùng thành công')
  }

  async function update(id, data) {
    await userApi.update(id, data)
    ElMessage.success('Cập nhật thành công')
  }

  async function updateStatus(id, status) {
    await userApi.updateStatus(id, { status })
    ElMessage.success('Cập nhật trạng thái thành công')
  }

  async function resetPassword(id) {
    await userApi.resetPassword(id)
    ElMessage.success('Đã reset mật khẩu về mặc định')
  }

  async function unlock(id) {
    await userApi.unlock(id)
    ElMessage.success('Đã mở khóa tài khoản')
  }

  async function remove(id) {
    await userApi.delete(id)
    ElMessage.success('Đã xóa người dùng')
  }

  return {
    list, total, loading, roles,
    fetchList, fetchRoles, create, update,
    updateStatus, resetPassword, unlock, remove,
  }
})
