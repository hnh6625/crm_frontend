<template>
  <div class="enrollment-page">
    <div class="page-header">
      <div class="page-title">
      </div>
    </div>

    <div class="toolbar card">
      <div class="toolbar-filters">
        <el-input
          v-model="filters.keyword"
          placeholder="Tìm tên, SĐT học viên..."
          clearable
          style="width:240px"
          @input="debounceFetch"
        >
          <template #prefix><span class="icon">search</span></template>
        </el-input>

        <el-select v-model="filters.departmentId" placeholder="Chọn Khoa" clearable style="width:200px" @change="handleDeptFilterChange">
          <el-option v-for="d in departments" :key="d.departmentId || d.id" :label="d.departmentName" :value="d.departmentId || d.id"/>
        </el-select>

        <el-select v-model="filters.majorId" placeholder="Chọn Ngành" clearable style="width:200px" @change="fetchData" :disabled="!filters.departmentId">
          <el-option v-for="m in filteredMajorsForFilter" :key="m.majorId || m.id" :label="m.majorName" :value="m.majorId || m.id"/>
        </el-select>

        <el-select v-model="filters.status" placeholder="Trạng thái" clearable style="width:140px" @change="fetchData">
          <el-option label="Chờ xử lý" value="PENDING"/>
          <el-option label="Đã hoàn tất" value="COMPLETED"/>
          <el-option label="Đã huỷ" value="CANCELLED"/>
        </el-select>
      </div>
      <el-button @click="fetchData"><span class="icon icon-sm">refresh</span> Tải lại</el-button>
    </div>

    <div class="card table-card">
      <el-table :data="list" v-loading="loading" style="width:100%" stripe>

        <!-- CỘT HỌC VIÊN LÀM LẠI THEO CHUẨN AVATAR -->
        <el-table-column label="Thông tin Học viên" min-width="220">
          <template #default="{ row }">
            <div class="student-cell">
              <div class="student-avatar">{{ getInitials(row.leadName || row.fullName) }}</div>
              <div class="student-info">
                <div class="student-name">{{ row.leadName || row.fullName }}</div>
                <div class="student-phone">{{ row.leadPhone || row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- CỘT KHOA NGÀNH NHẤN MẠNH MÀU SẮC -->
        <el-table-column prop="majorName" label="Khoa / Ngành" min-width="180">
          <template #default="{ row }">
            <div style="font-weight: 600; color: #2e90fa;">{{ row.majorName }}</div>
            <div style="font-size: 12.5px; color: #98a2b3; margin-top: 2px;">{{ row.departmentName }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Học phí" width="150">
          <template #default="{ row }">
            <div style="color: #12b76a; font-weight: 600;">
              {{ row.tuitionFee ? row.tuitionFee.toLocaleString() : '0' }} đ
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="140">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.enrollmentStatus)" effect="light" size="default">
              {{ getStatusLabel(row.enrollmentStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- NÚT HÀNH ĐỘNG -->
        <el-table-column width="140" align="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="goToDetail(row.id || row.enrollmentId)">Chi tiết</el-button>
            <el-button size="small" text @click="openEditDialog(row)" style="padding: 4px 8px;">
              <span class="icon icon-sm">edit</span>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </div>

    <!-- DIALOG CẬP NHẬT TRẠNG THÁI -->
    <el-dialog v-model="showEdit" title="Cập nhật trạng thái" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" label-position="top">
        <el-form-item label="Mã sinh viên (Nếu có)" prop="studentCode">
          <el-input v-model="editForm.studentCode" placeholder="VD: SV2026001..."/>
        </el-form-item>

        <el-form-item label="Trạng thái hồ sơ" prop="status">
          <el-select v-model="editForm.status" style="width:100%">
            <el-option label="Chờ xử lý" value="PENDING"/>
            <el-option label="Đã hoàn tất (Đã đóng phí)" value="COMPLETED"/>
            <el-option label="Đã huỷ" value="CANCELLED"/>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">Huỷ</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">Lưu thay đổi</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { enrollmentApi } from '@/api/enrollment.api'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const list = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)

const departments = ref([])
const majors = ref([])

// Phân trang & Lọc
const page = ref(1)
const pageSize = ref(15)
const filters = reactive({ keyword: '', departmentId: '', majorId: '', status: '' })
let debounceTimer = null

// Form sửa
const showEdit = ref(false)
const formRef = ref(null)
const currentEditId = ref(null)

const editForm = reactive({
  studentCode: '',
  status: 'PENDING',
})

// Lọc Ngành theo Khoa (dành cho Filter)
const filteredMajorsForFilter = computed(() => {
  if (!filters.departmentId) return []
  return majors.value.filter(m => m.department?.departmentId === filters.departmentId)
})

onMounted(async () => {
  await loadCategories()
  fetchData()
})

async function loadCategories() {
  try {
    const [resD, resM] = await Promise.all([enrollmentApi.getDepartments(), enrollmentApi.getMajors()])
    departments.value = resD.data?.data || resD.data || []
    majors.value = resM.data?.data || resM.data || []
  } catch (e) {
    console.error("Lỗi lấy danh mục:", e)
  }
}

function handleDeptFilterChange() {
  filters.majorId = '' // Reset ngành khi đổi khoa
  fetchData()
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: page.value - 1,
      size: pageSize.value,
      keyword: filters.keyword || undefined,
      departmentId: filters.departmentId || undefined,
      majorId: filters.majorId || undefined,
      status: filters.status || undefined
    }

    const res = await enrollmentApi.getList(params)
    list.value = res.data?.content || res.data?.data?.content || []
    total.value = res.data?.page?.totalElements || res.data?.data?.totalElements || list.value.length || 0
  } catch (e) {
    ElMessage.error("Không thể tải danh sách nhập học",e)
  } finally {
    loading.value = false
  }
}

function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; fetchData() }, 400)
}

