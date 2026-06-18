<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': collapsed }">

    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <span class="icon icon-fill" style="font-size:22px;color:#ff8928">school</span>
        </div>
        <transition name="label-fade">
          <div v-if="!collapsed" class="logo-text">
            <span class="logo-name">EduCRM</span>
            <span class="logo-sub">Tư vấn tuyển sinh</span>
          </div>
        </transition>
      </div>

      <nav class="sidebar-nav">
        <div
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path), hidden: item.adminOnly && !authStore.isAdmin }"
          @click="router.push(item.path)"
        >
          <el-tooltip
            :content="item.label"
            placement="right"
            :disabled="!collapsed"
          >
            <div class="nav-item-inner">
              <span class="icon nav-icon" :class="{ 'icon-fill': isActive(item.path) }">
                {{ item.icon }}
              </span>
              <transition name="label-fade">
                <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
              </transition>
            </div>
          </el-tooltip>
        </div>
      </nav>

      <div class="sidebar-bottom">
        <el-dropdown trigger="click" placement="top-start">
          <div class="user-card">
            <el-avatar :size="32" class="user-avatar">
              {{ initials }}
            </el-avatar>
            <transition name="label-fade">
              <div v-if="!collapsed" class="user-info">
                <span class="user-name">{{ authStore.fullName }}</span>
                <span class="user-role">{{ roleLabel }}</span>
              </div>
            </transition>
            <transition name="label-fade">
              <span v-if="!collapsed" class="icon icon-sm" style="color:var(--text-hint);margin-left:auto">
                unfold_more
              </span>
            </transition>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="showChangePassword = true">
                <span class="icon icon-sm" style="margin-right:6px">lock</span>
                Đổi mật khẩu
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <span class="icon icon-sm" style="margin-right:6px;color:var(--el-color-danger)">logout</span>
                <span style="color:var(--el-color-danger)">Đăng xuất</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <button class="collapse-btn" @click="collapsed = !collapsed">
          <span class="icon icon-sm">
            {{ collapsed ? 'chevron_right' : 'chevron_left' }}
          </span>
        </button>
      </div>
    </aside>

    <div class="main-wrap">

      <header class="app-header">
        <div class="header-left">
          <h1 class="page-title">{{ currentTitle }}</h1>
        </div>
        <div class="header-right">

          <el-popover placement="bottom-end" :width="340" trigger="click">
            <template #reference>
              <button class="header-btn" style="position: relative;" @click="fetchReminders">
                <el-badge :value="pendingFollowUps.length" :hidden="pendingFollowUps.length === 0" class="bell-badge">
                  <span class="icon">notifications</span>
                </el-badge>
              </button>
            </template>

            <div class="reminder-popover">
              <div class="rp-header">
                <span style="font-weight: 600; color: #101828;">Lịch hẹn cần gọi ({{ pendingFollowUps.length }})</span>
                <el-button text size="small" @click="fetchReminders" :loading="loadingReminders">
                  <span class="icon icon-sm">refresh</span>
                </el-button>
              </div>

              <div class="rp-body" v-loading="loadingReminders">
                <div v-if="pendingFollowUps.length === 0" class="rp-empty">
                  Bạn không có lịch hẹn nào.
                </div>

                <div v-else class="rp-list">
                  <div v-for="item in pendingFollowUps" :key="item.scheduleId || item.id" class="rp-item" @click="goToLead(item.leadId)">
                    <div class="rp-item-left">
                      <span class="icon icon-fill" style="color: #ff8928;">call</span>
                    </div>
                    <div class="rp-item-right">
                      <div class="rp-lead-name">{{ item.leadName || 'Hồ sơ ứng viên' }}</div>
                      <div class="rp-lead-phone">{{ item.leadPhone || 'Chưa có SĐT' }}</div>
                      <div class="rp-time" :class="{'is-overdue': isOverdue(item.scheduledAt)}">
                        <span class="icon icon-sm" style="font-size: 13px; margin-right:2px">schedule</span>
                        {{ formatTime(item.scheduledAt) }}
                        <span v-if="isOverdue(item.scheduledAt)" style="margin-left:4px">(Quá hạn)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-popover>

          <el-button
            type="primary"
            size="small"
            @click="router.push('/leads')"
            style="gap:4px"
          >
            <span class="icon icon-sm">add</span>
            Hồ sơ mới
          </el-button>
        </div>
      </header>

      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <ChangePasswordDialog v-model="showChangePassword" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore }        from '@/stores/auth.store'
import { ROLE_LABELS }         from '@/constants/role'
import { callApi }             from '@/api/call.api'
import dayjs                   from 'dayjs'
import ChangePasswordDialog    from '@/components/ChangePasswordDialog.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const collapsed         = ref(false)
const showChangePassword = ref(false)

// State thông báo
const pendingFollowUps = ref([])
const loadingReminders = ref(false)

