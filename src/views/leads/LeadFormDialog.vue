<!-- src/views/leads/LeadFormDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Chỉnh sửa hồ sơ' : 'Thêm hồ sơ mới'"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="lead-form"
    >
      <div class="form-grid">
        <el-form-item label="Họ và tên" prop="fullName">
          <el-input v-model="form.fullName" placeholder="Nguyễn Văn A" />
        </el-form-item>
        <el-form-item label="Số điện thoại" prop="phone">
          <el-input v-model="form.phone" placeholder="0912 345 678" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="example@email.com" />
        </el-form-item>
        <el-form-item label="Năm sinh" prop="birthYear">
          <el-input v-model="form.birthYear" placeholder="2006" type="number" />
        </el-form-item>
        <el-form-item label="Nguồn" prop="sourceId">
          <el-select v-model="form.sourceId" placeholder="Chọn nguồn"  style="width:100%"  filterable>
            <el-option v-for="s in leadStore.sources"
                       :key="s.sourceId"
                       :label="s.sourceName"
                       :value="s.sourceId" />
          </el-select>
        </el-form-item>
        <el-form-item label="Trạng thái" prop="statusId">
          <el-select v-model="form.statusId" placeholder="Chọn trạng thái" style="width:100%">
            <el-option v-for="s in leadStore.statuses" :key="s.statusId" :label="s.statusName" :value="s.statusId" />
          </el-select>
        </el-form-item>
        <el-form-item label="Tư vấn viên">
          <el-select
            v-model="form.assignedTo"
            placeholder="Chọn tư vấn viên"
            style="width:100%"
          >

            <el-option
              v-for="u in consultants"
              :key="u.userId"
              :label="u.fullName"
              :value="u.userId"

            />

          </el-select>
        </el-form-item>

      </div>

      <el-form-item label="Tags">
        <el-select
          v-model="form.tagsId"
          multiple
          placeholder="Chọn hoặc nhập tag"
          style="width:100%"
          allow-create
          filterable
        >
          <el-option v-for="t in leadStore.tags" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>

      <el-form-item label="Ghi chú">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="Ghi chú thêm..."
          resize="none"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Huỷ</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        {{ isEdit ? 'Lưu thay đổi' : 'Tạo hồ sơ' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useLeadStore } from '@/stores/lead.store'
import { userApi } from '@/api/user.api'

const props = defineProps({
  modelValue: Boolean,
  lead:       { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: v  => emit('update:modelValue', v),
})

const isEdit    = computed(() => !!props.lead?.leadId)
const leadStore = useLeadStore()

const statusMap = computed(() => {
  const map = {}
  leadStore.statuses.forEach(s => {
    map[s.statusId] = s.statusName
  })
  return map
})

const sourceMap = computed(() => {
  const map = {}
  leadStore.sources.forEach(s => {
    map[s.sourceId] = s.sourceName
  })
  return map
})

const formRef   = ref()
const loading   = ref(false)
const consultants = ref([])



const form = reactive({
  fullName:  '',
  phone:     '',
  email:     '',
  birthYear: '',
  sourceId:    null,
  statusId:    null,
  assignedTo: null,
  tagsIds:      [],
  notes:     '',
})

const rules = {
  fullName: [{ required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur' }],
  phone: [{ required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' }],
  sourceId: [{ required: true, message: 'Vui lòng chọn nguồn', trigger: 'change' }],
  statusId: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }],

}
onMounted(async () => {
  console.log('Đang gọi API consultants')

  const res = await userApi.getConsultants()

  console.log('Consultants =', res.data)

  consultants.value = res.data.data
})

watch(() => props.lead, lead => {
  if (lead) {
    Object.assign(form, {
      fullName:  lead.fullName  || '',
      phone:     lead.phone     || '',
      email:     lead.email     || '',
      birthYear: lead.birthYear || '',
      sourceId:    lead.sourceId    || null,
      statusId:    lead.statusId    || null,
      assignedTo: lead.assignedTo || null,
      tagsId:      lead.tagsId      || [],
      notes:     lead.notes     || '',
    })
  } else {
    Object.assign(form, { fullName: '', phone: '', email: '', birthYear: '', sourceId: null, assignedTo: null, statusId: null, tagsId: [], notes: '' })
  }
}, { immediate: true })

async function submit() {

  await formRef.value.validate()
  loading.value = true
  try {
    const payload = { ...form }
    console.log("PAYLOAD CREATE/UPDATE =", payload)

    console.log('Payload gửi lên backend:', payload)
    if (isEdit.value) await leadStore.update(props.lead.leadId, payload)
    else              await leadStore.create(payload)
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
