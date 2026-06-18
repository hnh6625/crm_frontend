<template>
  <div class="dashboard">

    <div class="stats-grid">
      <div class="stat-card" v-for="s in stats" :key="s.label">
        <div class="stat-icon" :style="{ background: s.bg }">
          <span class="icon icon-fill" :style="{ color: s.color }">{{ s.icon }}</span>
        </div>
        <div class="stat-body">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
        <div class="stat-trend" :class="s.trend >= 0 ? 'up' : 'down'" v-if="s.trend !== 0">
          <span class="icon icon-sm">{{ s.trend >= 0 ? 'trending_up' : 'trending_down' }}</span>
          {{ Math.abs(s.trend) }}%
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="card chart-card">
        <div class="card-title-row">
          <span class="card-title">Hồ sơ theo trạng thái (Toàn hệ thống)</span>
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
            :key="f.scheduleId"
            class="followup-item"
            @click="router.push('/leads/' + f.leadId)"
          >
            <div class="fu-dot" :class="f.status.toLowerCase()" />
            <div class="fu-body">
              <div class="fu-name">{{ f.leadName || 'Hồ sơ chưa có tên' }}</div>
              <div class="fu-note">{{ f.note || 'Không có ghi chú' }}</div>
            </div>
            <div class="fu-time">{{ formatTime(f.scheduledAt) }}</div>
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
        @row-click="row => router.push('/leads/' + (row.leadId || row.id))"
      >
        <el-table-column prop="fullName"       label="Họ tên"       min-width="160" />
        <el-table-column prop="phone"          label="SĐT"          width="130" />
        <el-table-column prop="sourceName"     label="Nguồn"        width="120" />
        <el-table-column prop="statusName"     label="Trạng thái"   width="150">
          <template #default="{ row }">
            <el-tag size="small" :type="LEAD_STATUS_COLORS[row.statusName] || 'info'">
              {{ row.statusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedToName" label="Tư vấn viên" width="160" />
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
import { ElMessage }      from 'element-plus'
import dayjs              from 'dayjs'

const router = useRouter()

const loadingStats    = ref(false)
const loadingLeads    = ref(false)
const loadingFollowUps = ref(false)

const stats = ref([
  { label: 'Tổng hồ sơ',    value: '0', icon: 'contact_page',   color: '#2e90fa', bg: 'rgba(46,144,250,0.1)', trend: 0 },
  { label: 'Đã nhập học',   value: '0', icon: 'school',         color: '#12b76a', bg: 'rgba(18,183,106,0.1)', trend: 0 },
  { label: 'Đang liên hệ',  value: '0', icon: 'phone_in_talk',  color: '#f79009', bg: 'rgba(247,144,9,0.1)',  trend: 0 },
  { label: 'Follow-up hôm nay', value: '0', icon: 'event',      color: '#ff8928', bg: 'rgba(255,137,40,0.1)', trend: 0 },
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
    const resRecent = await leadApi.getList({ page: 0, size: 5, sort: 'createdAt,desc' })
    recentLeads.value = resRecent.data?.content || resRecent.data || []

    const resAll = await leadApi.getList({ page: 0, size: 10000 })
    const allLeads = resAll.data?.content || resAll.data || []

    stats.value[0].value = resAll.data?.totalElements?.toString() || allLeads.length.toString()

    const statusMap = {}
    let enrolledCount = 0
    let inContactCount = 0

    allLeads.forEach(l => {
      const st = l.statusName || 'Khác'
      statusMap[st] = (statusMap[st] || 0) + 1
      if (st === 'Đã nhập học' || st === 'Nhập học') enrolledCount++
      if (st === 'Đang liên hệ') inContactCount++
    })

    stats.value[1].value = enrolledCount.toString()
    stats.value[2].value = inContactCount.toString()

    const total = allLeads.length || 1
    const colorMap = {
      'Mới': '#2e90fa', 'Đang liên hệ': '#f79009', 'Quan tâm': '#a855f7',
      'Đã tư vấn': '#001e40', 'Đã nhập học': '#12b76a', 'Từ chối': '#f04438',
    }

    leadStatusData.value = Object.entries(statusMap)
      .map(([label, count]) => ({
        label, count,
        pct: Math.round((count / total) * 100),
        color: colorMap[label] || '#98a2b3',
      }))
      .sort((a, b) => b.count - a.count)

  } catch (e) {
    console.error("Lỗi lấy dữ liệu Dashboard:", e)
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
    const allFollowUps = res.data?.data || res.data || []

    // ĐÃ SỬA: Đổi từ f.followUpTime thành f.scheduledAt
    myFollowUps.value = allFollowUps.filter(f =>
      f.status === 'PENDING' && dayjs(f.scheduledAt).format('YYYY-MM-DD') === today
    )
    stats.value[3].value = myFollowUps.value.length.toString()
  } catch (e) {
    console.error("Lỗi lấy Follow-up:", e)
  } finally {
    loadingFollowUps.value = false
  }
}

async function markDone(f) {
  try {
    // ĐÃ SỬA: Dùng f.scheduleId thay vì f.id
    await callApi.updateFollowUp(f.scheduleId, 'DONE')
    myFollowUps.value = myFollowUps.value.filter(x => x.scheduleId !== f.scheduleId)
    stats.value[3].value = myFollowUps.value.length.toString()
    ElMessage.success("Đã hoàn tất lịch hẹn!")
  } catch (e) {
    ElMessage.error("Lỗi khi cập nhật trạng thái!", e)
  }
}

function formatDate(v) { return v ? dayjs(v).format('DD/MM/YYYY') : '—' }
function formatTime(v) { return v ? dayjs(v).format('HH:mm') : '—' }
</script>

<style scoped>
/* Giữ nguyên toàn bộ CSS cũ của bạn, không cần thay đổi gì ở đây */
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
