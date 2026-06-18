<template>
  <div v-if="loading" class="detail-loading">
    <el-skeleton :rows="8" animated/>
  </div>

  <div v-else-if="enrollment" class="lead-detail">
    <div class="detail-header card">
      <div class="dh-left">
        <el-button text @click="router.back()" style="margin-right:8px;padding:0">
          <span class="icon">arrow_back</span>
        </el-button>
        <div class="dh-avatar">{{ initials }}</div>
        <div>
          <div class="dh-name">{{ enrollment.leadName }}</div>
          <div class="dh-sub">Mã SV: {{ enrollment.studentCode || 'Chưa cập nhật' }}</div>
        </div>
      </div>
      <div class="dh-right">
        <el-tag :type="getStatusColor(enrollment.enrollmentStatus)" size="large" effect="light">
          {{ getStatusLabel(enrollment.enrollmentStatus) }}
        </el-tag>
        <el-button @click="openEditDialog">
          <span class="icon icon-sm">edit</span>
        </el-button>
      </div>
    </div>

    <div class="detail-body">

      <div class="detail-left">
        <div class="card info-card">
          <div class="section-title">Thông tin Học viên</div>
          <div class="info-grid" style="grid-template-columns: 1fr;">
            <div class="info-item">
              <span class="info-label">Họ và tên</span>
              <span class="info-value">{{ enrollment.leadName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ngày sinh</span>
              <span class="info-value">{{ fmtDateOnly(enrollment.leadBirthDate) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Giới tính</span>
              <span class="info-value">{{ formatGender(enrollment.leadGender) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Số điện thoại</span>
              <span class="info-value">{{ enrollment.leadPhone || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ enrollment.leadEmail || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Địa chỉ liên hệ</span>
              <span class="info-value">{{ enrollment.leadAddress || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Quê quán (Tỉnh/Thành)</span>
              <span class="info-value">{{ enrollment.leadProvince || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Trường học</span>
              <span class="info-value">{{ enrollment.leadSchoolName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Năm tốt nghiệp</span>
              <span class="info-value">{{ enrollment.leadGraduationYear || '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-right">
        <div class="card info-card">
          <div class="section-title">Hồ sơ Nhập học</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Khoa (Department)</span>
              <span class="info-value">{{ enrollment.departmentName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ngành (Major)</span>
              <span class="info-value" style="font-weight: 600; color: #2e90fa">{{
                  enrollment.majorName || '—'
                }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Mức học phí</span>
              <span class="info-value" style="color: #12b76a; font-weight: 600;">
                {{
                  enrollment.tuitionFee ? enrollment.tuitionFee.toLocaleString() + ' VNĐ' : '0 VNĐ'
                }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Phương thức đóng</span>
              <span class="info-value">
                {{
                  enrollment.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : (enrollment.paymentMethod === 'CASH' ? 'Tiền mặt' : '—')
                }}
              </span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <span class="info-label">Ghi chú hồ sơ</span>
              <span class="info-value">{{ enrollment.note || 'Không có ghi chú' }}</span>
            </div>

            <div class="info-item" style="grid-column: 1 / -1;">
              <hr style="border: 0; border-top: 1px dashed #e4e7ec; margin: 8px 0;"/>
            </div>

            <div class="info-item">
              <span class="info-label">Chốt bởi (Sale)</span>
              <span class="info-value">{{ enrollment.enrolledByName || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ngày tạo hồ sơ</span>
              <span class="info-value">{{ fmtDateTime(enrollment.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>

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
import {ref, computed, onMounted, reactive} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {enrollmentApi} from '@/api/enrollment.api'
import {ElMessage} from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const enrollment = ref(null)

// State form Edit
const showEdit = ref(false)
const editForm = reactive({
  studentCode: '',
  status: 'PENDING',
})

const initials = computed(() => {
  const n = enrollment.value?.leadName || ''
  return n.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'SV'
})

async function loadData() {
  loading.value = true
  try {
    const res = await enrollmentApi.getById(route.params.id)
    enrollment.value = res.data?.data || res.data
  } catch (e) {
    ElMessage.error('Không tìm thấy thông tin nhập học!',e)
    router.replace('/enrollments')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function openEditDialog() {
  editForm.studentCode = enrollment.value.studentCode || ''
  editForm.status = enrollment.value.enrollmentStatus || 'PENDING'
  showEdit.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    // Gọi API cập nhật Trạng thái và Mã  SV
    await enrollmentApi.updateStatus(enrollment.value.id || enrollment.value.enrollmentId, editForm.status)
    if (editForm.studentCode) {
      await enrollmentApi.update(enrollment.value.id || enrollment.value.enrollmentId, {studentCode: editForm.studentCode})
    }
    ElMessage.success("Cập nhật thành công!")
    showEdit.value = false
    await loadData() // Refresh lại dữ liệu sau khi sửa xong
  } catch (e) {
    ElMessage.error("Lỗi khi cập nhật hồ sơ",e)
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

function fmtDateOnly(v) {
  return v ? dayjs(v).format('DD/MM/YYYY') : '—'
}

function fmtDateTime(v) {
  return v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'
}

function formatGender(gender) {
  const map = {
    MALE: 'Nam',
    FEMALE: 'Nữ'
  }
  return map[gender] || '—'
}
</script>

<style scoped>
.detail-loading {
  padding: 24px;
}

.lead-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.08);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.dh-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dh-avatar {
  width: 44px;
  height: 44px;
  background: #001e40;
  color: #ff8928;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
}

.dh-name {
  font-size: 16px;
  font-weight: 600;
  color: #101828;
}

.dh-sub {
  font-size: 12.5px;
  color: #475467;
  margin-top: 2px;
}

.dh-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-body {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 16px;
  align-items: start;
}

.detail-left, .detail-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #101828;
  margin-bottom: 14px;
  text-transform: uppercase;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 11.5px;
  color: #98a2b3;
}

.info-value {
  font-size: 13px;
  color: #101828;
  font-weight: 500;
  word-break: break-word;
}

@media (max-width: 1024px) {
  .detail-body {
    grid-template-columns: 1fr;
  }
}
</style>
