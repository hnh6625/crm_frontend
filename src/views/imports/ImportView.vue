<template>
  <div class="import-view">

    <div class="card upload-card">
      <div class="section-header">
        <div>
          <div class="section-title">Import Leads từ Excel</div>
          <div class="section-sub">Tải lên file .xlsx / .csv để import danh sách hồ sơ hàng loạt</div>
        </div>
        <el-button @click="downloadTemplate">
          <span class="icon icon-sm">download</span>
          Tải file mẫu
        </el-button>
      </div>

      <el-upload
        ref="uploadRef"
        class="upload-dragger"
        drag
        :auto-upload="false"
        accept=".xlsx,.xls,.csv"
        :limit="1"
        :on-change="onFileChange"
        :on-remove="onFileRemove"
      >
        <div class="upload-inner">
          <div class="upload-icon">
            <span class="icon icon-fill" style="font-size:32px;color:#2e90fa">upload_file</span>
          </div>
          <div class="upload-text">Kéo thả file vào đây hoặc <span class="upload-link">chọn file</span></div>
          <div class="upload-hint">Chỉ hỗ trợ .xlsx, .xls, .csv · Tối đa 50MB</div>
        </div>
      </el-upload>

      <div v-if="selectedFile" class="file-preview">
        <span class="icon icon-fill" style="color:#12b76a">check_circle</span>
        <span class="file-name">{{ selectedFile.name }}</span>
        <span class="file-size">{{ (selectedFile.size / 1024).toFixed(1) }} KB</span>
      </div>

      <div style="display:flex;gap:8px;margin-top:16px">
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="!selectedFile"
          @click="doUpload"
        >
          <span class="icon icon-sm">upload</span>
          Bắt đầu import
        </el-button>
      </div>
    </div>

    <div v-if="currentJob" class="card job-card">
      <div class="job-header">
        <div class="section-title">Tiến trình import</div>
        <el-tag :type="jobTagType(currentJob.importStatus)" size="large">
          {{ IMPORT_STATUS_LABELS[currentJob.importStatus] || currentJob.importStatus }}
        </el-tag>
      </div>

      <el-progress
        :percentage="calcProgress(currentJob)"
        :status="currentJob.importStatus === 'FAILED' ? 'exception' : currentJob.importStatus === 'COMPLETED' ? 'success' : ''"
        striped
        striped-flow
        :duration="6"
      />

      <div class="job-meta">
        <span>Tổng: {{ currentJob.totalRecords || 0 }} dòng</span>
        <span>Thành công: <b style="color:#12b76a">{{ currentJob.successRecords || 0 }}</b></span>
        <span>Lỗi: <b style="color:#f04438">{{ currentJob.failedRecords || 0 }}</b></span>
      </div>

      <div v-if="['COMPLETED', 'FAILED'].includes(currentJob.importStatus) && currentJob.failedRecords > 0" style="margin-top:12px">
        <el-button size="small" type="danger" text @click="loadErrors">
          <span class="icon icon-sm">error_outline</span>
          Xem chi tiết lỗi ({{ currentJob.failedRecords }} dòng)
        </el-button>
      </div>

      <div v-if="errors.length" class="error-table">
        <el-table :data="errors" size="small" max-height="200">
          <el-table-column prop="rowNum" label="Dòng" width="80" />
          <el-table-column prop="validationErrors" label="Chi tiết lỗi" min-width="250" />
        </el-table>
      </div>
    </div>

    <div class="card history-card">
      <div class="section-header" style="margin-bottom:16px">
        <div class="section-title">Lịch sử import</div>
        <el-button text size="small" @click="loadHistory">
          <span class="icon icon-sm">refresh</span>
        </el-button>
      </div>
      <el-table :data="history" v-loading="loadingHistory" size="small" style="width:100%">
        <el-table-column prop="fileName"   label="Tên file"        min-width="180" />

        <el-table-column prop="importStatus" label="Trạng thái"    width="140">
          <template #default="{ row }">
            <el-tag size="small" :type="jobTagType(row.importStatus)">
              {{ IMPORT_STATUS_LABELS[row.importStatus] || row.importStatus }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="totalRecords"   label="Tổng"            width="80" />
        <el-table-column prop="successRecords" label="Thành công"      width="100">
          <template #default="{ row }">
            <span style="color:#12b76a;font-weight:600">{{ row.successRecords || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failedRecords"   label="Lỗi"             width="80">
          <template #default="{ row }">
            <span style="color:#f04438;font-weight:600">{{ row.failedRecords || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Người thực hiện" min-width="160">
          <template #default="{ row }">
            {{ row.importedByName || (row.importedBy ? row.importedBy.fullName : '—') }}
          </template>
        </el-table-column>

        <el-table-column prop="createdAt"   label="Thời gian"       width="140">
          <template #default="{ row }">{{ fmtDateTime(row.createdAt) }}</template>
        </el-table-column>

        <el-table-column label="Hành động" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.failedRecords > 0"
              size="small"
              type="danger"
              text
              @click="openHistoryErrors(row)"
            >
              Xem lỗi
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showErrorDialog" title="Chi tiết dòng lỗi" width="600px" destroy-on-close>
      <el-table :data="historyErrors" size="small" max-height="400">
        <el-table-column prop="rowNum" label="Dòng" width="80" />
        <el-table-column prop="validationErrors" label="Lý do lỗi" min-width="250" />
      </el-table>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage }                   from 'element-plus'
import { importApi }                   from '@/api/import.api'
import { IMPORT_STATUS_LABELS }        from '@/constants/status'
import dayjs                           from 'dayjs'

const uploadRef    = ref()
const selectedFile = ref(null)
const uploading    = ref(false)
const currentJob   = ref(null)
const errors       = ref([])
const history      = ref([])
const loadingHistory = ref(false)
let pollTimer = null

// State mới cho Dialog Lịch sử
const showErrorDialog = ref(false)
const historyErrors   = ref([])

onMounted(() => { loadHistory() })
onUnmounted(() => clearInterval(pollTimer))

function onFileChange(file) { selectedFile.value = file.raw }
function onFileRemove()     { selectedFile.value = null }

async function doUpload() {
  if (!selectedFile.value) return
  uploading.value = true
  errors.value    = []
  try {
    const res = await importApi.upload(selectedFile.value)
    currentJob.value = res.data
    selectedFile.value = null
    uploadRef.value?.clearFiles()

    const jobId = res.data.importId || res.data.id
    startPolling(jobId)
  } catch (error) {
    ElMessage.error('Upload thất bại, vui lòng thử lại!')
    console.error(error)
  } finally {
    uploading.value = false
  }
}

function startPolling(jobId) {
  clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    try {
      const res = await importApi.getStatus(jobId)
      currentJob.value = res.data

      const status = res.data.importStatus

      if (['COMPLETED', 'FAILED'].includes(status)) {
        clearInterval(pollTimer)
        loadHistory()

        if (status === 'COMPLETED') {
          ElMessage.success(`Import hoàn tất thành công 100%!`)
        } else {
          // Báo đỏ nêú có data lỗi lọt vào (Theo đúng logic mới)
          ElMessage.error(`Import thất bại do có dữ liệu lỗi. Vui lòng kiểm tra chi tiết!`)
        }
      }
    } catch (e) {
      console.error("Lỗi khi polling:", e)
      clearInterval(pollTimer)
    }
  }, 2000)
}

async function loadErrors() {
  const jobId = currentJob.value.importId || currentJob.value.id
  try {
    const res = await importApi.getErrors(jobId)
    errors.value = res.data || []
  } catch (e) {
    ElMessage.error('Không thể lấy chi tiết lỗi!',e)
  }
}

// HÀM MỚI: Mở popup xem lỗi của lịch sử
async function openHistoryErrors(row) {
  const jobId = row.importId || row.id
  try {
    const res = await importApi.getErrors(jobId)
    historyErrors.value = res.data || []
    showErrorDialog.value = true
  } catch (e) {
    ElMessage.error('Không thể lấy chi tiết lỗi của lịch sử này!',e)
  }
}

async function loadHistory() {
  loadingHistory.value = true
  try {
    const res = await importApi.getHistory({ page: 0, size: 20, sort: 'createdAt,desc' })
    history.value = res.data?.content || res.data || []
  } catch (e) {
    console.error("Lỗi lấy lịch sử:", e)
  } finally {
    loadingHistory.value = false
  }
}

function calcProgress(job) {
  if (!job || !job.totalRecords) return 0;
  if (job.importStatus === 'COMPLETED' || job.importStatus === 'FAILED') return 100;
  const processed = (job.successRecords || 0) + (job.failedRecords || 0);
  return Math.min(100, Math.round((processed / job.totalRecords) * 100));
}

async function downloadTemplate() {
  try {
    const res = await importApi.downloadTemplate()

    // 1. Tạo đối tượng Blob từ dữ liệu nhị phân trả về
    const url = window.URL.createObjectURL(new Blob([res.data]))

    // 2. Tạo một thẻ <a> ẩn để kích hoạt tải xuống
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Lead_Import_Template.csv') // Tên file tải về
    document.body.appendChild(link)

    // 3. Bấm ẩn và dọn dẹp
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url) // Giải phóng bộ nhớ trình duyệt

  } catch (error) {
    ElMessage.error('Đã xảy ra lỗi khi tải file mẫu!')
    console.error("Lỗi tải template:", error)
  }
}

function jobTagType(status) {
  return { PENDING: 'info', PROCESSING: 'warning', COMPLETED: 'success', FAILED: 'danger' }[status] || 'info'
}

function fmtDateTime(v) { return v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—' }


</script>

<style scoped>
/* Giữ nguyên toàn bộ Style hiện tại của bạn */
.import-view { display: flex; flex-direction: column; gap: 20px; }

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.08);
}

