<!-- src/layouts/AppLayout.vue -->
<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': collapsed }">

    <!-- ══════════════════════════ SIDEBAR ══════════════════════════ -->
    <aside class="sidebar">
      <!-- Logo -->
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

      <!-- Nav -->
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
              <transition name="label-fade">
                <el-badge
                  v-if="!collapsed && item.badge"
                  :value="item.badge"
                  class="nav-badge"
                />
              </transition>
            </div>
          </el-tooltip>
        </div>
      </nav>

      <!-- Bottom: collapse toggle + user -->
      <div class="sidebar-bottom">
        <!-- User card -->
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

        <!-- Collapse btn -->
        <button class="collapse-btn" @click="collapsed = !collapsed">
          <span class="icon icon-sm">
            {{ collapsed ? 'chevron_right' : 'chevron_left' }}
          </span>
        </button>
      </div>
    </aside>

    <!-- ══════════════════════════ MAIN ══════════════════════════════ -->
    <div class="main-wrap">

      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <!-- Breadcrumb / page title -->
          <h1 class="page-title">{{ currentTitle }}</h1>
        </div>
        <div class="header-right">
          <!-- Notifications (placeholder) -->
          <el-tooltip content="Thông báo" placement="bottom">
            <button class="header-btn">
              <span class="icon">notifications</span>
            </button>
          </el-tooltip>

          <!-- Quick lead create -->
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

      <!-- Page content -->
      <main class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Change password dialog -->
    <ChangePasswordDialog v-model="showChangePassword" />
  </div>
</template>

<script setup>
import { ref, computed }      from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore }        from '@/stores/auth.store'
import { ROLE_LABELS }         from '@/constants/role'
import ChangePasswordDialog    from '@/components/ChangePasswordDialog.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const collapsed         = ref(false)
const showChangePassword = ref(false)

// ── Nav items ─────────────────────────────────────────────────────────
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

// ── Computed ─────────────────────────────────────────────────────────
const currentTitle = computed(() => route.meta?.title || 'EduCRM')

const initials = computed(() => {
  const name = authStore.fullName || ''
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || 'U'
})

const roleLabel = computed(() => ROLE_LABELS[authStore.role] || authStore.role)

// ── Actions ───────────────────────────────────────────────────────────
async function handleLogout() {
  await authStore.logout()
}
</script>

<style scoped>
/* ── Variables ──────────────────────────────────────────────────────── */
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

/* ── Sidebar ────────────────────────────────────────────────────────── */
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

/* ── Main wrap ──────────────────────────────────────────────────────── */
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

/* ── Transitions ────────────────────────────────────────────────────── */
.label-fade-enter-active,
.label-fade-leave-active { transition: opacity 0.15s ease; }
.label-fade-enter-from,
.label-fade-leave-to     { opacity: 0; }

.page-enter-active,
.page-leave-active { transition: opacity 0.15s ease; }
.page-enter-from,
.page-leave-to     { opacity: 0; }
</style>
