// Lead status
export const LEAD_STATUS_COLORS = {
  'Mới':                'info',
  'Đang liên hệ':       'warning',
  'Quan tâm':           '',
  'Đã tư vấn':          'primary',
  'Đã nhập học':        'success',
  'Từ chối':            'danger',
  'Không liên lạc được':'info',
}

// Enrollment status
export const ENROLLMENT_STATUS_LABELS = {
  PENDING:   'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã huỷ',
  COMPLETED: 'Hoàn thành',
}

export const ENROLLMENT_STATUS_COLORS = {
  PENDING:   'warning',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
  COMPLETED: 'primary',
}

// Import job status
export const IMPORT_STATUS_LABELS = {
  PENDING:    'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  COMPLETED:  'Hoàn thành',
  FAILED:     'Thất bại',
}

// Follow-up status
export const FOLLOW_UP_STATUS_LABELS = {
  PENDING:   'Chờ xử lý',
  DONE:      'Hoàn thành',
  CANCELLED: 'Đã huỷ',
}
