<template>
  <div class="login-page">
    <div class="login-left">
      <div class="brand">
        <div class="brand-icon">
          <span class="icon icon-fill" style="font-size:28px;color:#ff8928">school</span>
        </div>
        <div>
          <div class="brand-name">EduCRM</div>
          <div class="brand-tagline">Nền tảng tư vấn tuyển sinh</div>
        </div>
      </div>
      <div class="hero-text">
        <h1>Quản lý hồ sơ<br /><span class="accent-text">thông minh hơn</span></h1>
        <p>Theo dõi leads, lịch hẹn tư vấn và tỉ lệ chuyển đổi — tất cả trên một nền tảng.</p>
      </div>
      <div class="stats-row">
        <div class="stat-item" v-for="s in stats" :key="s.label">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="login-card">
        <div class="card-header">
          <h2>Đăng nhập</h2>
          <p>Chào mừng trở lại! Vui lòng nhập thông tin tài khoản.</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="submit"
        >
          <el-form-item label="Tên đăng nhập" prop="username">
            <el-input
              v-model="form.username"
              placeholder="Nhập tên đăng nhập"
              size="large"
              :prefix-icon="User"
              autofocus
            />
          </el-form-item>

          <el-form-item label="Mật khẩu" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="Nhập mật khẩu"
              size="large"
              :prefix-icon="Lock"
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width:100%;margin-top:8px;font-weight:600"
            @click="submit"
          >
            Đăng nhập
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { User, Lock }    from '@element-plus/icons-vue'
import { useAuthStore }  from '@/stores/auth.store'

const authStore = useAuthStore()
const formRef   = ref()
const loading   = ref(false)

const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: 'Vui lòng nhập tên đăng nhập', trigger: 'blur' }],
  password: [{ required: true, message: 'Vui lòng nhập mật khẩu',      trigger: 'blur' }],
}

const stats = [
  { value: '2.400+', label: 'Hồ sơ quản lý' },
  { value: '98%',    label: 'Uptime hệ thống' },
  { value: '3x',     label: 'Tốc độ tư vấn'  },
]

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await authStore.login(form.username, form.password)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  font-family: 'Be Vietnam Pro', sans-serif;
}

/* Left panel */
.login-left {
  flex: 1;
  background: linear-gradient(145deg, #001228 0%, #001e40 60%, #003366 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 64px;
  position: relative;
  overflow: hidden;
}

.login-left::before {
  content: '';
  position: absolute;
  width: 500px; height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,137,40,0.08) 0%, transparent 70%);
  top: -100px; right: -100px;
  pointer-events: none;
}

.login-left::after {
  content: '';
  position: absolute;
  width: 300px; height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,51,102,0.4) 0%, transparent 70%);
  bottom: 40px; left: -60px;
  pointer-events: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 56px;
}

.brand-icon {
  width: 48px; height: 48px;
  background: rgba(255,137,40,0.15);
  border: 1px solid rgba(255,137,40,0.3);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.3px;
}

.brand-tagline {
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  margin-top: 2px;
}

.hero-text {
  margin-bottom: 48px;
  position: relative;
  z-index: 1;
}

.hero-text h1 {
  font-size: 40px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin: 0 0 16px;
  letter-spacing: -0.5px;
}

.accent-text {
  color: #ff8928;
}

.hero-text p {
  font-size: 15px;
  color: rgba(255,255,255,0.5);
  line-height: 1.7;
  max-width: 360px;
  margin: 0;
}

.stats-row {
  display: flex;
  gap: 32px;
  position: relative;
  z-index: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #ff8928;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  margin-top: 4px;
}

/* Right panel */
.login-right {
  width: 480px;
  min-width: 480px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 48px;
}

.login-card {
  width: 100%;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 24px rgba(16,24,40,0.08);
}

.card-header {
  margin-bottom: 28px;
}

.card-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #101828;
  margin: 0 0 6px;
}

.card-header p {
  font-size: 14px;
  color: #475467;
  margin: 0;
}

@media (max-width: 900px) {
  .login-left { display: none; }
  .login-right { width: 100%; min-width: unset; padding: 24px; }
}
</style>
