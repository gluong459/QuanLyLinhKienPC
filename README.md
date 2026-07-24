# Hệ thống Quản lý Linh kiện PC
Dự án thực tập xây dựng hệ thống phần mềm quản lý linh kiện máy tính.

## 📂 Cấu trúc thư mục
- `/Frontend`: Giao diện ứng dụng (HTML, CSS, JS thuần).
- `/Backend`: API Server (C# .NET Minimal API).
- `/Database`: Chứa toàn bộ Script cấu trúc bảng, phân quyền, Store Procedure, View và Backup script cho MySQL.

---

## 🚀 Hướng dẫn cài đặt và chạy ứng dụng (Dành cho Giảng viên/Người đánh giá)

Để chạy được toàn bộ hệ thống này trên máy cá nhân, Thầy/Cô vui lòng thực hiện theo 3 bước sau:

### Bước 1: Khởi tạo Cơ sở dữ liệu (MySQL)
1. Mở phần mềm quản lý MySQL (như **MySQL Workbench**, **XAMPP/phpMyAdmin**, hoặc **HeidiSQL**).
2. Chạy lần lượt 3 file script nằm trong thư mục `/Database` theo đúng thứ tự sau:
   - `1_quanlybanlepc.sql`: Khởi tạo Database `QuanLyLinhKienPC`, các bảng và dữ liệu mẫu.
   - `2_phan_quyen.sql`: Tạo tài khoản người dùng `app_user` (mật khẩu: `123456`) dùng để kết nối Backend.
   - `3_TongHop_Script_TuAn4.sql`: Khởi tạo các View và Stored Procedure nâng cao, đồng thời cấp quyền thực thi cho `app_user`.
3. *(Lưu ý)*: Cấu hình mặc định đang dùng cổng MySQL là **3307**. Nếu MySQL trên máy Thầy/Cô dùng cổng **3306**, vui lòng sửa lại port ở Bước 2.

### Bước 2: Chạy Backend API (C# .NET 8.0)
1. Yêu cầu cài đặt sẵn **[.NET 8.0 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)**.
2. Mở thư mục `/Backend` bằng Terminal (hoặc Command Prompt / PowerShell).
3. (Tùy chọn) Nếu cổng MySQL của Thầy/Cô là 3306, hãy mở file `Backend/Program.cs` hoặc `appsettings.json` và đổi `Port=3307` thành `Port=3306` trong Connection String.
4. Gõ lệnh sau để khởi chạy Server:
   ```bash
   dotnet run
   ```
5. Ứng dụng Backend sẽ khởi chạy thành công tại `http://localhost:5000`. Cửa sổ Terminal cần được giữ nguyên để duy trì server.

### Bước 3: Khởi chạy Frontend (HTML/JS)
1. Mở thư mục `/Frontend` bằng trình soạn thảo **Visual Studio Code**.
2. Cài đặt tiện ích (Extension) có tên là **Live Server** (của tác giả Ritwick Dey).
3. Nhấn chuột phải vào file `index.html` chọn **"Open with Live Server"**.
4. Trình duyệt sẽ tự động mở lên giao diện của phần mềm tại địa chỉ `http://127.0.0.1:5500`.

---
