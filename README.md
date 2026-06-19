# CRM Admissions Management - Frontend Dashboard

Giao diện quản trị hệ thống CRM Tuyển sinh được xây dựng bằng **Vue 3 (Composition API)**. Dự án tập trung vào việc tối ưu hóa trải nghiệm người dùng (UX/UI), xử lý mượt mà khối lượng dữ liệu lớn và tương tác API theo thời gian thực.

## Điểm nhấn kỹ thuật
- **State Management (Pinia):** Quản lý trạng thái ứng dụng phi tập trung, phân quyền hiển thị component linh hoạt dựa trên Role (Manager, Collaborator).
- **Tối ưu hóa hiển thị (Client-side Pagination):** Xử lý DOM mượt mà khi render hàng chục ngàn dòng dữ liệu lỗi trả về từ hệ thống Import mà không gây treo trình duyệt.
- **Axios Interceptors:** Xử lý tự động đính kèm Token, cơ chế **Auto Refresh Token** khi hết phiên đăng nhập, và tùy biến Timeout linh hoạt cho các API tải file dung lượng lớn.
- **UI Components:** Sử dụng Element Plus kết hợp với TailwindCSS để xây dựng giao diện Dashboard chuyên nghiệp, thân thiện.

## Công nghệ sử dụng
- **Core:** Vue 3 (Composition API), Vite
- **Router & State:** Vue Router, Pinia
- **HTTP Client:** Axios
- **UI Framework:** Element Plus, TailwindCSS

## Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- Node.js version 18.x trở lên.
- Npm hoặc Yarn.

### 2. Cài đặt và khởi chạy 
- **Cài đặt các thư viện (dependencies)**
    
    npm install

- **Chạy server ở chế độ phát triển (development)**

    npm run dev
### 3. Cấu hình môi trường
Tạo một file `.env.development` ở thư mục gốc (nếu chưa có) và trỏ API về Backend đang chạy:
```env
VITE_API_URL=http://localhost:8080