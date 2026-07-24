-- YC1. Tạo tài khoản app_user
USE QuanLyLinhKienPC;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY '123456';

-- YC2. Phân quyền CRUD cho app_user
GRANT SELECT, INSERT, UPDATE, DELETE ON QuanLyLinhKienPC.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;