.section-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px; gap: 12px;
}

.section-title { font-size: 15px; font-weight: 600; color: #101828; }
.section-sub   { font-size: 13px; color: #475467; margin-top: 3px; }

/* Upload */
.upload-dragger :deep(.el-upload-dragger) {
  background: #f8f9fa;
  border: 2px dashed #d0d5dd;
  border-radius: 10px;
  padding: 32px;
  transition: border-color 0.2s, background 0.2s;
}

.upload-dragger :deep(.el-upload-dragger:hover) {
  border-color: #001e40;
  background: #f0f4ff;
}

.upload-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; }

.upload-icon {
  width: 56px; height: 56px;
  background: rgba(46,144,250,0.1);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}

.upload-text { font-size: 14px; color: #101828; font-weight: 500; }
.upload-link { color: #001e40; font-weight: 600; }
.upload-hint { font-size: 12px; color: #98a2b3; }

.file-preview {
  display: flex; align-items: center; gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(18,183,106,0.05);
  border: 1px solid rgba(18,183,106,0.2);
  border-radius: 8px;
  font-size: 13px;
}

.file-name { flex: 1; font-weight: 500; color: #101828; }
.file-size { color: #98a2b3; }

/* Job */
.job-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}

.job-meta {
  display: flex; gap: 24px; margin-top: 12px;
  font-size: 13px; color: #475467;
}

.error-table { margin-top: 12px; }
</style>
