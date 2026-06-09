<template>
  <div class="lead-list">

    <!-- Toolbar -->
    <div class="toolbar card">
      <div class="toolbar-filters">
        <el-input
          v-model="filters.keyword"
          placeholder="Tìm tên, SĐT, email..."
          clearable
          style="width:220px"
          :prefix-icon="Search"
          @input="debounceFetch"
        />
        <el-select v-model="filters.source" placeholder="Nguồn" clearable style="width: 140px" @change="handleFilterChange">
          <el-option
            v-for="src in leadStore.sources"
            :key="src.sourceId"
            :label="src.sourceName"
            :value="src.sourceId"
          />
        </el-select>

        <el-select v-model="filters.status" placeholder="Trạng thái" clearable style="width: 140px" @change="handleFilterChange">
          <el-option
            v-for="st in (leadStore.statuses || [])"
            :key="st.statusId"
            :label="st.statusName"
            :value="st.statusId"
          />
        </el-select>

        <el-select
          v-if="authStore.isAdmin"
          v-model="filters.consultantId"
          placeholder="Tư vấn viên"
          clearable
          style="width:180px"
          @change="handleFilterChange"
        >
          <el-option
            v-for="u in consultants"
            :key="u.userId"
            :label="u.fullName"
            :value="u.userId"
          />
        </el-select>
      </div>

      <div class="toolbar-actions">
        <el-button @click="fetchLeads">
          <span class="icon icon-sm">refresh</span>
        </el-button>
        <el-button v-if="authStore.isAdmin" @click="openAssignDialog" :disabled="selectedRows.length === 0">
          <span class="icon icon-sm">assignment_ind</span> Phân công
        </el-button>
        <el-button type="primary" @click="openForm(null)">
          <span class="icon icon-sm">add</span> Thêm hồ sơ
        </el-button>
      </div>
    </div>

    <!-- Table -->
    <div class="card table-card">
      <el-table
        ref="tableRef"
        :data="leadStore.list"
        v-loading="leadStore.loading"
        style="width:100%"
        row-class-name="clickable-row"
        @row-click="row => router.push('/leads/' + getLeadId(row))"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="44" @click.stop/>
        <el-table-column prop="fullName" label="Họ và tên" min-width="160">
          <template #default="{ row }">
            <div class="lead-name">{{ row.fullName }}</div>
            <div class="lead-sub">{{ row.email || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="SĐT" width="130"/>
        <el-table-column prop="sourceName" label="Nguồn" width="120"/>
        <el-table-column prop="statusName" label="Trạng thái" width="160">
          <template #default="{ row }">
            <el-tag :type="LEAD_STATUS_COLORS[row.statusName] || 'info'" size="small">
              {{ row.statusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="Tags" width="160">
          <template #default="{ row }">
            <el-tag
              v-for="t in (row.tags || []).slice(0, 2)"
              :key="t"
              size="small"
              style="margin-right:4px"
            >{{ t }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedToName" label="Tư vấn viên" width="160"/>
        <el-table-column prop="createdAt" label="Ngày tạo" width="120">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="" width="80" fixed="right" @click.stop>
          <template #default="{ row }">
            <el-dropdown trigger="click" @click.stop>
              <el-button text size="small" @click.stop>
                <span class="icon">more_vert</span>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click.stop="router.push('/leads/' + getLeadId(row))">
                    <span class="icon icon-sm" style="margin-right:6px">open_in_new</span>Chi tiết
                  </el-dropdown-item>
                  <el-dropdown-item @click.stop="openForm(row)">
                    <span class="icon icon-sm" style="margin-right:6px">edit</span>Chỉnh sửa
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="authStore.isAdmin"
                    divided
                    @click.stop="confirmDelete(row)"
                  >
                    <span class="icon icon-sm" style="margin-right:6px;color:#f04438">delete</span>
                    <span style="color:#f04438">Xoá</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <span class="total-text">Tổng: {{ leadStore.total }} hồ sơ</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="leadStore.total"
          layout="sizes, prev, pager, next"
          @change="fetchLeads"
        />
      </div>
    </div>

    <!-- Lead Form Dialog -->
    <LeadFormDialog
      v-model="showForm"
      :lead="editLead"
      @saved="fetchLeads"
    />

    <!-- Assign Dialog -->
    <el-dialog v-model="showAssign" title="Phân công hồ sơ" width="400px">
      <p style="color:#475467;font-size:13px;margin-bottom:16px">
        Đã chọn <b>{{ selectedRows.length }}</b> hồ sơ
      </p>
      <el-select v-model="assignedTo" placeholder="Chọn tư vấn viên" style="width:100%">
        <el-option v-for="u in consultants" :key="u.userId" :label="u.fullName" :value="u.userId"/>
      </el-select>
      <template #footer>
        <el-button @click="showAssign = false">Huỷ</el-button>
        <el-button type="primary" :loading="assigning" @click="doAssign">Phân công</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useLeadStore } from '@/stores/lead.store'
import { useAuthStore } from '@/stores/auth.store'
import { userApi } from '@/api/user.api'
import { LEAD_STATUS_COLORS } from '@/constants/status'
import LeadFormDialog from './LeadFormDialog.vue'
import dayjs from 'dayjs'

const router = useRouter()
const leadStore = useLeadStore()
const authStore = useAuthStore()

const tableRef = ref(null) // Dùng để clear selection
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ keyword: '', status: '', source: '', consultantId: '' })

const showForm = ref(false)
const editLead = ref(null)
const showAssign = ref(false)
const assignedTo = ref('')
const assigning = ref(false)
const selectedRows = ref([])
const consultants = ref([])
let debounceTimer = null

onMounted(async () => {
  await leadStore.fetchDropdowns()

  if (authStore.isAdmin) {
    try {
      const res = await userApi.getConsultants()
      consultants.value = res.data?.data || res.data || []
    } catch (e) {
      console.error('Không thể lấy danh sách tư vấn viên:', e)
    }
  }
  fetchLeads()
})

function fetchLeads() {
  const params = {
    page: page.value - 1,
    size: pageSize.value,
    sort: 'createdAt,desc',
    keyword: filters.keyword || undefined,
    status: filters.status || undefined,
    source: filters.source || undefined,
    consultantId: filters.consultantId || undefined,
  }
  leadStore.fetchList(params)
}

function handleFilterChange() {
  page.value = 1 // Reset về trang 1 khi lọc
  fetchLeads()
}

function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    handleFilterChange()
  }, 400)
}

