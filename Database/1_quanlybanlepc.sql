CREATE DATABASE IF NOT EXISTS QuanLyLinhKienPC CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE QuanLyLinhKienPC;

CREATE TABLE LoaiLinhKien (
    MaLoai INT AUTO_INCREMENT PRIMARY KEY,
    TenLoai NVARCHAR(100) UNIQUE NOT NULL,
    MoTa NVARCHAR(255)
);

CREATE TABLE ThuocTinh (
    MaThuocTinh INT AUTO_INCREMENT PRIMARY KEY,
    MaLoai INT,
    TenThuocTinh NVARCHAR(100) NOT NULL,
    FOREIGN KEY (MaLoai) REFERENCES LoaiLinhKien(MaLoai) ON DELETE CASCADE
);

CREATE TABLE LinhKien (
    MaLinhKien INT AUTO_INCREMENT PRIMARY KEY,
    MaLoai INT,
    TenLinhKien NVARCHAR(255) NOT NULL,
    GiaBanHienTai DECIMAL(12,2) CHECK (GiaBanHienTai >= 0),
    SoLuongTonKho INT CHECK (SoLuongTonKho >= 0),
    TrangThai NVARCHAR(50) NOT NULL,
    FOREIGN KEY (MaLoai) REFERENCES LoaiLinhKien(MaLoai) ON DELETE SET NULL
);

CREATE TABLE ChiTietThongSo (
    MaLinhKien INT,
    MaThuocTinh INT,
    GiaTri NVARCHAR(255) NOT NULL,
    PRIMARY KEY (MaLinhKien, MaThuocTinh),
    FOREIGN KEY (MaLinhKien) REFERENCES LinhKien(MaLinhKien) ON DELETE CASCADE,
    FOREIGN KEY (MaThuocTinh) REFERENCES ThuocTinh(MaThuocTinh) ON DELETE CASCADE
);

CREATE TABLE PhieuNhapHang (
    MaPhieuNhap INT AUTO_INCREMENT PRIMARY KEY,
    NgayNhap DATETIME DEFAULT CURRENT_TIMESTAMP,
    TongTienNhap DECIMAL(15,2) CHECK (TongTienNhap >= 0)
);

CREATE TABLE ChiTietPhieuNhap (
    MaPhieuNhap INT,
    MaLinhKien INT,
    SoLuongNhap INT CHECK (SoLuongNhap > 0),
    GiaNhap DECIMAL(12,2) CHECK (GiaNhap >= 0),
    ThanhTien DECIMAL(15,2) CHECK (ThanhTien >= 0),
    PRIMARY KEY (MaPhieuNhap, MaLinhKien),
    FOREIGN KEY (MaPhieuNhap) REFERENCES PhieuNhapHang(MaPhieuNhap) ON DELETE CASCADE,
    FOREIGN KEY (MaLinhKien) REFERENCES LinhKien(MaLinhKien) ON DELETE CASCADE
);

CREATE TABLE KhachHang (
    MaKhachHang INT AUTO_INCREMENT PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(20) UNIQUE NOT NULL,
    DiaChi NVARCHAR(255),
    Email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE DonHang (
    MaDonHang INT AUTO_INCREMENT PRIMARY KEY,
    MaKhachHang INT,
    NgayDatHang DATETIME DEFAULT CURRENT_TIMESTAMP,
    TongTien DECIMAL(15,2) CHECK (TongTien >= 0),
    TrangThaiDon NVARCHAR(50) CHECK (TrangThaiDon IN ('Chờ xác nhận', 'Đang đóng gói', 'Đang giao hàng', 'Hoàn thành', 'Hủy')),
    DiaChiGiaoHang NVARCHAR(100) NOT NULL,
    FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang) ON DELETE RESTRICT
);

CREATE TABLE ChiTietDonHang (
    MaDonHang INT,
    MaLinhKien INT,
    SoLuongMua INT CHECK (SoLuongMua > 0),
    DonGiaLuuVet DECIMAL(12,2) CHECK (DonGiaLuuVet >= 0),
    ThanhTien DECIMAL(15,2) CHECK (ThanhTien >= 0),
    PRIMARY KEY (MaDonHang, MaLinhKien),
    FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang) ON DELETE CASCADE,
    FOREIGN KEY (MaLinhKien) REFERENCES LinhKien(MaLinhKien) ON DELETE CASCADE
);

