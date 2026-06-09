<!-- src/views/leads/FollowUpDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="Đặt lịch follow-up"
    width="440px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Thời gian follow-up" prop="followUpTime">
        <el-date-picker
          v-model="form.followUpTime"
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
import { ref, reactive, computed } from 'vue'
import { callApi } from '@/api/call.api'

const props = defineProps({ modelValue: Boolean, leadId: [String, Number] })
const emit  = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v),
})

const formRef = ref()
const loading = ref(false)

const form  = reactive({ followUpTime: '', note: '' })
const rules = {
  followUpTime: [{ required: true, message: 'Vui lòng chọn thời gian', trigger: 'change' }],
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await callApi.createFollowUp({ leadId: props.leadId, ...form })
    emit('saved')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>
