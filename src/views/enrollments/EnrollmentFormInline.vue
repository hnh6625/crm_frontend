<!-- src/views/enrollments/EnrollmentFormInline.vue -->
<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <div class="form-grid">
      <el-form-item label="Ngành học" prop="majorId">
        <el-select v-model="form.majorId" placeholder="Chọn ngành" style="width:100%" filterable>
          <el-option v-for="m in majors" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Cơ sở" prop="campusId">
        <el-select v-model="form.campusId" placeholder="Chọn cơ sở" style="width:100%">
          <el-option v-for="c in campuses" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Học kỳ" prop="semesterId">
        <el-select v-model="form.semesterId" placeholder="Chọn học kỳ" style="width:100%">
          <el-option v-for="s in semesters" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Trạng thái">
        <el-select v-model="form.status" style="width:100%">
          <el-option v-for="(label, key) in ENROLLMENT_STATUS_LABELS" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
    </div>
    <el-form-item label="Ghi chú">
      <el-input v-model="form.notes" type="textarea" :rows="2" resize="none" placeholder="Ghi chú..." />
    </el-form-item>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
      <el-button @click="$emit('cancel')">Huỷ</el-button>
      <el-button type="primary" :loading="loading" @click="submit">Lưu</el-button>
    </div>
  </el-form>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useEnrollmentStore }       from '@/stores/enrollment.store'
import { ENROLLMENT_STATUS_LABELS } from '@/constants/status'

const props = defineProps({ leadId: [String, Number] })
const emit  = defineEmits(['saved', 'cancel'])

const store   = useEnrollmentStore()
const formRef = ref()
const loading = ref(false)

const campuses  = ref([])
const majors    = ref([])
const semesters = ref([])

const form = reactive({ majorId: '', campusId: '', semesterId: '', status: 'PENDING', notes: '' })

const rules = {
  majorId:    [{ required: true, message: 'Chọn ngành học', trigger: 'change' }],
  campusId:   [{ required: true, message: 'Chọn cơ sở',     trigger: 'change' }],
  semesterId: [{ required: true, message: 'Chọn học kỳ',    trigger: 'change' }],
}

onMounted(async () => {
  await store.fetchDropdowns()
  campuses.value  = store.campuses
  majors.value    = store.majors
  semesters.value = store.semesters
})

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await store.create({ ...form, leadId: props.leadId })
    emit('saved')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 16px; }
</style>
