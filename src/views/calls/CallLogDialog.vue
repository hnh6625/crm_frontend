<template>
  <el-dialog
    v-model="visible"
    title="Ghi nhận cuộc gọi"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Kết quả cuộc gọi" prop="resultId">
        <el-select v-model="form.resultId" placeholder="Chọn kết quả" style="width:100%" @change="onResultChange">
          <el-option
            v-for="r in results"
            :key="r.resultId"
            :label="r.resultName"
            :value="r.resultId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="Thời lượng (giây)" prop="durationSeconds">
        <el-input v-model.number="form.durationSeconds" type="number" placeholder="VD: 120" />
      </el-form-item>
      <el-form-item label="Ghi chú">
        <el-input v-model="form.note" type="textarea" :rows="3" placeholder="Nội dung cuộc gọi..." resize="none" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">Huỷ</el-button>
      <el-button type="primary" :loading="loading" @click="submit">Lưu</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { callApi } from '@/api/call.api'
import { ElMessage } from 'element-plus'

const props = defineProps({ modelValue: Boolean, leadId: [String, Number] })
const emit  = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v),
})

const formRef = ref()
const loading = ref(false)
const results = ref([])
const selectedResultName = ref('')

// Đổi tên biến cho khớp Backend Request
const form = reactive({ resultId: '', durationSeconds: null, note: '' })
const rules = {
  resultId: [{ required: true, message: 'Vui lòng chọn kết quả', trigger: 'change' }],
}

onMounted(async () => {
  try {
    const res = await callApi.getResults()
    results.value = res.data?.data || res.data || []
  } catch (e) {
    ElMessage.error("Không thể lấy danh sách kết quả gọi",e)
  }
})

// Lưu lại tên của cái Status đang được chọn để lát nữa cảnh báo
function onResultChange(val) {
  const rs = results.value.find(x => x.resultId === val)
  selectedResultName.value = rs ? rs.resultName : ''
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await callApi.createCallLog({ leadId: props.leadId, ...form })

    // CẢNH BÁO CHO NHÂN VIÊN
    if (['Không nghe máy', 'Thuê bao', 'Sai số'].includes(selectedResultName.value)) {
      ElMessage.warning('Đã lưu! Nếu quá 3 lần liên tiếp, hệ thống sẽ tự động chuyển thành Từ chối.')
    } else {
      ElMessage.success('Đã lưu lịch sử cuộc gọi!')
    }

    // Báo cho màn hình Detail tải lại dữ liệu (bao gồm cả Status của Lead)
    emit('saved')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.response?.data?.message || 'Lỗi khi lưu cuộc gọi!')
  } finally {
    loading.value = false
  }
}
</script>
