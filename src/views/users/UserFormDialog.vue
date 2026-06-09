<!-- src/views/users/UserFormDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
    >
      <div class="form-grid">
        <el-form-item label="Họ và tên" prop="fullName">
          <el-input v-model="form.fullName" placeholder="Nguyễn Văn A"/>
        </el-form-item>
        <el-form-item label="Tên đăng nhập" prop="username">
          <el-input v-model="form.username" placeholder="nvana" :disabled="isEdit"/>
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="example@edu.vn"/>
        </el-form-item>
        <el-form-item label="Số điện thoại" prop="phone">
          <el-input v-model="form.phone" placeholder="0912 345 678"/>
        </el-form-item>
        <el-form-item label="Vai trò" prop="role">
          <el-select v-model="form.role" placeholder="Chọn vai trò" style="width:100%">
            <el-option v-for="(label, key) in ROLE_LABELS" :key="key" :label="label" :value="key"/>
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="Mật khẩu tạm thời" prop="password">
          <el-input v-model="form.password" type="password" show-password
                    placeholder="Tối thiểu 6 ký tự"/>
        </el-form-item>
      </div>

      <el-form-item v-if="isEdit" label="Trạng thái">
        <el-select v-model="form.status" style="width:100%">
          <el-option label="Hoạt động" value="ACTIVE"/>
          <el-option label="Vô hiệu" value="INACTIVE"/>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Huỷ</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        {{ isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {ref, reactive, computed, watch} from 'vue'
import {useUserStore} from '@/stores/user.store'
import {ROLE_LABELS, ROLE_IDS} from '@/constants/role'


const props = defineProps({
  modelValue: Boolean,
  user: {type: Object, default: null},
})
const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.user?.id)
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  fullName: '', username: '', email: '', phone: '',
  role: '', password: '', status: 'ACTIVE',
})

const rules = {
  fullName: [{required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur'}],
  username: [{required: true, message: 'Vui lòng nhập tên đăng nhập', trigger: 'blur'}],
  email: [
    {required: true, message: 'Vui lòng nhập email', trigger: 'blur'},
    {type: 'email', message: 'Email không hợp lệ', trigger: 'blur'},
  ],
  role: [{required: true, message: 'Vui lòng chọn vai trò', trigger: 'change'}],
  password: [
    {required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur'},
    {min: 6, message: 'Tối thiểu 6 ký tự', trigger: 'blur'},
  ],
}

watch(() => props.user, u => {
  if (u) {
    Object.assign(form, {
      fullName: u.fullName || '', username: u.username || '',
      email: u.email || '', phone: u.phone || '',
      role: u.role || '', status: u.status || 'ACTIVE',
      password: '',
    })
  } else {
    Object.assign(form, {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      role: '',
      password: '',
      status: 'ACTIVE'
    })
  }
}, {immediate: true})

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    if (isEdit.value) {
      await userStore.update(props.user.id, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        roleId: ROLE_IDS[form.role],
        status: form.status,
      })
    } else {
      await userStore.create({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        roleId: ROLE_IDS[form.role],
      })
    }
    emit('saved')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
}
</style>
