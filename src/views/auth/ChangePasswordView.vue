<!-- src/views/auth/ChangePasswordView.vue -->
<template>
  <div class="cp-page">
    <div class="cp-card">
      <div class="cp-icon">
        <span class="icon icon-fill" style="font-size:28px;color:#ff8928">lock_reset</span>
      </div>
      <h2>Đổi mật khẩu</h2>
      <p>Tài khoản của bạn yêu cầu đổi mật khẩu trước khi tiếp tục sử dụng hệ thống.</p>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        style="margin-top:24px"
        @submit.prevent="submit"
      >
        <el-form-item label="Mật khẩu hiện tại" prop="oldPassword">
          <el-input v-model="form.oldPassword" type="password" show-password
                    placeholder="Nhập mật khẩu hiện tại" size="large"/>
        </el-form-item>
        <el-form-item label="Mật khẩu mới" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" show-password
                    placeholder="Tối thiểu 6 ký tự" size="large"/>
        </el-form-item>
        <el-form-item label="Xác nhận mật khẩu mới" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password
                    placeholder="Nhập lại mật khẩu mới" size="large"/>
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          :loading="loading"
          style="width:100%;margin-top:8px;font-weight:600"
          @click="submit"
        >
          Xác nhận đổi mật khẩu
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive} from 'vue'
import {ElMessage} from 'element-plus'
import {authApi} from '@/api/auth.api'
import {useAuthStore} from '@/stores/auth.store'
import {useRouter} from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({oldPassword: '', newPassword: '', confirmPassword: ''})

const rules = {
  oldPassword: [{required: true, message: 'Vui lòng nhập mật khẩu hiện tại', trigger: 'blur'}],
  newPassword: [
    {required: true, message: 'Vui lòng nhập mật khẩu mới', trigger: 'blur'},
    {min: 6, message: 'Mật khẩu tối thiểu 6 ký tự', trigger: 'blur'},
  ],
  confirmPassword: [
    {required: true, message: 'Vui lòng xác nhận mật khẩu', trigger: 'blur'},
    {
      validator: (rule, val, cb) =>
        val !== form.newPassword ? cb(new Error('Mật khẩu xác nhận không khớp')) : cb(),
      trigger: 'blur',
    },
  ],
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await authApi.changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword
    })
    ElMessage.success('Đổi mật khẩu thành công!')
    // update local user to clear mustChange flag
    if (authStore.user) {
      authStore.user.mustChangePassword = false
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.cp-page {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Be Vietnam Pro', sans-serif;
}

.cp-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 4px 24px rgba(16, 24, 40, 0.08);
  text-align: center;
}

.cp-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 137, 40, 0.1);
  border: 1px solid rgba(255, 137, 40, 0.25);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.cp-card h2 {
  font-size: 20px;
  font-weight: 700;
  color: #101828;
  margin: 0 0 8px;
}

.cp-card p {
  font-size: 13.5px;
  color: #475467;
  line-height: 1.6;
  margin: 0;
}
</style>