function goToDetail(id) {
  router.push(`/enrollments/${id}`)
}

function openEditDialog(row) {
  currentEditId.value = row.id || row.enrollmentId
  editForm.studentCode = row.studentCode || ''
  editForm.status = row.enrollmentStatus || 'PENDING'
  showEdit.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    await enrollmentApi.updateStatus(currentEditId.value, editForm.status)
    if(editForm.studentCode) {
      await enrollmentApi.update(currentEditId.value, { studentCode: editForm.studentCode })
    }

    ElMessage.success("Cập nhật thành công!")
    showEdit.value = false
    fetchData()
  } catch (e) {
    ElMessage.error("Lỗi khi cập nhật",e)
  } finally {
    saving.value = false
  }
}

// Format Avatar Initials
function getInitials(name) {
  if (!name) return 'SV'
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
}

function getStatusLabel(st) {
  const map = { PENDING: 'Chờ xử lý', COMPLETED: 'Đã hoàn tất', CANCELLED: 'Đã huỷ' }
  return map[st] || st || 'PENDING'
}
function getStatusColor(st) {
  const map = { PENDING: 'warning', COMPLETED: 'success', CANCELLED: 'danger' }
  return map[st] || 'info'
}
</script>

<style scoped>
.enrollment-page { display: flex; flex-direction: column; gap: 16px; }
.card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(16, 24, 40, 0.08); }
.toolbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
.toolbar-filters { display: flex; gap: 8px; flex-wrap: wrap; }
.pagination-row { padding: 12px 16px; display: flex; justify-content: flex-end; border-top: 1px solid #f0f2f5; }

/* Styling cho cột Avatar Học viên */
.student-cell { display: flex; align-items: center; gap: 12px; }
.student-avatar {
  width: 36px; height: 36px;
  background: #001e40; color: #ff8928;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}
.student-info { display: flex; flex-direction: column; gap: 2px; }
.student-name { font-weight: 600; color: #101828; font-size: 14px; }
.student-phone { font-size: 12.5px; color: #475467; }
</style>
