<!-- src/views/leads/LeadDetailView.vue -->
<template>
  <div v-if="loading" class="detail-loading">
    <el-skeleton :rows="8" animated/>
  </div>

  <div v-else-if="lead" class="lead-detail">

    <!-- Header -->
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
        <el-tag :type="LEAD_STATUS_COLORS[lead.statusName] || 'info'" size="large">{{ lead.statusName || '-' }}
        </el-tag>
        <el-button @click="openEdit">
          <span class="icon icon-sm">edit</span> Chỉnh sửa
        </el-button>
        <el-button type="primary" @click="showCallLog = true">
          <span class="icon icon-sm">phone</span> Ghi cuộc gọi
        </el-button>
      </div>
    </div>

    <!-- Body -->
    <div class="detail-body">

      <!-- Left: info + enrollment -->
      <div class="detail-left">

        <!-- Info card -->
        <div class="card info-card">
          <div class="section-title">Thông tin hồ sơ</div>
          <div class="info-grid">
            <div class="info-item" v-for="f in infoFields" :key="f.label">
              <span class="info-label">{{ f.label }}</span>
              <span class="info-value">{{ f.value || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Enrollment -->
        <div class="card enrollment-card">
          <div class="section-title-row">
            <span class="section-title">Đăng ký nhập học</span>
            <el-button size="small" type="primary" text @click="showEnrollment = true">
              <span class="icon icon-sm">add</span> Thêm
            </el-button>
          </div>
          <el-empty v-if="enrollments.length === 0" description="Chưa có đăng ký nhập học"
                    :image-size="60"/>
          <div v-else class="enrollment-list">
            <div v-for="e in enrollments" :key="e.id" class="enrollment-item">
              <div>
                <div class="en-major">{{ e.majorName }}</div>
                <div class="en-sub">{{ e.campusName }} · {{ e.semesterName }}</div>
              </div>
              <el-tag size="small" :type="ENROLLMENT_STATUS_COLORS[e.status]">
                {{ ENROLLMENT_STATUS_LABELS[e.status] }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: call history + follow-up -->
      <div class="detail-right">

        <!-- Follow-up -->
        <div class="card fu-card">
          <div class="section-title-row">
            <span class="section-title">Lịch hẹn follow-up</span>
            <el-button size="small" type="primary" text @click="showFollowUp = true">
              <span class="icon icon-sm">add</span> Đặt lịch
            </el-button>
          </div>
          <el-empty v-if="followUps.length === 0" description="Chưa có lịch hẹn" :image-size="60"/>
          <div v-else class="followup-list">
            <div v-for="f in followUps" :key="f.id" class="fu-item">
              <div class="fu-dot" :class="f.status.toLowerCase()"/>
              <div class="fu-body">
                <div class="fu-time">{{ fmtDateTime(f.followUpTime) }}</div>
                <div class="fu-note">{{ f.note || 'Không có ghi chú' }}</div>
              </div>
              <el-tag size="small"
                      :type="f.status === 'DONE' ? 'success' : f.status === 'CANCELLED' ? 'danger' : 'warning'">
                {{ FOLLOW_UP_STATUS_LABELS[f.status] }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- Call history -->
        <div class="card call-card">
          <div class="section-title">Lịch sử cuộc gọi</div>
          <el-empty v-if="calls.length === 0" description="Chưa có cuộc gọi nào" :image-size="60"/>
          <div v-else class="call-list">
            <div v-for="c in calls" :key="c.id" class="call-item">
              <div class="call-icon">
                <span class="icon icon-fill" style="font-size:16px;color:#2e90fa">phone</span>
              </div>
              <div class="call-body">
                <div class="call-result">{{ c.result }} · {{
                    c.duration ? c.duration + 's' : 'N/A'
                  }}
                </div>
                <div class="call-note">{{ c.note || 'Không có ghi chú' }}</div>
                <div class="call-meta">{{ c.consultantName }} · {{ fmtDateTime(c.callTime) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- History timeline -->
        <div class="card history-card">
          <div class="section-title">Lịch sử thay đổi</div>
          <el-timeline>
            <el-timeline-item
              v-for="h in history"
              :key="h.id"
              :timestamp="fmtDateTime(h.createdAt)"
              placement="top"
            >
              <div class="history-text">{{ h.description }}</div>
              <div class="history-by">{{ h.createdBy }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <LeadFormDialog v-model="showEdit" :lead="lead" @saved="reload"/>
    <CallLogDialog v-model="showCallLog" :lead-id="lead.id" @saved="loadCalls"/>
    <FollowUpDialog v-model="showFollowUp" :lead-id="lead.id" @saved="loadFollowUps"/>

    <el-dialog v-model="showEnrollment" title="Thêm đăng ký nhập học" width="500px"
               destroy-on-close>
      <EnrollmentFormInline :lead-id="lead.id" @saved="loadEnrollments(); showEnrollment = false"/>
    </el-dialog>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus';
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { leadApi } from '@/api/lead.api'
import { callApi } from '@/api/call.api'
import { enrollmentApi } from '@/api/enrollment.api'
import {
  LEAD_STATUS_COLORS,
  ENROLLMENT_STATUS_COLORS,
  ENROLLMENT_STATUS_LABELS,
  FOLLOW_UP_STATUS_LABELS
} from '@/constants/status'
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

const showEdit = ref(false)
const showCallLog = ref(false)
const showFollowUp = ref(false)
const showEnrollment = ref(false)

const initials = computed(() => {
  const n = lead.value?.fullName || ''
  return n.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'N'
})

const infoFields = computed(() => [
  {label: 'Họ và tên', value: lead.value?.fullName},
  {label: 'SĐT', value: lead.value?.phone},
  {label: 'Email', value: lead.value?.email},
  {label: 'Năm sinh', value: lead.value?.birthYear },
  {label: 'Nguồn', value: lead.value?.sourceName || '-'},
  { label: 'Trạng thái', value: lead.value?.statusName || '-' },
  {label: 'Tags', value: (lead.value?.tags || []).join(', ')},
  {label: 'Tư vấn viên', value: lead.value?.consultantName},
  {label: 'Ghi chú', value: lead.value?.notes},
])

// Tải toàn bộ dữ liệu trang chi tiết
async function reload() {
  console.log("LEAD FULL =", lead.value)
  console.log("LEAD DETAIL DATA =", lead.value)
  const currentId = route.params.id;


  // Bẫy lỗi bảo vệ: Chặn ID rác từ URL
  if (!currentId || currentId === 'undefined' || currentId === 'null') {
    ElMessage.error('Mã hồ sơ không hợp lệ!');
    router.replace('/leads');
    return;
  }

  loading.value = true
  try {
    const res = await leadApi.getById(currentId)
    console.log("API FULL RESPONSE =", res)
    console.log("API DATA =", res.data)
    lead.value = res.data?.data || res.data // Tự động bóc tách JSON

    // Đợi tải xong thông tin cơ bản rồi tải tiếp các danh sách phụ
    await Promise.all([
      loadCalls(),
      loadFollowUps(),
      loadEnrollments(),
      loadHistory()
    ])
  } catch (e) {
    console.error(e)
    ElMessage.error('Không thể lấy thông tin hồ sơ!')
    router.replace('/leads')
  } finally {
    loading.value = false
  }
}

async function loadCalls() {
  const res = await callApi.getCallsByLead(route.params.id)
  calls.value = res.data?.content || res.data || []
}

async function loadFollowUps() {
  const res = await callApi.getFollowUpsByLead(route.params.id)
  followUps.value = res.data?.content || res.data || []
}

async function loadEnrollments() {
  const res = await enrollmentApi.getByLead(route.params.id)
  enrollments.value = res.data?.content || res.data || []
}

async function loadHistory() {
  const res = await leadApi.getHistory(route.params.id)
  history.value = res.data?.content || res.data || []
}

onMounted(() => {
  reload()
})

function openEdit() {
  showEdit.value = true
}

function fmtDateTime(v) {
  return v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'
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

/* Header */
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

/* Body */
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

/* Info */
.section-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #101828;
  margin-bottom: 14px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
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

/* Enrollment */
.enrollment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.enrollment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.en-major {
  font-size: 13px;
  font-weight: 500;
  color: #101828;
}

.en-sub {
  font-size: 12px;
  color: #98a2b3;
  margin-top: 2px;
}

/* Follow-up */
.followup-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fu-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}

.fu-item:last-child {
  border-bottom: none;
}

.fu-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.fu-dot.pending {
  background: #f79009;
}

.fu-dot.done {
  background: #12b76a;
}

.fu-dot.cancelled {
  background: #f04438;
}

.fu-body {
  flex: 1;
}

.fu-time {
  font-size: 13px;
  font-weight: 500;
  color: #101828;
}

.fu-note {
  font-size: 12px;
  color: #98a2b3;
}

/* Calls */
.call-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.call-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.call-icon {
  width: 32px;
  height: 32px;
  background: rgba(46, 144, 250, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.call-result {
  font-size: 13px;
  font-weight: 500;
  color: #101828;
}

.call-note {
  font-size: 12px;
  color: #475467;
  margin-top: 2px;
}

.call-meta {
  font-size: 11.5px;
  color: #98a2b3;
  margin-top: 4px;
}

/* History */
.history-text {
  font-size: 13px;
  color: #101828;
}

.history-by {
  font-size: 11.5px;
  color: #98a2b3;
  margin-top: 2px;
}

@media (max-width: 1024px) {
  .detail-body {
    grid-template-columns: 1fr;
  }
}
</style>
