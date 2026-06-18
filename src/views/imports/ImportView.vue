<template>
  <div class="import-page">
    <div class="page-header">
      <div class="page-title">
        <h2>Import dữ liệu (Hàng loạt)</h2>
        <p>Tải lên tệp Excel/CSV để thêm hàng nghìn hồ sơ cùng lúc.</p>
      </div>
      <el-button type="primary" plain @click="downloadTemplate">
        <span class="icon icon-sm">download</span> Tải file mẫu
      </el-button>
    </div>

    <div class="card upload-card">
      <div v-if="importing" class="progress-section">
        <h3>Đang xử lý dữ liệu... Vui lòng không đóng trình duyệt lúc này!</h3>
        <el-progress
          :percentage="progressPct"
          :text-inside="true"
          :stroke-width="24"
          :status="progressStatus"
          striped
          striped-flow
        />
        <div class="progress-stats">
          <span>Đã xử lý: <b>{{ processedRows }}</b> / {{ totalRows }} dòng</span>
          <span style="color: #12b76a">Thành công: <b>{{ successRows }}</b></span>
          <span style="color: #f04438">Lỗi: <b>{{ errorRows }}</b></span>
        </div>
      </div>

      <div v-else class="upload-section">
        <el-upload
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        >
          <div class="upload-inner">
            <span class="icon icon-fill" style="font-size: 48px; color: #2e90fa">cloud_upload</span>
            <div class="el-upload__text">Kéo thả file vào đây hoặc <em>Bấm để chọn file</em></div>
            <div class="el-upload__tip">Chỉ hỗ trợ file .CSV hoặc .XLSX (Tối đa 100.000 dòng)</div>
          </div>
        </el-upload>
      </div>
    </div>

    <div class="card history-card">
      <div class="card-title">Lịch sử Import gần đây</div>
      <el-table :data="history" style="width: 100%" v-loading="loadingHistory">
        <el-table-column prop="id" label="Mã ID" width="80" />
        <el-table-column prop="fileName" label="Tên tệp" min-width="180" />
        <el-table-column label="Thời gian" width="160">
          <template #default="{ row }">{{ fmtTime(row.startTime || row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="Tiến độ" width="180">
          <template #default="{ row }">
            <span style="color: #12b76a; font-weight: 600;">+{{ row.successRows || 0 }}</span> /
            <span style="color: #f04438; font-weight: 600;">-{{ row.errorRows || 0 }}</span>
            (Tổng: {{ row.totalRows || 0 }})
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="120" align="right">
          <template #default="{ row }">
            <el-button
              v-if="row.errorRows > 0 && row.errorDetails && row.errorDetails.length > 0"
              size="small"
              type="danger"
              plain
              @click="openErrorDialog(row)"
            >
              Xem lỗi
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showErrorDialog" title="Chi tiết các dòng bị lỗi" width="600px">
      <el-alert title="Các dòng dưới đây đã bị bỏ qua, không được lưu vào hệ thống." type="error" show-icon style="margin-bottom: 16px;" :closable="false" />
      <el-table :data="currentErrors" border max-height="400">
        <el-table-column prop="rowNumber" label="Dòng Excel" width="100" align="center">
          <template #default="{ row }"><b>#{{ row.rowNumber }}</b></template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="Nguyên nhân lỗi" min-width="250">
          <template #default="{ row }">
            <span style="color: #d92d20">{{ row.errorMessage || row.errorDetails }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { importApi } from '@/api/import.api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const importing = ref(false)
const progressPct = ref(0)
const totalRows = ref(0)
const processedRows = ref(0)
const successRows = ref(0)
const errorRows = ref(0)
const progressStatus = ref('')
let pollInterval = null

const history = ref([])
const loadingHistory = ref(false)

// Phục vụ hiển thị lỗi
const showErrorDialog = ref(false)
const currentErrors = ref([])

onMounted(() => {
  // 1. LẤY LẠI TIẾN TRÌNH NẾU NGƯỜI DÙNG F5
  const activeJobId = localStorage.getItem('activeImportJobId')
  if (activeJobId) {
    importing.value = true
    startPolling(activeJobId)
  }

  // 2. Tải lịch sử
  loadHistory()
})

async function loadHistory() {
  loadingHistory.value = true
  try {
    const res = await importApi.getHistory()
    history.value = res.data?.data || res.data?.content || res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingHistory.value = false
  }
}

async function handleFileChange(uploadFile) {
  if (!uploadFile) return

  ElMessageBox.confirm(
    `Bạn có chắc chắn muốn bắt đầu import file <b>${uploadFile.name}</b> không?`,
    'Xác nhận Import',
    { dangerouslyUseHTMLString: true, confirmButtonText: 'Bắt đầu', cancelButtonText: 'Hủy', type: 'warning' }
  ).then(async () => {

    importing.value = true
    progressPct.value = 0
    progressStatus.value = ''
    totalRows.value = 0; processedRows.value = 0; successRows.value = 0; errorRows.value = 0;

    const formData = new FormData()
    formData.append('file', uploadFile.raw)

    try {
      const res = await importApi.uploadFile(formData)
      const jobId = res.data?.data?.jobId || res.data?.jobId

      if (jobId) {
        // LƯU JOB ID VÀO LOCAL STORAGE ĐỂ CHỐNG F5
        localStorage.setItem('activeImportJobId', jobId)
        ElMessage.success('Tệp đang được xử lý ngầm trên máy chủ!')
        startPolling(jobId)
      }
    } catch (e) {
      importing.value = false
      ElMessage.error(e.response?.data?.message || 'Lỗi khi upload file')
    }
  }).catch(() => {})
}

function startPolling(jobId) {
  if (pollInterval) clearInterval(pollInterval)

  pollInterval = setInterval(async () => {
    try {
      const res = await importApi.getStatus(jobId)
      const statusData = res.data?.data || res.data

      totalRows.value = statusData.totalRows || 0
      processedRows.value = statusData.processedRows || 0
      successRows.value = statusData.successRows || 0
      errorRows.value = statusData.errorRows || 0

      if (totalRows.value > 0) {
        progressPct.value = Math.round((processedRows.value / totalRows.value) * 100)
      }

      const st = statusData.status || statusData.jobStatus
      if (st === 'COMPLETED' || st === 'FAILED') {
        clearInterval(pollInterval)
        progressStatus.value = st === 'COMPLETED' ? 'success' : 'exception'

        // XOÁ CACHE VÌ ĐÃ XONG
        localStorage.removeItem('activeImportJobId')

        setTimeout(() => {
          importing.value = false
          loadHistory()
          if (errorRows.value > 0) {
            ElMessage.warning(`Import xong. Có ${errorRows.value} dòng bị lỗi!`)
          } else {
            ElMessage.success('Tuyệt vời! Import thành công 100% dữ liệu.')
          }
        }, 2000)
      }
    } catch (e) {
      console.error(e)
      clearInterval(pollInterval)
    }
  }, 1500) // Hỏi thăm backend 1.5 giây / lần
}

function openErrorDialog(row) {
  currentErrors.value = row.errorDetails || []
  showErrorDialog.value = true
}

function downloadTemplate() {
  const url = '/template_import_leads.xlsx' // Đảm bảo bạn đã bỏ file mẫu vào thư mục public/
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'EduCRM_Import_Template.xlsx')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function fmtTime(v) { return v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—' }
function getStatusColor(st) {
  if (st === 'COMPLETED') return 'success'
  if (st === 'PROCESSING' || st === 'STARTING') return 'warning'
  if (st === 'FAILED') return 'danger'
  return 'info'
}
</script>

<style scoped>
.import-page { display: flex; flex-direction: column; gap: 16px; }
.card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(16, 24, 40, 0.08); }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.upload-card { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px; border: 1px dashed #d0d5dd; background: #fcfcfd; }
.upload-section { width: 100%; max-width: 600px; text-align: center; }
.upload-inner { padding: 40px 20px; }
.progress-section { width: 100%; max-width: 600px; text-align: center; display: flex; flex-direction: column; gap: 16px; }
.progress-stats { display: flex; justify-content: space-between; font-size: 13.5px; color: #475467; }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
</style>