CREATE TABLE LichSuGia (
    MaLichSu INT AUTO_INCREMENT PRIMARY KEY,
    MaLinhKien INT,
    GiaCu DECIMAL(12,2) CHECK (GiaCu >= 0),
    GiaMoi DECIMAL(12,2) CHECK (GiaMoi >= 0),
    ThoiGianThayDoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaLinhKien) REFERENCES LinhKien(MaLinhKien) ON DELETE CASCADE
);

INSERT INTO LoaiLinhKien (TenLoai, MoTa) VALUES
('CPU', 'Bộ vi xử lý trung tâm (Central Processing Unit)'),
('VGA', 'Card đồ họa chuyên dụng'),
('Mainboard', 'Bo mạch chủ hệ thống'),
('RAM', 'Bộ nhớ trong lưu trữ tạm thời');

INSERT INTO ThuocTinh (MaLoai, TenThuocTinh) VALUES
(1, 'Socket'), (1, 'Số nhân / Số luồng'), (1, 'Xung nhịp'),
(2, 'Dung lượng VRAM'), (2, 'Cổng xuất hình'),
(3, 'Chipset'), (3, 'Kích thước chuẩn'),
(4, 'Dung lượng bộ nhớ'), (4, 'Bus RAM');

INSERT INTO LinhKien (MaLoai, TenLinhKien, GiaBanHienTai, SoLuongTonKho, TrangThai) VALUES
(1, 'Intel Core i5 13400F', 5200000, 20, 'Đang kinh doanh'),
(1, 'AMD Ryzen 5 7600X', 5900000, 15, 'Đang kinh doanh'),
(2, 'Gigabyte RTX 3060 12GB', 7500000, 10, 'Đang kinh doanh'),
(2, 'ASUS Dual RX 6700 XT', 8200000, 8, 'Đang kinh doanh'),
(3, 'MSI MAG B760M MORTAR', 4100000, 12, 'Đang kinh doanh'),
(4, 'Kingston Fury Beast 16GB DDR5', 1500000, 30, 'Đang kinh doanh');

INSERT INTO ChiTietThongSo (MaLinhKien, MaThuocTinh, GiaTri) VALUES
(1, 1, 'LGA 1700'), (1, 2, '10 Nhân / 16 Luồng'), (1, 3, '4.6 GHz'),
(2, 1, 'AM5'), (2, 2, '6 Nhân / 12 Luồng'), (2, 3, '5.3 GHz'),
(3, 4, '12GB GDDR6'), (3, 5, '2x HDMI, 2x DP'),
(4, 4, '12GB GDDR6'), (4, 5, '1x HDMI, 3x DP'),
(5, 6, 'Intel B760'), (5, 7, 'Micro-ATX'),
(6, 8, '16GB'), (6, 9, '5200 MHz');

INSERT INTO KhachHang (HoTen, SoDienThoai, DiaChi, Email) VALUES
('Nguyễn Văn A', '0901234567', 'Xuân Mai, Chương Mỹ, Hà Nội', 'nva@gmail.com'),
('Trần Thị B', '0912345678', 'Cầu Giấy, Hà Nội', 'ttb@gmail.com');

INSERT INTO PhieuNhapHang (TongTienNhap) VALUES (48000000);

INSERT INTO ChiTietPhieuNhap (MaPhieuNhap, MaLinhKien, SoLuongNhap, GiaNhap, ThanhTien) VALUES
(1, 1, 10, 4800000, 48000000);

INSERT INTO DonHang (MaKhachHang, TongTien, TrangThaiDon, DiaChiGiaoHang) VALUES
(1, 12700000, 'Hoàn thành', 'Xuân Mai, Chương Mỹ, Hà Nội');

INSERT INTO ChiTietDonHang (MaDonHang, MaLinhKien, SoLuongMua, DonGiaLuuVet, ThanhTien) VALUES
(1, 1, 1, 5200000, 5200000),
(1, 3, 1, 7500000, 7500000);

INSERT INTO LichSuGia (MaLinhKien, GiaCu, GiaMoi) VALUES
(1, 5500000, 5200000),
(3, 8000000, 7500000);