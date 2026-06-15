<template>
  <div class="enrollment-page">
    <div class="page-header">
      <div class="page-title">
        <h2>Quản lý Nhập học</h2>
        <p>Danh sách học viên đã chốt cọc. Bộ phận Giáo vụ cập nhật trạng thái tại đây.</p>
      </div>
    </div>

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
        <el-select v-model="filters.majorId" placeholder="Khoa" clearable
                   style="width:200px" @change="fetchData">
          <el-option v-for="m in filteredMajors" :key="m.majorId || m.id" :label="m.majorName"
                     :value="m.majorName"/>
        </el-select>
        <el-select v-model="filters.majorId" placeholder="Ngành" clearable
                   style="width:200px" @change="fetchData">
          <el-option v-for="d in departments" :key="d.departmentId || d.id" :label="d.departmentName"
                     :value="d.departmentName"/>
        </el-select>
        <el-select v-model="filters.status" placeholder="Trạng thái" clearable style="width:160px"
                   @change="fetchData">
          <el-option label="Chờ xử lý" value="PENDING"/>
          <el-option label="Đã hoàn tất" value="COMPLETED"/>
          <el-option label="Đã huỷ" value="CANCELLED"/>
        </el-select>
      </div>
      <el-button @click="fetchData"><span class="icon icon-sm">refresh</span> Tải lại</el-button>
    </div>

    <div class="card table-card">
      <el-table :data="list" v-loading="loading" style="width:100%" stripe>
        <el-table-column label="Thông tin Học viên" min-width="220">
          <template #default="{ row }">
            <div style="font-weight: 600; color: #101828">{{ row.leadName || row.fullName }}</div>
            <div style="font-size: 13px; color: #475467">{{ row.leadPhone || row.phone }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="majorName" label="Khoa / Ngành" min-width="180"/>

        <el-table-column label="Học phí" width="160">
          <template #default="{ row }">
            <b style="color: #12b76a">{{ row.tuitionFee ? row.tuitionFee.toLocaleString() : '0' }}
              đ</b>
          </template>
        </el-table-column>

        <el-table-column label="Trạng thái" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.enrollmentStatus)" effect="light">
              {{ getStatusLabel(row.enrollmentStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Ngày ĐK" width="140">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column width="140" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="openEditDialog(row)">Chỉnh sửa
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

    <el-dialog v-model="showEdit" title="Cập nhật chi tiết hồ sơ" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="editForm" :rules="rules" label-position="top">
        <el-form-item label="Khoa / Ngành học" prop="majorId">
          <el-select v-model="editForm.majorId" style="width:100%">
            <el-option v-for="m in majors" :key="m.majorId || m.id" :label="m.majorName"
                       :value="m.majorId || m.id"/>
          </el-select>
        </el-form-item>

        <el-form-item label="Học phí (10.000.000 - 15.000.000)" prop="tuitionFee">
          <el-input v-model.number="editForm.tuitionFee" type="number"
                    placeholder="Nhập mức học phí">
            <template #append>VNĐ</template>
          </el-input>
        </el-form-item>

        <el-form-item label="Mã sinh viên (Nếu đã xếp lớp)" prop="studentCode">
          <el-input v-model="editForm.studentCode" placeholder="VD: SV2026001..."/>
        </el-form-item>

        <el-form-item label="Trạng thái hồ sơ" prop="status">
          <el-select v-model="editForm.status" style="width:100%">
            <el-option label="Chờ xử lý" value="PENDING"/>
            <el-option label="Đã hoàn tất (Đã đóng phí)" value="COMPLETED"/>
            <el-option label="Đã huỷ" value="CANCELLED"/>
          </el-select>
        </el-form-item>

        <el-form-item label="Ghi chú nội bộ">
          <el-input v-model="editForm.note" type="textarea" :rows="2"
                    placeholder="Ghi chú thêm..."/>
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
import {ref, reactive, onMounted} from 'vue'
import {enrollmentApi} from '@/api/enrollment.api'
import {ElMessage} from 'element-plus'
import dayjs from 'dayjs'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const majors = ref([])

// Phân trang & Lọc
const page = ref(1)
const pageSize = ref(15)
const filters = reactive({keyword: '', majorId: '', status: ''})
let debounceTimer = null

// State form
const showEdit = ref(false)
const formRef = ref(null)
const currentEditId = ref(null)

const editForm = reactive({
  majorId: '',
  tuitionFee: 10000000,
  studentCode: '',
  status: 'PENDING',
  note: ''
})

const rules = {
  majorId: [{required: true, message: 'Vui lòng chọn Khoa / Ngành', trigger: 'change'}],
  tuitionFee: [
    {required: true, message: 'Vui lòng nhập học phí'},
    {
      type: 'number',
      min: 10000000,
      max: 15000000,
      message: 'Học phí phải nằm trong khoảng 10,000,000 - 15,000,000 VNĐ',
      trigger: 'blur'
    }
  ]
}

onMounted(async () => {
  await loadMajors()
  fetchData()
})

async function loadMajors() {
  try {
    const res = await enrollmentApi.getMajors()
    majors.value = res.data?.data || []
  } catch (e) {
    console.error("Lỗi lấy danh sách ngành:", e)
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: page.value - 1,
      size: pageSize.value,
      keyword: filters.keyword || undefined,
      majorId: filters.majorId || undefined,
      status: filters.status || undefined
    }

    const res = await enrollmentApi.getList(params)

    console.log(res.data)

    list.value = res.data.content || []
    total.value = res.data.page?.totalElements || 0

  } finally {
    loading.value = false
  }
}

function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchData()
  }, 400)
}

function openEditDialog(row) {
  currentEditId.value = row.id || row.enrollmentId
  editForm.majorId = row.majorId
  editForm.tuitionFee = row.tuitionFee || 10000000
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
      tuitionFee: editForm.tuitionFee,
      studentCode: editForm.studentCode,
      note: editForm.note
    })

    await enrollmentApi.updateStatus(currentEditId.value, editForm.status)

    ElMessage.success("Cập nhật hồ sơ thành công!")
    showEdit.value = false
    fetchData()
  } catch (e) {
    console.error(e)
    const errorMap = e.response?.data?.data
    if (errorMap && typeof errorMap === 'object') {
      ElMessage.error(Object.values(errorMap).join(' | '))
    } else {
      ElMessage.error(e.response?.data?.message || "Lỗi khi cập nhật")
    }
  } finally {
    saving.value = false
  }
}

function getStatusLabel(st) {
  const map = {PENDING: 'Chờ xử lý', COMPLETED: 'Đã hoàn tất', CANCELLED: 'Đã huỷ'}
  return map[st] || st || 'PENDING'
}

function getStatusColor(st) {
  const map = {PENDING: 'warning', COMPLETED: 'success', CANCELLED: 'danger'}
  return map[st] || 'info'
}

function fmtDate(v) {
  return v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'
}
</script>

<style scoped>
.enrollment-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.08);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.toolbar-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-row {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f0f2f5;
}
</style>
