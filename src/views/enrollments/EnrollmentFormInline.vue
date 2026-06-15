<template>
  <div class="enrollment-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">

      <el-form-item label="Khoa / Ngành học" prop="majorId">
        <el-select
          v-model="form.majorId"
          placeholder="Chọn Khoa / Ngành học"
          style="width:100%"
          @change="handleMajorChange"
        >
          <el-option v-for="m in majors" :key="m.majorId || m.id" :label="m.majorName" :value="m.majorId || m.id" />
        </el-select>
      </el-form-item>

      <div style="display: flex; gap: 12px">
        <el-form-item label="Học phí dự kiến" prop="tuitionFee" style="flex:1">
          <el-input v-model.number="form.tuitionFee" type="number" placeholder="VD: 10000000">
            <template #append>VNĐ</template>
          </el-input>
        </el-form-item>

        <el-form-item label="Phương thức đóng" prop="paymentMethod" style="flex:1">
          <el-select v-model="form.paymentMethod" style="width:100%">
            <el-option label="Chuyển khoản" value="TRANSFER" />
            <el-option label="Tiền mặt" value="CASH" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="Ghi chú">
        <el-input v-model="form.note" type="textarea" :rows="2" placeholder="Ghi chú thêm..." />
      </el-form-item>
    </el-form>

    <div style="text-align: right; margin-top: 16px;">
      <el-button @click="emit('cancel')">Huỷ bỏ</el-button>
      <el-button type="primary" :loading="loading" @click="submit">Xác nhận nhập học</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { enrollmentApi } from '@/api/enrollment.api'
import { ElMessage } from 'element-plus'

const props = defineProps({ leadId: [Number, String] })
const emit = defineEmits(['saved', 'cancel'])

const formRef = ref()
const loading = ref(false)
const majors = ref([])

const form = reactive({
  majorId: '',
  tuitionFee: 10000000, // Điền sẵn 10 triệu
  paymentMethod: 'TRANSFER',
  note: ''
})

const rules = {
  majorId: [{ required: true, message: 'Vui lòng chọn Khoa / Ngành học', trigger: 'change' }],
  tuitionFee: [
    { required: true, message: 'Vui lòng nhập học phí' },
    { type: 'number', min: 10000000, max: 15000000, message: 'Học phí phải từ 10M - 15M VNĐ', trigger: 'blur' }
  ]
}

onMounted(async () => {
  try {
    const resM = await enrollmentApi.getMajors()
    majors.value = resM.data?.data || []
  } catch (e) {
    ElMessage.error("Lỗi khi tải dữ liệu Khoa / Ngành")
  }
})

// Nếu chọn ngành khác, tự động reset học phí về 10 triệu
function handleMajorChange() {
  form.tuitionFee = 10000000
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    const payload = {
      leadId: props.leadId,
      ...form
    }
    await enrollmentApi.create(payload)
    emit('saved')
  } catch (e) {
    console.error(e.response?.data)
    ElMessage.error(e.response?.data?.message || 'Lỗi khi chốt hồ sơ nhập học!')
  } finally {
    loading.value = false
  }
}
</script>
