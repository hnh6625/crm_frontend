<template>
  <div class="enrollment-page">
    <div class="toolbar card">
      <div class="toolbar-filters">
        <el-input
          v-model="filters.keyword"
          placeholder="Tìm tên, SĐT học viên..."
          clearable
          style="width:260px"
          @input="debounceFetch"
        >
          <template #prefix><span class="icon">search</span></template>
        </el-input>

        <el-select v-model="filters.facultyId" placeholder="Khoa" clearable
                   style="width:200px" @change="onFacultyChange">
          <el-option v-for="f in faculties" :key="f.facultyId" :label="f.facultyName"
                     :value="f.facultyId"/>
        </el-select>

        <el-select v-model="filters.majorId" placeholder="Ngành" clearable
                   style="width:200px" @change="fetchData">
          <el-option v-for="m in filteredMajors" :key="m.majorId" :label="m.majorName"
                     :value="m.majorId"/>
        </el-select>

        <el-select v-model="filters.enrollmentStatus" placeholder="Trạng thái" clearable
                   style="width:160px" @change="fetchData">
          <el-option label="Chờ xử lý" value="PENDING"/>
          <el-option label="Đã xác nhận" value="CONFIRMED"/>
          <el-option label="Hoàn thành" value="COMPLETED"/>
          <el-option label="Đã huỷ" value="CANCELLED"/>
        </el-select>
      </div>
      <el-button @click="fetchData">
        <span class="icon icon-sm">refresh</span> Tải lại
      </el-button>
    </div>

    <div class="card table-card">
      <el-table
        :data="list"
        v-loading="loading"
        style="width:100%"
        row-class-name="clickable-row"
        @row-click="row => router.push('/leads/' + row.leadId)"
      >
        <el-table-column label="Thông tin Học viên" min-width="200">
          <template #default="{ row }">
            <div style="font-weight:600;color:#101828">{{ row.leadName }}</div>
            <div style="font-size:13px;color:#475467">{{ row.leadPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="facultyName" label="Khoa" min-width="160"/>
        <el-table-column prop="majorName" label="Ngành" min-width="160"/>
        <el-table-column label="Học phí" width="160">
          <template #default="{ row }">
            <b style="color:#12b76a">{{ fmtMoney(row.tuitionFee) }}</b>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.enrollmentStatus)" effect="light">
              {{ getStatusLabel(row.enrollmentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ngày ĐK" width="120">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column width="100" align="center" @click.stop>
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click.stop="openEditDialog(row)">
              Chỉnh sửa
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <span class="total-text">Tổng: {{ total }} đăng ký</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="sizes, prev, pager, next"
          @change="fetchData"
        />
      </div>
    </div>

    <!-- Dialog chỉnh sửa -->
    <el-dialog v-model="showEdit" title="Cập nhật hồ sơ nhập học" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" :rules="rules" label-position="top">
        <el-form-item label="Ngành học" prop="majorId">
          <el-select v-model="editForm.majorId" style="width:100%">
            <el-option v-for="m in majors" :key="m.majorId" :label="m.majorName" :value="m.majorId"/>
          </el-select>
        </el-form-item>
        <el-form-item label="Mã sinh viên">
          <el-input v-model="editForm.studentCode" placeholder="VD: SV2026001"/>
        </el-form-item>
        <el-form-item label="Trạng thái">
          <el-select v-model="editForm.status" style="width:100%">
            <el-option label="Chờ xử lý" value="PENDING"/>
            <el-option label="Đã xác nhận" value="CONFIRMED"/>
            <el-option label="Hoàn thành" value="COMPLETED"/>
            <el-option label="Đã huỷ" value="CANCELLED"/>
          </el-select>
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input v-model="editForm.note" type="textarea" :rows="2" placeholder="Ghi chú..."/>
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
import { useRouter } from 'vue-router'
import { enrollmentApi } from '@/api/enrollment.api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const list = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const majors = ref([])
const faculties = ref([])

const page = ref(1)
const pageSize = ref(20)
const filters = reactive({
  keyword: '', facultyId: '', majorId: '', enrollmentStatus: ''
})
let debounceTimer = null

const showEdit = ref(false)
const formRef = ref(null)
const currentEditId = ref(null)
const editForm = reactive({
  majorId: '', studentCode: '', status: 'PENDING', note: ''
})

const rules = {
  majorId: [{ required: true, message: 'Vui lòng chọn ngành', trigger: 'change' }],
}

// Lọc ngành theo khoa
const filteredMajors = computed(() => {
  if (!filters.facultyId) return majors.value
  return majors.value.filter(m => m.faculty?.facultyId === filters.facultyId)
})

onMounted(async () => {
  try {
    const [fRes, mRes] = await Promise.all([
      enrollmentApi.getFaculties(),
      enrollmentApi.getMajors(),
    ])
    faculties.value = fRes.data?.data || fRes.data || []
    majors.value = mRes.data?.data || mRes.data || []
  } catch (e) {
    console.error('Lỗi tải dropdown:', e)
  }
  fetchData()
})

function onFacultyChange() {
  filters.majorId = ''
  fetchData()
}

async function fetchData() {
  loading.value = true
  try {
    const res = await enrollmentApi.getList({
      page: page.value - 1,
      size: pageSize.value,
      keyword: filters.keyword || undefined,
      facultyId: filters.facultyId || undefined,
      majorId: filters.majorId || undefined,
      enrollmentStatus: filters.enrollmentStatus || undefined,
    })
    const data = res.data?.data || res.data
    list.value = data?.content || []
    total.value = data?.totalElements || 0
  } finally {
    loading.value = false
  }
}

function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; fetchData() }, 400)
}

function openEditDialog(row) {
  currentEditId.value = row.enrollmentId
  editForm.majorId = row.majorId
  editForm.studentCode = row.studentCode || ''
  editForm.status = row.enrollmentStatus || 'PENDING'
  editForm.note = row.note || ''
  showEdit.value = true
}

async function saveEdit() {
  await formRef.value.validate()
  saving.value = true
  try {
    await enrollmentApi.update(currentEditId.value, {
      majorId: editForm.majorId,
      studentCode: editForm.studentCode,
      note: editForm.note,
    })
    await enrollmentApi.updateStatus(currentEditId.value, editForm.status)
    ElMessage.success('Cập nhật thành công!')
    showEdit.value = false
    fetchData()
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Lỗi khi cập nhật')
  } finally {
    saving.value = false
  }
}

function getStatusLabel(st) {
  const map = { PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ' }
  return map[st] || st || '—'
}

function getStatusColor(st) {
  const map = { PENDING: 'warning', CONFIRMED: 'primary', COMPLETED: 'success', CANCELLED: 'danger' }
  return map[st] || 'info'
}

function fmtDate(v) { return v ? dayjs(v).format('DD/MM/YYYY') : '—' }
function fmtMoney(v) {
  if (!v) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
}
</script>

<style scoped>
.enrollment-page { display: flex; flex-direction: column; gap: 16px; }

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.08);
}

.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; gap: 12px; flex-wrap: wrap;
}

.toolbar-filters { display: flex; gap: 8px; flex-wrap: wrap; }
.table-card { overflow: hidden; }

.pagination-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-top: 1px solid #f0f2f5;
}

.total-text { font-size: 13px; color: #475467; }

:deep(.clickable-row) { cursor: pointer; }
:deep(.clickable-row:hover td) { background: #f8f9fa !important; }
</style>
