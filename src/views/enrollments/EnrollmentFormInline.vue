<template>
  <div class="enrollment-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">

      <div style="display: flex; gap: 12px">
        <el-form-item label="Khoa " prop="departmentId" style="flex:1">
          <el-select v-model="form.departmentId" placeholder="Chọn Khoa" style="width:100%" @change="handleDepartmentChange">
            <el-option v-for="d in departments" :key="d.departmentId || d.id" :label="d.departmentName" :value="d.departmentId || d.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="Ngành học " prop="majorId" style="flex:1">
          <el-select v-model="form.majorId" placeholder="Chọn Ngành học" style="width:100%" :disabled="!form.departmentId" @change="handleMajorChange">
            <el-option v-for="m in filteredMajors" :key="m.majorId || m.id" :label="m.majorName" :value="m.majorId || m.id" />
          </el-select>
        </el-form-item>
      </div>

      <div style="display: flex; gap: 12px">
        <el-form-item label="Học phí (10M - 15M)" prop="tuitionFee" style="flex:1">
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

      <el-form-item label="Ghi chú (Nếu có)">
        <el-input v-model="form.note" type="textarea" :rows="2" placeholder="Ghi chú thêm..." />
      </el-form-item>
    </el-form>

    <div style="text-align: right; margin-top: 16px;">
      <el-button @click="emit('cancel')">Huỷ bỏ</el-button>
      <el-button type="primary" :loading="loading" @click="submit">Xác nhận chốt</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { enrollmentApi } from '@/api/enrollment.api'
import { ElMessage } from 'element-plus'

const props = defineProps({ leadId: [Number, String] })
const emit = defineEmits(['saved', 'cancel'])

const formRef = ref()
const loading = ref(false)
const departments = ref([])
const majors = ref([])

const form = reactive({
  departmentId: '',
  majorId: '',
  tuitionFee: 10000000,
  paymentMethod: 'TRANSFER',
  note: ''
})

// Tự động lọc các ngành thuộc về Khoa đang được chọn
const filteredMajors = computed(() => {
  if (!form.departmentId) return [];
  return majors.value.filter(m => m.department?.departmentId === form.departmentId);
})

const rules = {
  departmentId: [{ required: true, message: 'Vui lòng chọn Khoa', trigger: 'change' }],
  majorId: [{ required: true, message: 'Vui lòng chọn Ngành học', trigger: 'change' }],
  tuitionFee: [
    { required: true, message: 'Vui lòng nhập học phí' },
    { type: 'number', min: 10000000, max: 15000000, message: 'Học phí phải từ 10M - 15M VNĐ', trigger: 'blur' }
  ]
}

onMounted(async () => {
  try {
    const [resD, resM] = await Promise.all([enrollmentApi.getDepartments(), enrollmentApi.getMajors()])
    departments.value = resD.data?.data || resD.data || []
    majors.value = resM.data?.data || resM.data || []
  } catch (e) {
    ElMessage.error("Lỗi khi tải dữ liệu Khoa/Ngành", e)
  }
})

// Reset Ngành khi đổi Khoa
function handleDepartmentChange() {
  form.majorId = ''
  form.tuitionFee = 10000000
}

// Cập nhật học phí tự động nếu Ngành đó có giá riêng trong DB
function handleMajorChange(val) {
  const selected = majors.value.find(m => (m.majorId || m.id) === val)
  form.tuitionFee = selected?.tuitionFee || 10000000
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await enrollmentApi.create({ leadId: props.leadId, ...form })
    emit('saved')
  } catch (e) {
    ElMessage.error('Lỗi khi chốt hồ sơ nhập học!',e)
  } finally {
    loading.value = false
  }
}
</script>
