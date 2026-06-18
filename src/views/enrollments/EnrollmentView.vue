<template>
  <div class="enrollment-page">
<<<<<<< HEAD
=======
    <div class="page-header">
      <div class="page-title">
      </div>
    </div>

>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
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

<<<<<<< HEAD
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
=======
        <el-select v-model="filters.departmentId" placeholder="Chọn Khoa" clearable style="width:200px" @change="handleDeptFilterChange">
          <el-option v-for="d in departments" :key="d.departmentId || d.id" :label="d.departmentName" :value="d.departmentId || d.id"/>
        </el-select>

        <el-select v-model="filters.majorId" placeholder="Chọn Ngành" clearable style="width:200px" @change="fetchData" :disabled="!filters.departmentId">
          <el-option v-for="m in filteredMajorsForFilter" :key="m.majorId || m.id" :label="m.majorName" :value="m.majorId || m.id"/>
        </el-select>

        <el-select v-model="filters.status" placeholder="Trạng thái" clearable style="width:140px" @change="fetchData">
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
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
<<<<<<< HEAD
        <el-table-column label="Ngày ĐK" width="120">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column width="100" align="center" @click.stop>
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click.stop="openEditDialog(row)">
              Chỉnh sửa
=======

        <!-- NÚT HÀNH ĐỘNG -->
        <el-table-column width="140" align="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="goToDetail(row.id || row.enrollmentId)">Chi tiết</el-button>
            <el-button size="small" text @click="openEditDialog(row)" style="padding: 4px 8px;">
              <span class="icon icon-sm">edit</span>
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
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

<<<<<<< HEAD
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
=======
    <!-- DIALOG CẬP NHẬT TRẠNG THÁI -->
    <el-dialog v-model="showEdit" title="Cập nhật trạng thái" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" label-position="top">
        <el-form-item label="Mã sinh viên (Nếu có)" prop="studentCode">
          <el-input v-model="editForm.studentCode" placeholder="VD: SV2026001..."/>
        </el-form-item>

        <el-form-item label="Trạng thái hồ sơ" prop="status">
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
          <el-select v-model="editForm.status" style="width:100%">
            <el-option label="Chờ xử lý" value="PENDING"/>
            <el-option label="Đã xác nhận" value="CONFIRMED"/>
            <el-option label="Hoàn thành" value="COMPLETED"/>
            <el-option label="Đã huỷ" value="CANCELLED"/>
          </el-select>
        </el-form-item>
<<<<<<< HEAD
        <el-form-item label="Ghi chú">
          <el-input v-model="editForm.note" type="textarea" :rows="2" placeholder="Ghi chú..."/>
        </el-form-item>
=======
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
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
<<<<<<< HEAD
import { useRouter } from 'vue-router'
import { enrollmentApi } from '@/api/enrollment.api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
=======
import { enrollmentApi } from '@/api/enrollment.api'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176

const router = useRouter()
const list = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)

const departments = ref([])
const majors = ref([])
const faculties = ref([])

const page = ref(1)
<<<<<<< HEAD
const pageSize = ref(20)
const filters = reactive({
  keyword: '', facultyId: '', majorId: '', enrollmentStatus: ''
})
let debounceTimer = null

=======
const pageSize = ref(15)
const filters = reactive({ keyword: '', departmentId: '', majorId: '', status: '' })
let debounceTimer = null

// Form sửa
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
const showEdit = ref(false)
const formRef = ref(null)
const currentEditId = ref(null)
const editForm = reactive({
<<<<<<< HEAD
  majorId: '', studentCode: '', status: 'PENDING', note: ''
})

const rules = {
  majorId: [{ required: true, message: 'Vui lòng chọn ngành', trigger: 'change' }],
}
=======
  studentCode: '',
  status: 'PENDING',
})

// Lọc Ngành theo Khoa (dành cho Filter)
const filteredMajorsForFilter = computed(() => {
  if (!filters.departmentId) return []
  return majors.value.filter(m => m.department?.departmentId === filters.departmentId)
})
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176

// Lọc ngành theo khoa
const filteredMajors = computed(() => {
  if (!filters.facultyId) return majors.value
  return majors.value.filter(m => m.faculty?.facultyId === filters.facultyId)
})

onMounted(async () => {
<<<<<<< HEAD
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
=======
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
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
}

function handleDeptFilterChange() {
  filters.majorId = '' // Reset ngành khi đổi khoa
  fetchData()
}

async function fetchData() {
  loading.value = true
  try {
    const res = await enrollmentApi.getList({
      page: page.value - 1,
      size: pageSize.value,
      keyword: filters.keyword || undefined,
<<<<<<< HEAD
      facultyId: filters.facultyId || undefined,
      majorId: filters.majorId || undefined,
      enrollmentStatus: filters.enrollmentStatus || undefined,
    })
    const data = res.data?.data || res.data
    list.value = data?.content || []
    total.value = data?.totalElements || 0
=======
      departmentId: filters.departmentId || undefined,
      majorId: filters.majorId || undefined,
      status: filters.status || undefined
    }

    const res = await enrollmentApi.getList(params)
    list.value = res.data?.content || res.data?.data?.content || []
    total.value = res.data?.page?.totalElements || res.data?.data?.totalElements || list.value.length || 0
  } catch (e) {
    ElMessage.error("Không thể tải danh sách nhập học",e)
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
  } finally {
    loading.value = false
  }
}

function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; fetchData() }, 400)
<<<<<<< HEAD
}

function openEditDialog(row) {
  currentEditId.value = row.enrollmentId
  editForm.majorId = row.majorId
=======
}

function goToDetail(id) {
  router.push(`/enrollments/${id}`)
}

function openEditDialog(row) {
  currentEditId.value = row.id || row.enrollmentId
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
  editForm.studentCode = row.studentCode || ''
  editForm.status = row.enrollmentStatus || 'PENDING'
  showEdit.value = true
}

async function saveEdit() {
  saving.value = true
  try {
<<<<<<< HEAD
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
=======
    await enrollmentApi.updateStatus(currentEditId.value, editForm.status)
    if(editForm.studentCode) {
      await enrollmentApi.update(currentEditId.value, { studentCode: editForm.studentCode })
    }

    ElMessage.success("Cập nhật thành công!")
    showEdit.value = false
    fetchData()
  } catch (e) {
    ElMessage.error("Lỗi khi cập nhật",e)
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
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
<<<<<<< HEAD
  const map = { PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ' }
  return map[st] || st || '—'
=======
  const map = { PENDING: 'Chờ xử lý', COMPLETED: 'Đã hoàn tất', CANCELLED: 'Đã huỷ' }
  return map[st] || st || 'PENDING'
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
}
function getStatusColor(st) {
<<<<<<< HEAD
  const map = { PENDING: 'warning', CONFIRMED: 'primary', COMPLETED: 'success', CANCELLED: 'danger' }
  return map[st] || 'info'
}

function fmtDate(v) { return v ? dayjs(v).format('DD/MM/YYYY') : '—' }
function fmtMoney(v) {
  if (!v) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
}
=======
  const map = { PENDING: 'warning', COMPLETED: 'success', CANCELLED: 'danger' }
  return map[st] || 'info'
}
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
</script>

<style scoped>
.enrollment-page { display: flex; flex-direction: column; gap: 16px; }
<<<<<<< HEAD

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
=======
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
>>>>>>> 8e6138451d3cfa1c603251a5a115b468a87b8176
</style>
