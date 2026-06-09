<!-- src/views/enrollments/EnrollmentDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Chỉnh sửa đăng ký' : 'Thêm đăng ký nhập học'"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Hồ sơ (Sinh viên)" prop="leadId" v-if="!isEdit && !leadId">
        <el-input v-model="form.leadId" placeholder="ID hồ sơ" />
      </el-form-item>
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
        <el-form-item label="Trạng thái" prop="status">
          <el-select v-model="form.status" style="width:100%">
            <el-option
              v-for="(label, key) in ENROLLMENT_STATUS_LABELS"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="Ghi chú">
        <el-input v-model="form.notes" type="textarea" :rows="2" resize="none" placeholder="Ghi chú..." />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Huỷ</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        {{ isEdit ? 'Lưu thay đổi' : 'Tạo đăng ký' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useEnrollmentStore }             from '@/stores/enrollment.store'
import { ENROLLMENT_STATUS_LABELS }       from '@/constants/status'

const props = defineProps({
  modelValue: Boolean,
  enrollment: { type: Object, default: null },
  leadId:     { type: [String, Number], default: null },
  campuses:   { type: Array, default: () => [] },
  majors:     { type: Array, default: () => [] },
  semesters:  { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.enrollment?.id)
const store  = useEnrollmentStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({ leadId: '', majorId: '', campusId: '', semesterId: '', status: 'PENDING', notes: '' })

const rules = {
  majorId:    [{ required: true, message: 'Chọn ngành học',  trigger: 'change' }],
  campusId:   [{ required: true, message: 'Chọn cơ sở',      trigger: 'change' }],
  semesterId: [{ required: true, message: 'Chọn học kỳ',     trigger: 'change' }],
}

watch(() => props.enrollment, e => {
  if (e) Object.assign(form, { majorId: e.majorId, campusId: e.campusId, semesterId: e.semesterId, status: e.status, notes: e.notes || '' })
  else   Object.assign(form, { leadId: props.leadId || '', majorId: '', campusId: '', semesterId: '', status: 'PENDING', notes: '' })
}, { immediate: true })

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    if (isEdit.value) await store.update(props.enrollment.id, form)
    else              await store.create({ ...form, leadId: form.leadId || props.leadId })
    emit('saved')
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 16px; }
</style>
