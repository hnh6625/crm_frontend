<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? 'Chỉnh sửa hồ sơ' : 'Thêm hồ sơ mới'"
    width="600px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="lead-form"
    >
      <div class="form-grid">
        <el-form-item label="Trường học">
          <el-input v-model="form.schoolName" />
        </el-form-item>

        <el-form-item label="Năm tốt nghiệp">
          <el-input-number
            v-model="form.graduationYear"
            :min="2000"
            :max="2100"
            style="width:100%"
          />
        </el-form-item>

        <el-form-item label="Địa chỉ">
          <el-input v-model="form.address" />
        </el-form-item>

        <el-form-item label="Tỉnh/Thành phố" prop="province">
          <el-select v-model="form.province" placeholder="Chọn tỉnh thành" style="width:100%" filterable>
            <el-option v-for="p in provinces" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="Họ và tên" prop="fullName">
          <el-input v-model="form.fullName" placeholder="Nguyễn Văn A" />
        </el-form-item>
        <el-form-item label="Số điện thoại" prop="phone">
          <el-input v-model="form.phone" placeholder="0912 345 678" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="example@email.com" />
        </el-form-item>
        <el-form-item label="Ngày sinh" prop="birthDate">
          <el-date-picker
            v-model="form.birthDate"
            type="date"
            placeholder="Chọn ngày sinh"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="Giới tính" prop="gender">
          <el-select v-model="form.gender" placeholder="Chọn giới tính" style="width:100%">
            <el-option label="Nam" value="MALE" />
            <el-option label="Nữ" value="FEMALE" />
          </el-select>
        </el-form-item>
        <el-form-item label="Nguồn" prop="sourceId">
          <el-select v-model="form.sourceId" placeholder="Chọn nguồn" style="width:100%" filterable>
            <el-option
              v-for="s in leadStore.sources"
              :key="s.sourceId"
              :label="s.sourceName"
              :value="s.sourceId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Trạng thái" prop="statusId">
          <el-select v-model="form.statusId" placeholder="Chọn trạng thái" style="width:100%">
            <el-option
              v-for="s in availableStatuses"
              :key="s.statusId"
              :label="s.statusName"
              :value="s.statusId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Tư vấn viên">
          <el-select
            v-model="form.assignedTo"
            placeholder="Chọn tư vấn viên"
            style="width:100%"
            clearable
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

      <el-form-item label="Tags" prop="tags">
        <el-select
          v-model="form.tags"
          multiple
          placeholder="Chọn hoặc nhập tag"
          style="width:100%"
          allow-create
          filterable
          default-first-option
        >
          <el-option v-for="t in leadStore.tags" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>

      <el-form-item label="Ghi chú" prop="notes">
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
  lead: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const isEdit = computed(() => !!props.lead?.leadId || !!props.lead?.id)
const leadStore = useLeadStore()

const formRef = ref()
const loading = ref(false)
const consultants = ref([])

const provinces = [
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng", "Đắk Lắk", "Điện Biên",
  "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Nội", "Hà Tĩnh", "Hải Phòng", "Huế", "Hưng Yên",
  "Khánh Hòa", "Lai Châu", "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Nghệ An", "Ninh Bình", "Phú Thọ",
  "Quảng Ninh", "Quảng Trị", "Quảng Ngãi", "Sơn La", "Tây Ninh", "Thái Nguyên", "Thanh Hóa",
  "TP Hồ Chí Minh", "Tuyên Quang", "Vĩnh Long"
]
// lọc trạng thái
const availableStatuses = computed(() => {
  if (!leadStore.statuses) return []

  return leadStore.statuses.filter(s => {
    if (isEdit.value && props.lead?.statusId === s.statusId) {
      return true
    }

    return s.statusName !== 'Đã đăng ký'
  })
})

const form = reactive({
  fullName: '',
  phone: '',
  email: '',
  birthDate: null,
  schoolName: '',
  graduationYear: null,
  address: '',
  province: '',
  sourceId: null,
  statusId: null,
  assignedTo: null,
  tags: [],
  notes: '',
})

// Validation rules chuẩn
const rules = {
  fullName: [{ required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur' }],
  phone: [
    { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' },
    { pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/, message: 'Số điện thoại không hợp lệ', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: 'Email không đúng định dạng', trigger: ['blur', 'change'] }
  ],
  sourceId: [{ required: true, message: 'Vui lòng chọn nguồn', trigger: 'change' }],
  statusId: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }],
}

onMounted(async () => {
  try {
    const res = await userApi.getConsultants()
    consultants.value = res.data?.data || res.data || []

    if (!leadStore.statuses || leadStore.statuses.length === 0) {
      if(typeof leadStore.fetchOptions === 'function') {
        await leadStore.fetchOptions()
      }
    }
  } catch (e) {
    console.error('Lỗi khi tải danh sách tư vấn viên hoặc trạng thái:', e)
  }
})

watch(() => props.lead, lead => {
  if (lead) {
    Object.assign(form, {
      fullName: lead.fullName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      gender: lead.gender || null,
      birthDate: lead.birthDate || null,
      schoolName: lead.schoolName || '',
      graduationYear: lead.graduationYear || null,
      address: lead.address || '',
      province: lead.province || '',
      sourceId: lead.sourceId || null,
      statusId: lead.statusId || null,
      assignedTo: lead.assignedToId || lead.consultantId || null,
      tags: lead.tags || lead.tagsId || lead.tagsIds || [],
      notes: lead.note || '',
    })
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  if (formRef.value) formRef.value.resetFields()
  Object.assign(form, { fullName: '', phone: '', email: '', gender: null,birthDate: null, schoolName: '', graduationYear: null, address: '', province: '', sourceId: null, assignedTo: null, statusId: null, tags: [], notes: '' })
}

async function submit() {
  if (!formRef.value) return
  await formRef.value.validate()

  loading.value = true
  try {
    const targetId = props.lead?.leadId || props.lead?.id
    const rawTags = (form.tags || []).map(t => typeof t === 'object' ? t.tagName : t)

    const payload = {
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      gender: form.gender,
      birthDate: form.birthDate,
      schoolName: form.schoolName,
      graduationYear: form.graduationYear,
      address: form.address,
      province: form.province,
      sourceId: form.sourceId,
      statusId: form.statusId,
      assignedTo: form.assignedTo,
      note: form.notes,
      tags: rawTags
    }
    if (isEdit.value) {
      await leadStore.update(targetId, payload)

      if (form.assignedTo && form.assignedTo !== (props.lead?.assignedToId || props.lead?.assignedTo)) {
        await leadStore.assign(targetId, {
          assignToUserId: form.assignedTo,
          note: "Cập nhật lại từ form chỉnh sửa"
        })
      }

    } else {
      // Tạo mới hồ sơ
      await leadStore.create(payload)
    }

    emit('saved')
    visible.value = false
  } catch (e) {
    console.error("Lỗi khi submit:", e)
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
