<template>
  <div v-if="loading" class="detail-loading">
    <el-skeleton :rows="8" animated/>
  </div>

  <div v-else-if="lead" class="lead-detail">

    <div class="detail-header card">
      <div class="dh-left">
        <el-button text @click="router.back()" style="margin-right:8px;padding:0">
          <span class="icon">arrow_back</span>
        </el-button>
        <div class="dh-avatar">{{ initials }}</div>
        <div>
          <div class="dh-name">{{ lead.fullName }}</div>
          <div class="dh-sub">{{ lead.phone }} · {{ lead.email || 'Chưa có email' }}</div>
        </div>
      </div>
      <div class="dh-right">
        <el-tag :type="LEAD_STATUS_COLORS[lead.statusName] || 'info'" size="large">
          {{ lead.statusName || '-' }}
        </el-tag>
        <el-button @click="openEdit">
          <span class="icon icon-sm">edit</span>
        </el-button>
        <el-button type="primary" plain @click="showCallLog = true">
          <span></span> Ghi gọi
        </el-button>
        <el-button
          v-if="lead.statusName !== 'Đã nhập học'"
          type="success"
          @click="showEnrollment = true"
        >
          <span></span> Nhập học
        </el-button>
      </div>
    </div>

    <div class="detail-body">
      <div class="detail-left">
        <div class="card info-card">
          <div class="section-title">Thông tin hồ sơ</div>
          <div class="info-grid">
            <div class="info-item" v-for="f in infoFields" :key="f.label">
              <span class="info-label">{{ f.label }}</span>
              <span class="info-value">{{ f.value || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="card enrollment-card">
          <div class="section-title-row">
            <span class="section-title">Lịch sử đăng ký nhập học</span>
          </div>
          <el-empty v-if="enrollments.length === 0" description="Chưa có đăng ký nào" :image-size="60"/>
          <div v-else class="enrollment-list">
            <div v-for="e in enrollments" :key="e.id || e.enrollmentId" class="enrollment-item">
              <div>
                <div class="en-major">{{ e.majorName }}</div>
                <div class="en-sub">
                  Học phí: {{ e.tuitionFee ? e.tuitionFee.toLocaleString() + ' VNĐ' : 'Chưa cập nhật' }}
                </div>
              </div>
              <el-tag size="small" :type="ENROLLMENT_STATUS_COLORS[e.enrollmentStatus || e.status] || 'info'">
                {{ ENROLLMENT_STATUS_LABELS[e.enrollmentStatus || e.status] || 'Chờ xử lý' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-right">
        <div class="card fu-card">
          <div class="section-title-row">
            <span class="section-title">Lịch hẹn follow-up</span>
            <el-button size="small" type="primary" text @click="showFollowUp = true">
              <span class="icon icon-sm">add</span> Đặt lịch
            </el-button>
          </div>
          <el-empty v-if="followUps.length === 0" description="Chưa có lịch hẹn" :image-size="60"/>
          <div v-else class="followup-list">
            <div v-for="f in followUps" :key="f.id || f.scheduleId" class="fu-item">
              <div class="fu-dot" :class="f.status.toLowerCase()"/>
              <div class="fu-body">
                <div class="fu-time">{{ fmtDateTime(f.scheduledAt || f.followUpTime) }}</div>
                <div class="fu-note">{{ f.note || 'Không có ghi chú' }}</div>
              </div>

              <div v-if="f.status === 'PENDING'" style="display:flex;gap:4px">
                <el-button size="small" type="success" text @click="updateFollowUpStatus(f.scheduleId || f.id, 'DONE')">
                  <span class="icon icon-sm">check_circle</span>
                </el-button>
                <el-button size="small" type="danger" text @click="updateFollowUpStatus(f.scheduleId || f.id, 'CANCELLED')">
                  <span class="icon icon-sm">cancel</span>
                </el-button>
              </div>
              <el-tag v-else size="small" :type="f.status === 'DONE' ? 'success' : 'info'">
                {{ f.status === 'DONE' ? 'Hoàn tất' : 'Đã huỷ' }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="card call-card">
          <div class="section-title">Lịch sử cuộc gọi</div>
          <el-empty v-if="calls.length === 0" description="Chưa có cuộc gọi nào" :image-size="60"/>
          <div v-else class="call-list">
            <div v-for="c in calls" :key="c.id || c.callLogId" class="call-item">
              <div class="call-icon">
                <span class="icon icon-fill" style="font-size:16px;color:#2e90fa">phone</span>
              </div>
              <div class="call-body">
                <div class="call-result">
                  {{ c.resultName || c.result }} · {{ c.durationSeconds || c.duration ? (c.durationSeconds || c.duration) + 's' : 'N/A' }}
                </div>
                <div class="call-note">{{ c.note || 'Không có ghi chú' }}</div>
                <div class="call-meta">{{ c.consultantName }} · {{ fmtDateTime(c.calledAt || c.callTime) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card history-card">
          <div class="section-title">Lịch sử hệ thống</div>
          <el-timeline>
            <el-timeline-item
              v-for="h in paginatedHistory"
              :key="h.id || h.historyId"
              :timestamp="fmtDateTime(h.createdAt)"
              placement="top"
            >
              <div class="history-text">{{ h.description }}</div>
              <div class="history-by">{{ h.createdBy || 'Hệ thống' }}</div>
            </el-timeline-item>
          </el-timeline>
          <div class="history-pagination" v-if="history.length > historyPageSize">
            <el-pagination
              v-model:current-page="historyPage"
              :page-size="historyPageSize"
              :total="history.length"
              layout="prev, pager, next"
              size="small"
            />
          </div>
        </div>
      </div>
    </div>

    <LeadFormDialog v-model="showEdit" :lead="lead" @saved="reload"/>
    <CallLogDialog v-model="showCallLog" :lead-id="lead.leadId" @saved="reload"/>
    <FollowUpDialog v-model="showFollowUp" :lead-id="lead.leadId" @saved="loadFollowUps"/>

    <el-dialog v-model="showEnrollment" title="Chốt hồ sơ nhập học" width="500px" destroy-on-close>
      <EnrollmentFormInline
        :lead-id="lead.leadId"
        @saved="onEnrollmentSaved"
        @cancel="showEnrollment = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus';
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { leadApi } from '@/api/lead.api'
import { callApi } from '@/api/call.api'
import { enrollmentApi } from '@/api/enrollment.api'
import { LEAD_STATUS_COLORS, ENROLLMENT_STATUS_COLORS, ENROLLMENT_STATUS_LABELS } from '@/constants/status'

import LeadFormDialog from './LeadFormDialog.vue'
import CallLogDialog from '@/views/calls/CallLogDialog.vue';
import FollowUpDialog from '@/views/calls/FollowUpDialog.vue';
import EnrollmentFormInline from '../enrollments/EnrollmentFormInline.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const lead = ref(null)
const calls = ref([])
const followUps = ref([])
const enrollments = ref([])
const history = ref([])

const historyPage = ref(1)
const historyPageSize = 10

const paginatedHistory = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize
  const end = start + historyPageSize
  return history.value.slice(start, end)
})

const showEdit = ref(false)
const showCallLog = ref(false)
const showFollowUp = ref(false)
const showEnrollment = ref(false)

const initials = computed(() => {
  const n = lead.value?.fullName || ''
  return n.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'N'
})

const genderMap = {
  MALE: 'Nam',
  FEMALE: 'Nữ'
}

const infoFields = computed(() => [
  {label: 'Họ và tên', value: lead.value?.fullName},
  {label: 'SĐT', value: lead.value?.phone},
  {label: 'Email', value: lead.value?.email},
  {label: 'Năm sinh', value: lead.value?.birthDate },
  {label: 'Giới tính', value: genderMap[lead.value?.gender] },
  {label: 'Trường học', value: lead.value?.schoolName },
  {label: 'Năm tốt nghiệp', value: lead.value?.graduationYear },
  {label: 'Địa chỉ', value: lead.value?.address },
  {label: 'Quê quán', value: lead.value?.province },
  {label: 'Nguồn', value: lead.value?.sourceName || '-'},
  {label: 'Trạng thái', value: lead.value?.statusName || '-' },
  {label: 'Tags', value: (lead.value?.tags || []).join(', ')},
  {label: 'Tư vấn viên', value: lead.value?.assignedToName},
  {label: 'Ghi chú', value: lead.value?.note },
])

async function reload() {
  const currentId = route.params.id;
  if (!currentId || currentId === 'undefined') {
    router.replace('/leads');
    return;
  }

  loading.value = true
  try {
    const res = await leadApi.getById(currentId)
    lead.value = res.data?.data || res.data

    await Promise.all([
      loadCalls(),
      loadFollowUps(),
      loadEnrollments(),
      loadHistory()
    ])
  } catch (e) {
    ElMessage.error('Không thể lấy thông tin hồ sơ!',e)
    router.replace('/leads')
  } finally {
    loading.value = false
  }
}

async function loadCalls() {
  try {
    const res = await callApi.getCallsByLead(route.params.id)
    calls.value = res.data?.data || res.data?.content || res.data || []
  } catch(e) {
    console.error("Lỗi lấy danh sách gọi:", e)
  }
}

async function loadFollowUps() {
  try {
    const res = await callApi.getFollowUpsByLead(route.params.id)
    followUps.value = res.data?.data || res.data?.content || res.data || []
  } catch(e) {
    console.error("Lỗi lấy lịch hẹn:", e)
  }
}

async function loadEnrollments() {
  try {
    const res = await enrollmentApi.getByLead(route.params.id)
    const data = res.data?.data || res.data?.content || res.data
    enrollments.value = data ? (Array.isArray(data) ? data : [data]) : []
  } catch(e) {
    console.error("Khách chưa nhập học hoặc có lỗi:", e)
    enrollments.value = []
  }
}

async function loadHistory() {
  try {
    const res = await leadApi.getHistory(route.params.id)
    history.value = res.data?.data || res.data?.content || res.data || []
    historyPage.value = 1
  } catch(e) {
    console.error("Lỗi lấy lịch sử:", e)
  }
}

async function onEnrollmentSaved() {
  showEnrollment.value = false
  ElMessage.success("Chốt sale nhập học thành công!")
  await reload()
}

onMounted(() => { reload() })
function openEdit() { showEdit.value = true }
function fmtDateTime(v) { return v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—' }

async function updateFollowUpStatus(scheduleId, status) {
  try {
    await callApi.updateFollowUp(scheduleId, status)
    ElMessage.success("Đã cập nhật trạng thái lịch hẹn!")
    await loadFollowUps()
  } catch (e) {
    console.error(e)
    ElMessage.error("Lỗi khi cập nhật lịch hẹn")
  }
}

watch(() => route.params.id, (newId, oldId) => {
  // Nếu URL thay đổi ID thì tự động tải lại dữ liệu mới
  if (newId && newId !== 'undefined' && newId !== oldId) {
    reload()
  }
})

</script>


<style scoped>
/* Bạn giữ nguyên phần <style> cũ của LeadDetailView nhé */
.detail-loading { padding: 24px; }
.lead-detail { display: flex; flex-direction: column; gap: 16px; }
.card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(16, 24, 40, 0.08); }
.detail-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.dh-left { display: flex; align-items: center; gap: 12px; }
.dh-avatar { width: 44px; height: 44px; background: #001e40; color: #ff8928; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; }
.dh-name { font-size: 16px; font-weight: 600; color: #101828; }
.dh-sub { font-size: 12.5px; color: #475467; margin-top: 2px; }
.dh-right { display: flex; align-items: center; gap: 8px; }
.detail-body { display: grid; grid-template-columns: 380px 1fr; gap: 16px; align-items: start; }
.detail-left, .detail-right { display: flex; flex-direction: column; gap: 16px; }
.section-title { font-size: 13.5px; font-weight: 600; color: #101828; margin-bottom: 14px; }
.section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 11.5px; color: #98a2b3; }
.info-value { font-size: 13px; color: #101828; font-weight: 500; word-break: break-word; }
.enrollment-list { display: flex; flex-direction: column; gap: 8px; }
.enrollment-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8f9fa; border-radius: 8px; }
.en-major { font-size: 13px; font-weight: 500; color: #101828; }
.en-sub { font-size: 12px; color: #98a2b3; margin-top: 2px; }
.followup-list { display: flex; flex-direction: column; gap: 8px; }
.fu-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f0f2f5; }
.fu-item:last-child { border-bottom: none; }
.fu-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.fu-dot.pending { background: #f79009; }
.fu-dot.done { background: #12b76a; }
.fu-dot.cancelled { background: #f04438; }
.fu-body { flex: 1; }
.fu-time { font-size: 13px; font-weight: 500; color: #101828; }
.fu-note { font-size: 12px; color: #98a2b3; }
.call-list { display: flex; flex-direction: column; gap: 8px; }
.call-item { display: flex; gap: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; }
.call-icon { width: 32px; height: 32px; background: rgba(46, 144, 250, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.call-result { font-size: 13px; font-weight: 500; color: #101828; }
.call-note { font-size: 12px; color: #475467; margin-top: 2px; }
.call-meta { font-size: 11.5px; color: #98a2b3; margin-top: 4px; }
.history-text { font-size: 13px; color: #101828; }
.history-by { font-size: 11.5px; color: #98a2b3; margin-top: 2px; }
@media (max-width: 1024px) { .detail-body { grid-template-columns: 1fr; } }
.history-pagination {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ec;
  display: flex;
  justify-content: flex-end;
}
</style>
