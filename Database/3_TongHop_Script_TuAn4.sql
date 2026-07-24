DELIMITER $$
DROP PROCEDURE IF EXISTS sp_GetTop5BestSellers$$

CREATE PROCEDURE sp_GetTop5BestSellers()
BEGIN
    SELECT 
        l.TenLinhKien, 
        SUM(c.SoLuongMua) as TotalSold, 
        SUM(c.ThanhTien) as TotalRevenue
    FROM donhang d
    JOIN chitietdonhang c ON d.MaDonHang = c.MaDonHang
    JOIN linhkien l ON c.MaLinhKien = l.MaLinhKien
    WHERE d.TrangThaiDon = 'Hoàn thành'
    GROUP BY l.MaLinhKien, l.TenLinhKien
    ORDER BY TotalSold DESC
    LIMIT 5;
END$$
DELIMITER ;

DROP VIEW IF EXISTS vw_ThongKeDoanhThu;

CREATE VIEW vw_ThongKeDoanhThu AS
SELECT 
    COUNT(MaDonHang) as TongDon, 
    SUM(TongTien) as TongDoanhThu 
FROM donhang 
WHERE TrangThaiDon = 'Hoàn thành';
