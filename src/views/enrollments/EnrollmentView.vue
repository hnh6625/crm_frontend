<!-- src/views/enrollments/EnrollmentView.vue -->
<template>
  <div class="enrollment-view">

    <!-- Toolbar -->
    <div class="toolbar card">
      <div class="toolbar-filters">
        <el-input
          v-model="filters.keyword"
          placeholder="Tìm tên sinh viên..."
          clearable
          style="width:220px"
          :prefix-icon="Search"
          @input="debounceFetch"
        />
        <el-select v-model="filters.status" placeholder="Trạng thái" clearable style="width:160px" @change="fetchList">
          <el-option
            v-for="(label, key) in ENROLLMENT_STATUS_LABELS"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-select v-model="filters.campusId" placeholder="Cơ sở" clearable style="width:150px" @change="fetchList">
          <el-option v-for="c in campuses" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="filters.semesterId" placeholder="Học kỳ" clearable style="width:160px" @change="fetchList">
          <el-option v-for="s in semesters" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </div>
      <div class="toolbar-actions">
        <el-button @click="fetchList">
          <span class="icon icon-sm">refresh</span>
        </el-button>
        <el-button type="primary" @click="openDialog(null)">
          <span class="icon icon-sm">add</span> Thêm đăng ký
        </el-button>
      </div>
    </div>

    <!-- Table -->
    <div class="card table-card">
      <el-table
        :data="store.list"
        v-loading="store.loading"
        style="width:100%"
      >
        <el-table-column prop="leadName"    label="Sinh viên"       min-width="160" />
        <el-table-column prop="majorName"   label="Ngành"           min-width="160" />
        <el-table-column prop="campusName"  label="Cơ sở"           width="140" />
        <el-table-column prop="semesterName" label="Học kỳ"         width="140" />
        <el-table-column prop="status"      label="Trạng thái"      width="150">
          <template #default="{ row }">
            <el-tag size="small" :type="ENROLLMENT_STATUS_COLORS[row.status]">
              {{ ENROLLMENT_STATUS_LABELS[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt"   label="Ngày tạo"        width="120">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label=""           width="120" fixed="right">
          <template #default="{ row }">
            <div style="display:flex;gap:4px">
              <el-button size="small" text @click="openDialog(row)">
                <span class="icon icon-sm">edit</span>
              </el-button>
              <el-dropdown trigger="click">
                <el-button size="small" text>
                  <span class="icon icon-sm">more_horiz</span>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="(label, key) in ENROLLMENT_STATUS_LABELS"
                      :key="key"
                      @click="changeStatus(row, key)"
                    >{{ label }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <span class="total-text">Tổng: {{ store.total }} đăng ký</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="store.total"
          layout="sizes, prev, pager, next"
          @change="fetchList"
        />
      </div>
    </div>

    <EnrollmentDialog
      v-model="showDialog"
      :enrollment="editItem"
      :campuses="campuses"
      :majors="majors"
      :semesters="semesters"
      @saved="fetchList"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search }                   from '@element-plus/icons-vue'
import { useEnrollmentStore }       from '@/stores/enrollment.store'
import { ENROLLMENT_STATUS_LABELS, ENROLLMENT_STATUS_COLORS } from '@/constants/status'
import EnrollmentDialog             from './EnrollmentDialog.vue'
import dayjs                        from 'dayjs'

const store    = useEnrollmentStore()
const page     = ref(1)
const pageSize = ref(20)
const filters  = reactive({ keyword: '', status: '', campusId: '', semesterId: '' })

const showDialog = ref(false)
const editItem   = ref(null)
const campuses   = ref([])
const majors     = ref([])
const semesters  = ref([])
let debounceTimer = null

onMounted(async () => {
  await store.fetchDropdowns()
  campuses.value  = store.campuses
  majors.value    = store.majors
  semesters.value = store.semesters
  fetchList()
})

function fetchList() {
  store.fetchList({
    page: page.value - 1,
    size: pageSize.value,
    keyword:    filters.keyword    || undefined,
    status:     filters.status     || undefined,
    campusId:   filters.campusId   || undefined,
    semesterId: filters.semesterId || undefined,
  })
}

function debounceFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchList, 400)
}

function openDialog(item) {
  editItem.value  = item
  showDialog.value = true
}

async function changeStatus(row, status) {
  await store.updateStatus(row.id, status)
  fetchList()
}

function fmtDate(v) { return v ? dayjs(v).format('DD/MM/YYYY') : '—' }
</script>

<style scoped>
.enrollment-view { display: flex; flex-direction: column; gap: 16px; }

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

.pagination-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #f0f2f5;
}

.total-text { font-size: 13px; color: #475467; }
</style>
