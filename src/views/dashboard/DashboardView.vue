<!-- src/views/dashboard/DashboardView.vue -->
<template>
  <div class="dashboard">

    <!-- Stat cards -->
    <div class="stats-grid">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }">
          <span class="icon icon-fill" :style="{ color: s.color }">{{ s.icon }}</span>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
        <div class="stat-trend" :class="s.trend >= 0 ? 'up' : 'down'">
          <span class="icon icon-sm">{{ s.trend >= 0 ? 'trending_up' : 'trending_down' }}</span>
          {{ Math.abs(s.trend) }}%
        </div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="charts-row">
      <!-- Lead theo trạng thái -->
      <div class="card chart-card">
        <div class="card-title-row">
          <span class="card-title">Hồ sơ theo trạng thái</span>
          <el-tag size="small" type="info">Tháng này</el-tag>
        </div>
        <div v-if="loadingStats" class="chart-skeleton">
          <el-skeleton :rows="4" animated />
        </div>
        <div v-else class="status-bars">
          <div
            v-for="item in leadStatusData"
            :key="item.label"
            class="status-bar-row"
          >
            <span class="status-name">{{ item.label }}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: item.pct + '%', background: item.color }"
              />
            </div>
            <span class="bar-count">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- My follow-ups -->
      <div class="card followup-card">
        <div class="card-title-row">
          <span class="card-title">Lịch follow-up hôm nay</span>
          <el-tag size="small" type="warning">{{ myFollowUps.length }} việc</el-tag>
        </div>
        <div v-if="loadingFollowUps" class="chart-skeleton">
          <el-skeleton :rows="3" animated />
        </div>
        <el-empty
          v-else-if="myFollowUps.length === 0"
          description="Không có lịch hẹn nào hôm nay"
          :image-size="80"
        />
        <div v-else class="followup-list">
          <div
            v-for="f in myFollowUps"
            :key="f.id"
            class="followup-item"
            @click="router.push('/leads/' + f.leadId)"
          >
            <div class="fu-dot" :class="f.status.toLowerCase()" />
            <div class="fu-body">
              <div class="fu-name">{{ f.leadName }}</div>
              <div class="fu-note">{{ f.note || 'Không có ghi chú' }}</div>
            </div>
            <div class="fu-time">{{ formatTime(f.followUpTime) }}</div>
            <el-button
              size="small"
              type="success"
              text
              @click.stop="markDone(f)"
            >
              <span class="icon icon-sm">check_circle</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent leads -->
    <div class="card recent-card">
      <div class="card-title-row">
        <span class="card-title">Hồ sơ gần đây</span>
        <el-button text size="small" @click="router.push('/leads')">
          Xem tất cả <span class="icon icon-sm">arrow_forward</span>
        </el-button>
      </div>
      <el-table
        :data="recentLeads"
        v-loading="loadingLeads"
        size="small"
        style="width:100%"
        row-class-name="clickable-row"
        @row-click="row => router.push('/leads/' + row.id)"
      >
        <el-table-column prop="fullName"  label="Họ tên"       min-width="160" />
        <el-table-column prop="phone"     label="SĐT"          width="130" />
        <el-table-column prop="source"    label="Nguồn"        width="120" />
        <el-table-column prop="status"    label="Trạng thái"   width="150">
          <template #default="{ row }">
            <el-tag size="small" :type="LEAD_STATUS_COLORS[row.status] || ''">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="consultantName" label="Tư vấn viên" width="160" />
        <el-table-column prop="createdAt"      label="Ngày tạo"    width="140">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }      from 'vue-router'
import { leadApi }        from '@/api/lead.api'
import { callApi }        from '@/api/call.api'
import { LEAD_STATUS_COLORS } from '@/constants/status'
import dayjs              from 'dayjs'

const router = useRouter()

const loadingStats    = ref(false)
const loadingLeads    = ref(false)
const loadingFollowUps = ref(false)

const stats = ref([
  { label: 'Tổng hồ sơ',    value: '—', icon: 'contact_page',   color: '#2e90fa', bg: 'rgba(46,144,250,0.1)', trend: 0 },
  { label: 'Đã nhập học',   value: '—', icon: 'school',         color: '#12b76a', bg: 'rgba(18,183,106,0.1)', trend: 0 },
  { label: 'Đang liên hệ',  value: '—', icon: 'phone_in_talk',  color: '#f79009', bg: 'rgba(247,144,9,0.1)',  trend: 0 },
  { label: 'Follow-up hôm nay', value: '—', icon: 'event',      color: '#ff8928', bg: 'rgba(255,137,40,0.1)', trend: 0 },
])