const navItems = [
  { path: '/dashboard',   icon: 'dashboard',      label: 'Tổng quan'       },
  { path: '/leads',       icon: 'contact_page',   label: 'Hồ sơ tư vấn'   },
  { path: '/enrollments', icon: 'school',         label: 'Nhập học'        },
  { path: '/imports',     icon: 'upload_file',    label: 'Import Leads'    },
  { path: '/users',       icon: 'manage_accounts',label: 'Người dùng', adminOnly: true },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const currentTitle = computed(() => route.meta?.title || 'EduCRM')

const initials = computed(() => {
  const name = authStore.fullName || ''
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'U'
})

const roleLabel = computed(() => ROLE_LABELS[authStore.role] || authStore.role)

async function handleLogout() {
  await authStore.logout()
}

// Tính năng Nhắc nhở
async function fetchReminders() {
  loadingReminders.value = true
  try {
    const res = await callApi.getMyFollowUps()
    pendingFollowUps.value = res.data?.data || res.data || []
  } catch (e) {
    console.error("Lỗi lấy thông báo:", e)
  } finally {
    loadingReminders.value = false
  }
}

onMounted(() => {
  fetchReminders()
  // Tự động tải lại lịch hẹn mỗi 5 phút
  setInterval(fetchReminders, 5 * 60 * 1000)
})

function goToLead(leadId) {
  if (!leadId) return
  router.push(`/leads/${leadId}`)
}

function isOverdue(date) {
  if (!date) return false
  return dayjs(date).isBefore(dayjs())
}

function formatTime(date) {
  if (!date) return ''
  return dayjs(date).format('DD/MM/YYYY HH:mm')
}
</script>

<style scoped>
/* Variables */
.app-shell {
  --sb-width:      240px;
  --sb-collapsed:  64px;
  --header-h:      56px;
  --transition:    0.22s cubic-bezier(.4,0,.2,1);

  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f0f2f5;
}

/* Sidebar*/
.sidebar {
  width: var(--sb-width);
  min-width: var(--sb-width);
  background: #001e40;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  transition: width var(--transition), min-width var(--transition);
  overflow: hidden;
  z-index: 100;
}

.app-shell.sidebar-collapsed .sidebar {
  width: var(--sb-collapsed);
  min-width: var(--sb-collapsed);
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  min-height: 64px;
  overflow: hidden;
}

.logo-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: rgba(255,137,40,0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,137,40,0.3);
}

.logo-text {
  display: flex;
  flex-direction: column;
  white-space: nowrap;
  overflow: hidden;
}

.logo-name {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.3px;
  line-height: 1.2;
}

.logo-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  margin-top: 1px;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 10px 8px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}

.sidebar-nav::-webkit-scrollbar { display: none; }

.nav-item {
  border-radius: 8px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: background var(--transition);
  overflow: hidden;
}

.nav-item.hidden { display: none; }

.nav-item:hover { background: rgba(255,255,255,0.06); }

.nav-item.active { background: rgba(255,137,40,0.15); }

.nav-item-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  min-height: 40px;
  white-space: nowrap;
}

.nav-icon {
  color: rgba(255,255,255,0.45);
  font-size: 20px;
  min-width: 20px;
  transition: color var(--transition);
}

.nav-item.active .nav-icon,
.nav-item:hover  .nav-icon { color: #fff; }

.nav-item.active .nav-icon { color: #ff8928; }

.nav-label {
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(255,255,255,0.65);
  transition: color var(--transition);
}

.nav-item.active .nav-label,
.nav-item:hover  .nav-label { color: #fff; }

.nav-item.active .nav-label { color: #ffad6b; }

/* Bottom */
.sidebar-bottom {
  padding: 8px;
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background var(--transition);
  overflow: hidden;
  min-height: 48px;
}

.user-card:hover { background: rgba(255,255,255,0.06); }

.user-avatar {
  background: #003366 !important;
  color: #ff8928 !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  min-width: 32px;
  border: 1px solid rgba(255,137,40,0.3);
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  white-space: nowrap;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255,255,255,0.35);
  transition: background var(--transition), color var(--transition);
}

.collapse-btn:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.7);
}

.main-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* Header */
.app-header {
  height: var(--header-h);
  min-height: var(--header-h);
  background: #fff;
  border-bottom: 1px solid #e4e7ec;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  gap: 16px;
}

.header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #101828;
  margin: 0;
  white-space: nowrap;
}

.header-right { display: flex; align-items: center; gap: 8px; }

.header-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  cursor: pointer;
  color: #475467;
  transition: background 0.15s, border-color 0.15s;
}

.header-btn:hover {
  background: #f0f2f5;
  border-color: #c4c9d4;
}

/* Page content */
.page-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
}

/* ── POPOVER THÔNG BÁO LỊCH HẸN ─────────────────────────────────────── */
.bell-badge :deep(.el-badge__content) {
  top: 4px;
  right: 6px;
  background-color: #d92d20;
}

.reminder-popover {
  display: flex;
  flex-direction: column;
  margin: -12px;
}
.rp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ec;
  background: #f9fafb;
}
.rp-body {
  max-height: 360px;
  overflow-y: auto;
  padding: 8px 0;
}
.rp-empty {
  padding: 32px 24px;
  text-align: center;
  color: #667085;
  font-size: 13.5px;
}
.rp-list {
  display: flex;
  flex-direction: column;
}
.rp-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f0f2f5;
}
.rp-item:last-child { border-bottom: none; }
.rp-item:hover { background: #f2f4f7; }
.rp-item-left { padding-top: 2px; }
.rp-item-right { display: flex; flex-direction: column; gap: 3px; width: 100%;}
.rp-lead-name { font-size: 13.5px; font-weight: 600; color: #101828; }
.rp-lead-phone { font-size: 12.5px; color: #475467; }
.rp-time {
  display: flex; align-items: center;
  font-size: 11.5px; color: #667085; margin-top: 2px;
}
.rp-time.is-overdue { color: #d92d20; font-weight: 600; }


.label-fade-enter-active,
.label-fade-leave-active { transition: opacity 0.15s ease; }
.label-fade-enter-from,
.label-fade-leave-to     { opacity: 0; }

.page-enter-active,
.page-leave-active { transition: opacity 0.15s ease; }
.page-enter-from,
.page-leave-to     { opacity: 0; }
</style>
