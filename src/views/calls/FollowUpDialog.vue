<template>
  <el-dialog
    v-model="visible"
    title="Đặt lịch follow-up"
    width="440px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Thời gian follow-up" prop="scheduledAt">
        <el-date-picker
          v-model="form.scheduledAt"
          type="datetime"
          placeholder="Chọn ngày giờ"
          format="DD/MM/YYYY HH:mm"
          value-format="YYYY-MM-DDTHH:mm:ss"
          style="width:100%"
        />
      </el-form-item>
      <el-form-item label="Ghi chú">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="3"
          placeholder="Nội dung cần follow-up..."
          resize="none"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">Huỷ</el-button>
      <el-button type="primary" :loading="loading" @click="submit">Đặt lịch</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {ref, reactive, computed} from 'vue'
import {callApi} from '@/api/call.api'
import {ElMessage} from 'element-plus'

const props = defineProps({modelValue: Boolean, leadId: [String, Number]})
const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const formRef = ref()
const loading = ref(false)


const form = reactive({scheduledAt: '', note: ''})
const rules = {
  scheduledAt: [{required: true, message: 'Vui lòng chọn thời gian', trigger: 'change'}],
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await callApi.createFollowUp({leadId: props.leadId, ...form})
    ElMessage.success("Đặt lịch follow-up thành công!")
    emit('saved')
    visible.value = false
  } catch (e) {
    const errorMap = e.response?.data?.data
    if (errorMap && typeof errorMap === 'object') {
      const errorMsgs = Object.values(errorMap).join(' | ')
      ElMessage.error(errorMsgs)
    } else {
      ElMessage.error(e.response?.data?.message || 'Không thể tạo lịch hẹn!')
    }
  } finally {
    loading.value = false
  }
}
</script>
