<!-- src/views/leads/CallLogDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="Ghi nhận cuộc gọi"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Kết quả cuộc gọi" prop="result">
        <el-select v-model="form.result" placeholder="Chọn kết quả" style="width:100%">
          <el-option v-for="r in results" :key="r" :label="r" :value="r" />
        </el-select>
      </el-form-item>
      <el-form-item label="Thời lượng (giây)" prop="duration">
        <el-input v-model.number="form.duration" type="number" placeholder="VD: 120" />
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

const props = defineProps({ modelValue: Boolean, leadId: [String, Number] })
const emit  = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v),
})

const formRef = ref()
const loading = ref(false)
const results = ref([])

const form = reactive({ result: '', duration: null, note: '' })
const rules = {
  result: [{ required: true, message: 'Vui lòng chọn kết quả', trigger: 'change' }],
}

onMounted(async () => {
  const res = await callApi.getResults()
  results.value = res.data || []
})

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await callApi.createCallLog({ leadId: props.leadId, ...form })
    emit('saved')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>