function openForm(lead) {
  editLead.value = lead ? { ...lead } : null
  showForm.value = true
}

function openAssignDialog() {
  if (!selectedRows.value.length) {
    ElMessage.warning('Vui lòng chọn ít nhất 1 hồ sơ')
    return
  }
  assignedTo.value = ''
  showAssign.value = true
}

async function doAssign() {
  if (!assignedTo.value) {
    ElMessage.warning('Vui lòng chọn nhân viên tư vấn!')
    return
  }

  assigning.value = true
  try {
    // Duyệt qua từng row đã được tích chọn
    const promises = selectedRows.value.map(row => {
      const id = getLeadId(row)
      const payload = {
        assignToUserId: assignedTo.value,
        note: "Được phân công từ hệ thống" // Có thể để trống nếu không cần
      }

      return leadStore.assign(id, payload)
    })

    // Chờ tất cả các request phân công chạy xong
    await Promise.all(promises)

    ElMessage.success(`Đã phân công thành công ${selectedRows.value.length} hồ sơ!`)

    // Đóng popup, tải lại danh sách và bỏ tích các ô checkbox
    showAssign.value = false
    fetchLeads()

    if (tableRef.value) {
      tableRef.value.clearSelection()
    }
  } catch (e) {
    ElMessage.error('Phân công thất bại, vui lòng kiểm tra lại!')
    console.error('Assign error:', e)
  } finally {
    assigning.value = false
  }
}

function getLeadId(row) {
  return row.leadId || row.id
}

async function confirmDelete(row) {
  await ElMessageBox.confirm(
    `Bạn có chắc muốn xoá hồ sơ <b>${row.fullName}</b>?`,
    'Xác nhận xoá',
    {
      dangerouslyUseHTMLString: true,
      type: 'warning',
      confirmButtonText: 'Xoá',
      cancelButtonText: 'Huỷ'
    }
  )
  await leadStore.remove(getLeadId(row))

  // Nếu xóa phần tử cuối cùng của trang hiện tại thì lùi lại 1 trang
  if (leadStore.list.length === 1 && page.value > 1) {
    page.value -= 1
  }
  fetchLeads()
}

function fmtDate(v) {
  return v ? dayjs(v).format('DD/MM/YYYY') : '—'
}
</script>

<style scoped>
.lead-list {
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
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.table-card {
  overflow: hidden;
}

.lead-name {
  font-size: 13.5px;
  font-weight: 500;
  color: #101828;
}

.lead-sub {
  font-size: 12px;
  color: #98a2b3;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #f0f2f5;
}

.total-text {
  font-size: 13px;
  color: #475467;
}

:deep(.clickable-row) {
  cursor: pointer;
}

:deep(.clickable-row:hover td) {
  background: #f8f9fa !important;
}
</style>