const leadStatusData = ref([])
const myFollowUps    = ref([])
const recentLeads    = ref([])

onMounted(async () => {
  await Promise.all([loadLeads(), loadFollowUps()])
})

async function loadLeads() {
  loadingStats.value = true
  loadingLeads.value = true
  try {
    const res = await leadApi.getList({ page: 0, size: 10, sort: 'createdAt,desc' })
    const data = res.data
    recentLeads.value = data.content || []

    // Build status breakdown
    const statusMap = {}
    recentLeads.value.forEach(l => {
      statusMap[l.status] = (statusMap[l.status] || 0) + 1
    })
    const total = recentLeads.value.length || 1
    const colorMap = {
      'Mới': '#2e90fa', 'Đang liên hệ': '#f79009', 'Quan tâm': '#a855f7',
      'Đã tư vấn': '#001e40', 'Đã nhập học': '#12b76a', 'Từ chối': '#f04438',
    }
    leadStatusData.value = Object.entries(statusMap).map(([label, count]) => ({
      label, count,
      pct: Math.round((count / total) * 100),
      color: colorMap[label] || '#98a2b3',
    }))

    stats.value[0].value = data.totalElements?.toString() || '—'
    const enrolled = (data.content || []).filter(l => l.status === 'Đã nhập học').length
    stats.value[1].value = enrolled.toString()
    const inContact = (data.content || []).filter(l => l.status === 'Đang liên hệ').length
    stats.value[2].value = inContact.toString()
  } finally {
    loadingStats.value = false
    loadingLeads.value = false
  }
}

async function loadFollowUps() {
  loadingFollowUps.value = true
  try {
    const res = await callApi.getMyFollowUps()
    const today = dayjs().format('YYYY-MM-DD')
    myFollowUps.value = (res.data || []).filter(f =>
      f.status === 'PENDING' && dayjs(f.followUpTime).format('YYYY-MM-DD') === today
    )
    stats.value[3].value = myFollowUps.value.length.toString()
  } finally {
    loadingFollowUps.value = false
  }
}

async function markDone(f) {
  await callApi.updateFollowUp(f.id, 'DONE')
  myFollowUps.value = myFollowUps.value.filter(x => x.id !== f.id)
}

function formatDate(v) { return v ? dayjs(v).format('DD/MM/YYYY') : '—' }
function formatTime(v) { return v ? dayjs(v).format('HH:mm') : '—' }
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }

/* Stat cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.08);
}

.stat-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-body { flex: 1; min-width: 0; }

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #101828;
  line-height: 1.2;
}

.stat-label {
  font-size: 12.5px;
  color: #475467;
  margin-top: 2px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.stat-trend.up   { color: #12b76a; }
.stat-trend.down { color: #f04438; }

/* Charts row */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.08);
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #101828;
}

.chart-skeleton { padding: 8px 0; }

/* Status bars */
.status-bars { display: flex; flex-direction: column; gap: 10px; }

.status-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-name {
  font-size: 12.5px;
  color: #475467;
  width: 120px;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.bar-count {
  font-size: 12px;
  font-weight: 600;
  color: #101828;
  width: 28px;
  text-align: right;
}

/* Follow-ups */
.followup-list { display: flex; flex-direction: column; gap: 4px; max-height: 280px; overflow-y: auto; }

.followup-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.followup-item:hover { background: #f8f9fa; }

.fu-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.fu-dot.pending { background: #f79009; }
.fu-dot.done    { background: #12b76a; }

.fu-body { flex: 1; min-width: 0; }

.fu-name {
  font-size: 13px;
  font-weight: 500;
  color: #101828;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fu-note {
  font-size: 12px;
  color: #98a2b3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fu-time {
  font-size: 12px;
  color: #475467;
  flex-shrink: 0;
}

/* Recent leads */
.recent-card { overflow: hidden; }

:deep(.clickable-row) { cursor: pointer; }
:deep(.clickable-row:hover td) { background: #f8f9fa !important; }

@media (max-width: 1100px) {
  .stats-grid  { grid-template-columns: repeat(2, 1fr); }
  .charts-row  { grid-template-columns: 1fr; }
}
</style>
