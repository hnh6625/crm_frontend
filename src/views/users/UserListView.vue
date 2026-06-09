<!-- src/views/users/UserListView.vue -->
<template>
  <div class="user-list">

    <!-- Toolbar -->
    <div class="toolbar card">
      <div class="toolbar-filters">
        <el-input
          v-model="filters.keyword"
          placeholder="Tìm tên, username, email..."
          clearable
          style="width:240px"
          :prefix-icon="Search"
          @input="debounceFetch"
        />
        <el-select v-model="filters.role" placeholder="Vai trò" clearable style="width:160px" @change="fetchList">
          <el-option v-for="(label, key) in ROLE_LABELS" :key="key" :label="label" :value="key" />
        </el-select>
        <el-select v-model="filters.status" placeholder="Trạng thái" clearable style="width:140px" @change="fetchList">
          <el-option label="Hoạt động"  value="ACTIVE"   />
          <el-option label="Khoá"       value="LOCKED"   />
          <el-option label="Vô hiệu"    value="INACTIVE" />
        </el-select>
      </div>
      <div class="toolbar-actions">
        <el-button @click="fetchList">
          <span class="icon icon-sm">refresh</span>
        </el-button>
        <el-button type="primary" @click="openForm(null)">
          <span class="icon icon-sm">person_add</span>
          Thêm người dùng
        </el-button>
      </div>
    </div>

    <!-- Table -->
    <div class="card table-card">
      <el-table
        :data="userStore.list"
        v-loading="userStore.loading"
        style="width:100%"
      >
        <el-table-column prop="fullName" label="Họ và tên" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" class="user-av">{{ initials(row.fullName) }}</el-avatar>
              <div>
                <div class="cell-name">{{ row.fullName }}</div>
                <div class="cell-sub">{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email"  label="Email"   min-width="200" />
        <el-table-column prop="phone"  label="SĐT"     width="130" />
        <el-table-column prop="role"   label="Vai trò" width="160">
          <template #default="{ row }">
            <el-tag size="small" :type="ROLE_COLORS[row.role] || ''">{{ ROLE_LABELS[row.role] || row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Trạng thái" width="130">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="Ngày tạo" width="120">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="" width="60" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click">
              <el-button text size="small">
                <span class="icon">more_vert</span>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openForm(row)">
                    <span class="icon icon-sm" style="margin-right:6px">edit</span>Chỉnh sửa
                  </el-dropdown-item>
                  <el-dropdown-item @click="resetPassword(row)">
                    <span class="icon icon-sm" style="margin-right:6px">lock_reset</span>Reset mật khẩu
                  </el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'LOCKED'" @click="unlock(row)">
                    <span class="icon icon-sm" style="margin-right:6px">lock_open</span>Mở khoá
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 'ACTIVE'"
                    @click="toggleStatus(row, 'INACTIVE')"
                  >
                    <span class="icon icon-sm" style="margin-right:6px;color:#f79009">block</span>
                    <span style="color:#f79009">Vô hiệu hoá</span>
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 'INACTIVE'"
                    @click="toggleStatus(row, 'ACTIVE')"
                  >
                    <span class="icon icon-sm" style="margin-right:6px;color:#12b76a">check_circle</span>
                    <span style="color:#12b76a">Kích hoạt</span>
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="confirmDelete(row)">
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
        <span class="total-text">Tổng: {{ userStore.total }} người dùng</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="userStore.total"
          layout="sizes, prev, pager, next"
          @change="fetchList"
        />
      </div>
    </div>

    <UserFormDialog
      v-model="showForm"
      :user="editUser"
      @saved="fetchList"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted }  from 'vue'
import { ElMessageBox }              from 'element-plus'
import { Search }                    from '@element-plus/icons-vue'
import { useUserStore }              from '@/stores/user.store'
import { ROLE_LABELS, ROLE_COLORS }  from '@/constants/role'
import UserFormDialog                from './UserFormDialog.vue'
import dayjs                         from 'dayjs'

const userStore = useUserStore()
const page      = ref(1)
const pageSize  = ref(20)
const filters   = reactive({ keyword: '', role: '', status: '' })

const showForm  = ref(false)
const editUser  = ref(null)
let debounceTimer = null

onMounted(fetchList)

function fetchList() {
  userStore.fetchList({
    page:    page.value - 1,
    size:    pageSize.value,
    keyword: filters.keyword || undefined,
    role:    filters.role    || undefined,
    status:  filters.status  || undefined,
  })
}

function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchList, 400)
}

function openForm(user) {
  editUser.value = user
  showForm.value = true
}

async function resetPassword(row) {
  await ElMessageBox.confirm(`Reset mật khẩu cho <b>${row.fullName}</b>?`, 'Xác nhận', {
    dangerouslyUseHTMLString: true, type: 'warning',
    confirmButtonText: 'Reset', cancelButtonText: 'Huỷ',
  })
  await userStore.resetPassword(row.id)
}

async function unlock(row) {
  await userStore.unlock(row.id)
  fetchList()
}

async function toggleStatus(row, status) {
  await userStore.updateStatus(row.id, status)
  fetchList()
}

async function confirmDelete(row) {
  await ElMessageBox.confirm(
    `Bạn có chắc muốn xoá người dùng <b>${row.fullName}</b>?`,
    'Xác nhận xoá',
    { dangerouslyUseHTMLString: true, type: 'warning', confirmButtonText: 'Xoá', cancelButtonText: 'Huỷ' }
  )
  await userStore.remove(row.id)
  fetchList()
}

function initials(name) {
  return (name || '').split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'U'
}

function statusLabel(s) {
  return { ACTIVE: 'Hoạt động', LOCKED: 'Bị khoá', INACTIVE: 'Vô hiệu' }[s] || s
}

function statusType(s) {
  return { ACTIVE: 'success', LOCKED: 'danger', INACTIVE: 'info' }[s] || ''
}

function fmtDate(v) { return v ? dayjs(v).format('DD/MM/YYYY') : '—' }
</script>

<style scoped>
.user-list { display: flex; flex-direction: column; gap: 16px; }

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
.toolbar-actions { display: flex; gap: 8px; }
.table-card { overflow: hidden; }

.user-cell { display: flex; align-items: center; gap: 10px; }

.user-av {
  background: #001e40 !important;
  color: #ff8928 !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  flex-shrink: 0;
}

.cell-name { font-size: 13.5px; font-weight: 500; color: #101828; }
.cell-sub  { font-size: 12px;   color: #98a2b3; }

.pagination-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #f0f2f5;
}

.total-text { font-size: 13px; color: #475467; }
</style>
