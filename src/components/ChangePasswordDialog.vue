<template>
  <el-dialog
    v-model="visible"
    title="Đổi mật khẩu"
    width="420px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="submit"
    >
      <el-form-item label="Mật khẩu hiện tại" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          placeholder="Nhập mật khẩu hiện tại"
        />
      </el-form-item>

      <el-form-item label="Mật khẩu mới" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          placeholder="Tối thiểu 6 ký tự"
        />
      </el-form-item>

      <el-form-item label="Xác nhận mật khẩu mới" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="Nhập lại mật khẩu mới"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Huỷ</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        Lưu thay đổi
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage }               from 'element-plus'
import { authApi }                 from '@/api/auth.api'

const props = defineProps({ modelValue: Boolean })
const emit  = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v),
})

const formRef = ref()
const loading = ref(false)

const form = reactive({
  oldPassword:     '',
  newPassword:     '',
  confirmPassword: '',
})

const rules = {
  oldPassword: [
    { required: true, message: 'Vui lòng nhập mật khẩu hiện tại', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: 'Vui lòng nhập mật khẩu mới', trigger: 'blur' },
    { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Vui lòng xác nhận mật khẩu', trigger: 'blur' },
    {
      validator: (rule, value, cb) => {
        if (value !== form.newPassword) cb(new Error('Mật khẩu xác nhận không khớp'))
        else cb()
      },
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
    })
    ElMessage.success('Đổi mật khẩu thành công')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>
