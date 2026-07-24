using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => 
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors("AllowAll");

// Middleware Bắt lỗi toàn cục (Global Exception Handling)
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (MySqlException ex)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        
        // Bắt lỗi Row Lock (Lock wait timeout hoặc Command Timeout do chờ khóa)
        if (ex.Number == 1205 || ex.Message.Contains("Timeout") || ex.Message.Contains("timeout"))
        {
            await context.Response.WriteAsJsonAsync(new { message = "Dữ liệu đang được cập nhật bởi người khác. Vui lòng đợi trong giây lát!" });
        }
        // Bắt lỗi mất kết nối MySQL (khi dịch vụ bị tắt)
        else if (ex.Number == 1042 || ex.Number == 0 || ex.Message.Contains("Unable to connect"))
        {
            await context.Response.WriteAsJsonAsync(new { message = "Hệ thống đang bảo trì hoặc mất kết nối tới cơ sở dữ liệu. Vui lòng thử lại sau!" });
        }
        else
        {
            await context.Response.WriteAsJsonAsync(new { message = "Lỗi cơ sở dữ liệu: " + ex.Message });
        }
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "Có lỗi hệ thống xảy ra: " + ex.Message });
    }
});

string GetConnectionString(IConfiguration config) 
    => config.GetConnectionString("DefaultConnection") ?? "Server=localhost;Port=3307;Database=quanlylinhkienpc;Uid=app_user;Pwd=123456;";

string GetAdminConnectionString(IConfiguration config)
    => (config.GetConnectionString("DefaultConnection") ?? "Server=localhost;Port=3307;Database=quanlylinhkienpc;Uid=app_user;Pwd=123456;").Replace("Uid=app_user", "Uid=root");
try {
    using var conn = new MySqlConnection(GetAdminConnectionString(app.Configuration));
    conn.Open();
    using var cmd = new MySqlCommand("ALTER TABLE linhkien ADD COLUMN PhanTramGiamGia INT DEFAULT 0;", conn);
    cmd.ExecuteNonQuery();
} catch {
}
try {
    using var conn = new MySqlConnection(GetAdminConnectionString(app.Configuration));
    conn.Open();
    using var cmd = new MySqlCommand("ALTER TABLE linhkien ADD COLUMN HinhAnh TEXT;", conn);
    cmd.ExecuteNonQuery();
} catch {
}
try {
    using var conn = new MySqlConnection(GetAdminConnectionString(app.Configuration));
    conn.Open();
    using var cmd = new MySqlCommand(@"
        ALTER TABLE khachhang 
        ADD COLUMN TenDangNhap VARCHAR(50) UNIQUE AFTER MaKhachHang, 
        ADD COLUMN MatKhau VARCHAR(255) AFTER TenDangNhap, 
        ADD COLUMN NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP;", conn);
    cmd.ExecuteNonQuery();
} catch {
}
try {
    using var conn = new MySqlConnection(GetAdminConnectionString(app.Configuration));
    conn.Open();
    using var cmd = new MySqlCommand(@"
        CREATE TABLE IF NOT EXISTS chitietthuoctinh (
            MaLinhKien INT,
            MaThuocTinh INT,
            GiaTri VARCHAR(255),
            PRIMARY KEY (MaLinhKien, MaThuocTinh)
        );", conn);
    cmd.ExecuteNonQuery();
} catch {
}
try {
    using var conn = new MySqlConnection(GetAdminConnectionString(app.Configuration));
    conn.Open();
    using var cmd = new MySqlCommand("ALTER TABLE thuoctinh ADD COLUMN DonVi VARCHAR(50);", conn);
    cmd.ExecuteNonQuery();
} catch {
}
app.MapGet("/api/loailinhkien", async (IConfiguration config) =>
{
    var list = new List<LoaiLinhKien>();
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("SELECT * FROM loailinhkien", conn);
    using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        list.Add(new LoaiLinhKien(
            Convert.ToInt32(reader["MaLoai"]),
            reader["TenLoai"].ToString()!
        ));
    }
    return Results.Ok(list);
});

app.MapPost("/api/loailinhkien", async (LoaiLinhKien item, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("INSERT INTO loailinhkien (TenLoai) VALUES (@TenLoai)", conn);
    cmd.Parameters.AddWithValue("@TenLoai", item.tenLoai);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Category added successfully" });
});

app.MapPut("/api/loailinhkien/{id}", async (int id, LoaiLinhKien item, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("UPDATE loailinhkien SET TenLoai = @TenLoai WHERE MaLoai = @Id", conn);
    cmd.Parameters.AddWithValue("@TenLoai", item.tenLoai);
    cmd.Parameters.AddWithValue("@Id", id);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Category updated successfully" });
});

app.MapDelete("/api/loailinhkien/{id}", async (int id, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("DELETE FROM loailinhkien WHERE MaLoai = @Id", conn);
    cmd.Parameters.AddWithValue("@Id", id);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Category deleted successfully" });
});
app.MapGet("/api/linhkien", async (IConfiguration config) =>
{
    var list = new List<LinhKienResponse>();
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand(@"
        SELECT lk.MaLinhKien, lk.TenLinhKien, lk.GiaBanHienTai, lk.MaLoai, llk.TenLoai, lk.PhanTramGiamGia, lk.SoLuongTonKho, lk.HinhAnh 
        FROM linhkien lk
        LEFT JOIN loailinhkien llk ON lk.MaLoai = llk.MaLoai
    ", conn);
    using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        list.Add(new LinhKienResponse(
            Convert.ToInt32(reader["MaLinhKien"]),
            reader["TenLinhKien"].ToString()!,
            Convert.ToDecimal(reader["GiaBanHienTai"]),
            reader["HinhAnh"] == DBNull.Value ? "" : reader["HinhAnh"].ToString()!,
            reader["MaLoai"] == DBNull.Value ? 0 : Convert.ToInt32(reader["MaLoai"]),
            reader["TenLoai"] == DBNull.Value ? "Khác" : reader["TenLoai"].ToString()!,
            reader["PhanTramGiamGia"] == DBNull.Value ? 0 : Convert.ToInt32(reader["PhanTramGiamGia"]),
            reader["SoLuongTonKho"] == DBNull.Value ? 0 : Convert.ToInt32(reader["SoLuongTonKho"])
        ));
    }
    return Results.Ok(list);
});

app.MapPost("/api/linhkien", async (LinhKienRequest item, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("INSERT INTO linhkien (MaLoai, TenLinhKien, GiaBanHienTai, PhanTramGiamGia, SoLuongTonKho, TrangThai, HinhAnh) VALUES (@MaLoai, @Name, @Price, @Discount, @Stock, 'Đang kinh doanh', @Img)", conn);
    cmd.Parameters.AddWithValue("@Name", item.name);
    cmd.Parameters.AddWithValue("@Price", item.price);
    cmd.Parameters.AddWithValue("@MaLoai", item.categoryId);
    cmd.Parameters.AddWithValue("@Discount", item.discount);
    cmd.Parameters.AddWithValue("@Stock", item.stock);
    cmd.Parameters.AddWithValue("@Img", item.img ?? "");
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Added successfully", id = cmd.LastInsertedId });
});

app.MapPut("/api/linhkien/{id}", async (int id, LinhKienRequest item, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("UPDATE linhkien SET TenLinhKien = @Name, GiaBanHienTai = @Price, MaLoai = @MaLoai, PhanTramGiamGia = @Discount, SoLuongTonKho = @Stock, HinhAnh = @Img WHERE MaLinhKien = @Id", conn);
    cmd.Parameters.AddWithValue("@Name", item.name);
    cmd.Parameters.AddWithValue("@Price", item.price);
    cmd.Parameters.AddWithValue("@MaLoai", item.categoryId);
    cmd.Parameters.AddWithValue("@Discount", item.discount);
    cmd.Parameters.AddWithValue("@Stock", item.stock);
    cmd.Parameters.AddWithValue("@Img", item.img ?? "");
    cmd.Parameters.AddWithValue("@Id", id);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Updated successfully" });
});

app.MapDelete("/api/linhkien/{id}", async (int id, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("DELETE FROM linhkien WHERE MaLinhKien = @Id", conn);
    cmd.Parameters.AddWithValue("@Id", id);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Deleted successfully" });
});
app.MapPost("/api/upload", async (HttpRequest request) =>
{
    if (!request.HasFormContentType || !request.Form.Files.Any())
        return Results.BadRequest(new { message = "No files uploaded" });

    var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "..", "images");
    if (!Directory.Exists(uploadFolder))
        Directory.CreateDirectory(uploadFolder);

    var urls = new List<string>();
    foreach (var file in request.Form.Files)
    {
        string hashStr;
        using (var md5 = System.Security.Cryptography.MD5.Create())
        {
            using var readStream = file.OpenReadStream();
            var hashBytes = md5.ComputeHash(readStream);
            hashStr = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
        var fileName = hashStr + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(uploadFolder, fileName);
        if (!File.Exists(filePath))
        {
            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);
        }
        urls.Add("images/" + fileName);
    }
    return Results.Ok(urls);
});
app.MapGet("/api/donhang", async (IConfiguration config) =>
{
    var list = new List<DonHangResponse>();
    try {
        using var conn = new MySqlConnection(GetConnectionString(config));
        await conn.OpenAsync();
        using var cmd = new MySqlCommand(@"
            SELECT d.MaDonHang, k.HoTen, d.NgayDatHang, d.TongTien, d.TrangThaiDon, d.DiaChiGiaoHang 
            FROM donhang d 
            LEFT JOIN khachhang k ON d.MaKhachHang = k.MaKhachHang
            ORDER BY d.NgayDatHang DESC", conn);
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new DonHangResponse(
                Convert.ToInt32(reader["MaDonHang"]),
                reader["HoTen"] == DBNull.Value ? "Khách lẻ" : reader["HoTen"].ToString()!,
                Convert.ToDateTime(reader["NgayDatHang"]),
                Convert.ToDecimal(reader["TongTien"]),
                reader["TrangThaiDon"].ToString()!,
                reader["DiaChiGiaoHang"] == DBNull.Value ? "" : reader["DiaChiGiaoHang"].ToString()!
            ));
        }
        return Results.Ok(list);
    } catch { return Results.Ok(new List<DonHangResponse>()); }
});

app.MapPut("/api/donhang/{id}/status", async (int id, UpdateOrderStatusRequest req, IConfiguration config) =>
{
    try {
        using var conn = new MySqlConnection(GetConnectionString(config));
        await conn.OpenAsync();
        
        using var cmdCheck = new MySqlCommand("SELECT TrangThaiDon FROM donhang WHERE MaDonHang = @Id", conn);
        cmdCheck.Parameters.AddWithValue("@Id", id);
        var currentStatus = (await cmdCheck.ExecuteScalarAsync())?.ToString();
        
        if (currentStatus == req.status) {
            return Results.Ok(new { message = "Status updated" });
        }

        try {
            using var cmd = new MySqlCommand("UPDATE donhang SET TrangThaiDon = @Status WHERE MaDonHang = @Id", conn);
            cmd.Parameters.AddWithValue("@Status", req.status);
            cmd.Parameters.AddWithValue("@Id", id);
            await cmd.ExecuteNonQueryAsync();

            if (req.status == "Hoàn thành" && currentStatus != "Hoàn thành") {
                using var cmdStock = new MySqlCommand(@"
                    UPDATE linhkien l
                    JOIN chitietdonhang c ON l.MaLinhKien = c.MaLinhKien
                    SET l.SoLuongTonKho = l.SoLuongTonKho - c.SoLuongMua
                    WHERE c.MaDonHang = @Id AND l.SoLuongTonKho >= c.SoLuongMua", conn);
                cmdStock.Parameters.AddWithValue("@Id", id);
                await cmdStock.ExecuteNonQueryAsync();
            } else if (currentStatus == "Hoàn thành" && req.status != "Hoàn thành") {
                using var cmdStock = new MySqlCommand(@"
                    UPDATE linhkien l
                    JOIN chitietdonhang c ON l.MaLinhKien = c.MaLinhKien
                    SET l.SoLuongTonKho = l.SoLuongTonKho + c.SoLuongMua
                    WHERE c.MaDonHang = @Id", conn);
                cmdStock.Parameters.AddWithValue("@Id", id);
                await cmdStock.ExecuteNonQueryAsync();
            }

            return Results.Ok(new { message = "Status updated" });
        } catch (Exception ex) { return Results.Problem(ex.Message); }
    } catch (Exception ex) { return Results.Problem(ex.Message); }
});

app.MapGet("/api/donhang/{id}/chitiet", async (int id, IConfiguration config) =>
{
    var list = new List<ChiTietDonHangResponse>();
    try {
        using var conn = new MySqlConnection(GetConnectionString(config));
        await conn.OpenAsync();
        using var cmd = new MySqlCommand(@"
            SELECT l.TenLinhKien, c.SoLuongMua, c.DonGiaLuuVet
            FROM chitietdonhang c
            JOIN linhkien l ON c.MaLinhKien = l.MaLinhKien
            WHERE c.MaDonHang = @Id", conn);
        cmd.Parameters.AddWithValue("@Id", id);
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new ChiTietDonHangResponse(
                reader["TenLinhKien"].ToString()!,
                Convert.ToInt32(reader["SoLuongMua"]),
                Convert.ToDecimal(reader["DonGiaLuuVet"])
            ));
        }
        return Results.Ok(list);
    } catch { return Results.Ok(new List<ChiTietDonHangResponse>()); }
});


app.MapPost("/api/donhang", async (OrderRequest req, IConfiguration config) =>
{
    try {
        using var conn = new MySqlConnection(GetConnectionString(config));
        await conn.OpenAsync();
        
        using var cmd = new MySqlCommand(@"
            INSERT INTO donhang (MaKhachHang, NgayDatHang, TongTien, TrangThaiDon, DiaChiGiaoHang)
            VALUES (@MaKhachHang, @NgayDatHang, @TongTien, 'Chờ xác nhận', @DiaChiGiaoHang);
            SELECT LAST_INSERT_ID();", conn);
        
        if (req.customerId > 0)
            cmd.Parameters.AddWithValue("@MaKhachHang", req.customerId);
        else
            cmd.Parameters.AddWithValue("@MaKhachHang", DBNull.Value);
            
        cmd.Parameters.AddWithValue("@NgayDatHang", DateTime.Now);
        cmd.Parameters.AddWithValue("@TongTien", req.total);
        cmd.Parameters.AddWithValue("@DiaChiGiaoHang", string.IsNullOrEmpty(req.address) ? "Không có" : req.address);
        
        int maDonHang = Convert.ToInt32(await cmd.ExecuteScalarAsync());

        foreach(var item in req.details) {
            using var cmdDetail = new MySqlCommand(@"
                INSERT INTO chitietdonhang (MaDonHang, MaLinhKien, SoLuongMua, DonGiaLuuVet, ThanhTien)
                VALUES (@MaDonHang, @MaLinhKien, @SoLuongMua, @DonGiaLuuVet, @ThanhTien)", conn);
            cmdDetail.Parameters.AddWithValue("@MaDonHang", maDonHang);
            cmdDetail.Parameters.AddWithValue("@MaLinhKien", item.productId);
            cmdDetail.Parameters.AddWithValue("@SoLuongMua", item.quantity);
            cmdDetail.Parameters.AddWithValue("@DonGiaLuuVet", item.unitPrice);
            cmdDetail.Parameters.AddWithValue("@ThanhTien", item.quantity * item.unitPrice);
            await cmdDetail.ExecuteNonQueryAsync();
        }

        return Results.Ok(new { message = "Đặt hàng thành công!", orderId = maDonHang });
    } catch (Exception ex) {
        return Results.Problem(ex.Message);
    }
});
app.MapGet("/api/thongke", async (IConfiguration config) =>
{
    try {
        using var conn = new MySqlConnection(GetConnectionString(config));
        await conn.OpenAsync();
        using var cmd = new MySqlCommand("SELECT TongDon, TongDoanhThu FROM vw_ThongKeDoanhThu", conn);
        using var reader = await cmd.ExecuteReaderAsync();
        int tongDon = 0;
        decimal tongDoanhThu = 0;
        if (await reader.ReadAsync()) {
            tongDon = reader["TongDon"] != DBNull.Value ? Convert.ToInt32(reader["TongDon"]) : 0;
            tongDoanhThu = reader["TongDoanhThu"] != DBNull.Value ? Convert.ToDecimal(reader["TongDoanhThu"]) : 0;
        }
        return Results.Ok(new { tongDon, tongDoanhThu });
    } catch { return Results.Ok(new { tongDon = 0, tongDoanhThu = 0 }); }
});

app.MapGet("/api/thongke/top5", async (IConfiguration config) =>
{
    var list = new List<TopItemResponse>();
    try {
        using var conn = new MySqlConnection(GetConnectionString(config));
        await conn.OpenAsync();
        using var cmd = new MySqlCommand("sp_GetTop5BestSellers", conn);
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new TopItemResponse(
                reader["TenLinhKien"].ToString()!,
                Convert.ToInt32(reader["TotalSold"]),
                Convert.ToDecimal(reader["TotalRevenue"])
            ));
        }
        return Results.Ok(list);
    } catch (Exception ex) { 
        Console.WriteLine("Error in /api/thongke/top5: " + ex.Message);
        return Results.Ok(new List<TopItemResponse>()); 
    }
});
app.MapPost("/api/register", async (RegisterRequest req, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    
    using var checkCmd = new MySqlCommand("SELECT COUNT(*) FROM khachhang WHERE TenDangNhap = @User", conn);
    checkCmd.Parameters.AddWithValue("@User", req.username);
    long count = (long)await checkCmd.ExecuteScalarAsync();
    
    if (count > 0) return Results.BadRequest(new { message = "Tên đăng nhập đã tồn tại!" });

    using var cmd = new MySqlCommand(@"
        INSERT INTO khachhang (TenDangNhap, MatKhau, HoTen, Email, SoDienThoai) 
        VALUES (@User, @Pass, @Name, @Email, @Phone)", conn);
    cmd.Parameters.AddWithValue("@User", req.username);
    cmd.Parameters.AddWithValue("@Pass", req.password); 
    cmd.Parameters.AddWithValue("@Name", req.fullName);
    cmd.Parameters.AddWithValue("@Email", req.email);
    cmd.Parameters.AddWithValue("@Phone", req.phone);
    await cmd.ExecuteNonQueryAsync();

    return Results.Ok(new { message = "Đăng ký thành công!" });
});

app.MapPost("/api/login", async (LoginRequest req, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("SELECT * FROM khachhang WHERE TenDangNhap = @User AND MatKhau = @Pass", conn);
    cmd.Parameters.AddWithValue("@User", req.username);
    cmd.Parameters.AddWithValue("@Pass", req.password);
    
    using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        return Results.Ok(new { 
            message = "Đăng nhập thành công",
            user = new {
                id = reader["MaKhachHang"],
                username = reader["TenDangNhap"].ToString(),
                fullName = reader["HoTen"].ToString(),
                email = reader["Email"].ToString(),
                phone = reader["SoDienThoai"].ToString(),
                address = reader["DiaChi"] == DBNull.Value ? "" : reader["DiaChi"].ToString()
            }
        });
    }
    
    return Results.BadRequest(new { message = "Tên đăng nhập hoặc mật khẩu không đúng!" });
});

app.MapGet("/api/khachhang/{id}/donhang", async (int id, IConfiguration config) =>
{
    var list = new List<DonHangResponse>();
    try {
        using var conn = new MySqlConnection(GetConnectionString(config));
        await conn.OpenAsync();
        using var cmd = new MySqlCommand(@"
            SELECT d.MaDonHang, k.HoTen, d.NgayDatHang, d.TongTien, d.TrangThaiDon, d.DiaChiGiaoHang 
            FROM donhang d 
            JOIN khachhang k ON d.MaKhachHang = k.MaKhachHang
            WHERE d.MaKhachHang = @Id
            ORDER BY d.NgayDatHang DESC", conn);
        cmd.Parameters.AddWithValue("@Id", id);
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new DonHangResponse(
                Convert.ToInt32(reader["MaDonHang"]),
                reader["HoTen"].ToString()!,
                Convert.ToDateTime(reader["NgayDatHang"]),
                Convert.ToDecimal(reader["TongTien"]),
                reader["TrangThaiDon"].ToString()!,
                reader["DiaChiGiaoHang"] == DBNull.Value ? "" : reader["DiaChiGiaoHang"].ToString()!
            ));
        }
        return Results.Ok(list);
    } catch { return Results.Ok(new List<DonHangResponse>()); }
});

app.MapGet("/api/khachhang/all", async (IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    var list = new List<object>();
    using var cmd = new MySqlCommand("SELECT * FROM khachhang ORDER BY NgayTao DESC", conn);
    using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        list.Add(new {
            id = reader["MaKhachHang"],
            username = reader["TenDangNhap"].ToString(),
            fullName = reader["HoTen"].ToString(),
            email = reader["Email"].ToString(),
            phone = reader["SoDienThoai"].ToString(),
            address = reader["DiaChi"] == DBNull.Value ? "" : reader["DiaChi"].ToString(),
            createdAt = reader["NgayTao"] == DBNull.Value ? null : reader["NgayTao"]
        });
    }
    return Results.Ok(list);
});

app.MapGet("/api/khachhang/{id}", async (int id, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("SELECT * FROM khachhang WHERE MaKhachHang = @Id", conn);
    cmd.Parameters.AddWithValue("@Id", id);
    using var reader = await cmd.ExecuteReaderAsync();
    
    if (await reader.ReadAsync())
    {
        return Results.Ok(new {
            id = reader["MaKhachHang"],
            username = reader["TenDangNhap"].ToString(),
            fullName = reader["HoTen"].ToString(),
            email = reader["Email"].ToString(),
            phone = reader["SoDienThoai"].ToString(),
            address = reader["DiaChi"] == DBNull.Value ? "" : reader["DiaChi"].ToString()
        });
    }
    return Results.NotFound();
});

app.MapPut("/api/khachhang/{id}", async (int id, UpdateUserRequest req, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand(@"
        UPDATE khachhang 
        SET HoTen = @Name, Email = @Email, SoDienThoai = @Phone, DiaChi = @Address 
        WHERE MaKhachHang = @Id", conn);
    cmd.Parameters.AddWithValue("@Name", req.fullName);
    cmd.Parameters.AddWithValue("@Email", req.email);
    cmd.Parameters.AddWithValue("@Phone", req.phone);
    cmd.Parameters.AddWithValue("@Address", req.address);
    cmd.Parameters.AddWithValue("@Id", id);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Cập nhật thành công!" });
});

app.MapDelete("/api/khachhang/{id}", async (int id, IConfiguration config) =>
{
    try {
        using var conn = new MySqlConnection(GetConnectionString(config));
        await conn.OpenAsync();
        
        using var updateCmd = new MySqlCommand("UPDATE donhang SET MaKhachHang = NULL WHERE MaKhachHang = @Id", conn);
        updateCmd.Parameters.AddWithValue("@Id", id);
        await updateCmd.ExecuteNonQueryAsync();
        
        using var cmd = new MySqlCommand("DELETE FROM khachhang WHERE MaKhachHang = @Id", conn);
        cmd.Parameters.AddWithValue("@Id", id);
        await cmd.ExecuteNonQueryAsync();
        return Results.Ok(new { message = "Xóa khách hàng thành công" });
    } catch (Exception ex) {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/reset-password", async (ResetPasswordRequest req, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    
    using var checkCmd = new MySqlCommand("SELECT COUNT(*) FROM khachhang WHERE Email = @Email", conn);
    checkCmd.Parameters.AddWithValue("@Email", req.email);
    var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
    
    if (count == 0) return Results.BadRequest(new { message = "Không tìm thấy tài khoản với email này!" });
    
    using var updateCmd = new MySqlCommand("UPDATE khachhang SET MatKhau = @Pass WHERE Email = @Email", conn);
    updateCmd.Parameters.AddWithValue("@Email", req.email);
    updateCmd.Parameters.AddWithValue("@Pass", req.newPassword);
    await updateCmd.ExecuteNonQueryAsync();
    
    return Results.Ok(new { message = "Cập nhật mật khẩu thành công!" });
});

app.MapGet("/api/thuoctinh", async (IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    var list = new List<ThuocTinhResponse>();
    using var cmd = new MySqlCommand(@"
        SELECT t.MaThuocTinh, t.MaLoai, l.TenLoai, t.TenThuocTinh, t.DonVi 
        FROM thuoctinh t 
        JOIN loailinhkien l ON t.MaLoai = l.MaLoai
        ORDER BY t.MaThuocTinh DESC", conn);
    using var reader = await cmd.ExecuteReaderAsync();
    while(await reader.ReadAsync())
    {
        list.Add(new ThuocTinhResponse(
            Convert.ToInt32(reader["MaThuocTinh"]),
            Convert.ToInt32(reader["MaLoai"]),
            reader["TenLoai"].ToString(),
            reader["TenThuocTinh"].ToString(),
            reader["DonVi"] != DBNull.Value ? reader["DonVi"].ToString() : ""
        ));
    }
    return Results.Ok(list);
});

app.MapGet("/api/thuoctinh/loai/{id}", async (int id, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    var list = new List<ThuocTinhResponse>();
    using var cmd = new MySqlCommand(@"
        SELECT t.MaThuocTinh, t.MaLoai, l.TenLoai, t.TenThuocTinh, t.DonVi 
        FROM thuoctinh t 
        JOIN loailinhkien l ON t.MaLoai = l.MaLoai
        WHERE t.MaLoai = @Id", conn);
    cmd.Parameters.AddWithValue("@Id", id);
    using var reader = await cmd.ExecuteReaderAsync();
    while(await reader.ReadAsync())
    {
        list.Add(new ThuocTinhResponse(
            Convert.ToInt32(reader["MaThuocTinh"]),
            Convert.ToInt32(reader["MaLoai"]),
            reader["TenLoai"].ToString(),
            reader["TenThuocTinh"].ToString(),
            reader["DonVi"] != DBNull.Value ? reader["DonVi"].ToString() : ""
        ));
    }
    return Results.Ok(list);
});

app.MapPost("/api/thuoctinh", async (ThuocTinhRequest req, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("INSERT INTO thuoctinh (MaLoai, TenThuocTinh, DonVi) VALUES (@MaLoai, @TenThuocTinh, @DonVi)", conn);
    cmd.Parameters.AddWithValue("@MaLoai", req.categoryId);
    cmd.Parameters.AddWithValue("@TenThuocTinh", req.name);
    cmd.Parameters.AddWithValue("@DonVi", req.unit ?? "");
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Thêm thuộc tính thành công", id = cmd.LastInsertedId });
});

app.MapPut("/api/thuoctinh/{id}", async (int id, ThuocTinhRequest req, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("UPDATE thuoctinh SET MaLoai = @MaLoai, TenThuocTinh = @TenThuocTinh, DonVi = @DonVi WHERE MaThuocTinh = @Id", conn);
    cmd.Parameters.AddWithValue("@Id", id);
    cmd.Parameters.AddWithValue("@MaLoai", req.categoryId);
    cmd.Parameters.AddWithValue("@TenThuocTinh", req.name);
    cmd.Parameters.AddWithValue("@DonVi", req.unit ?? "");
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Cập nhật thuộc tính thành công" });
});

app.MapDelete("/api/thuoctinh/{id}", async (int id, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var cmd = new MySqlCommand("DELETE FROM thuoctinh WHERE MaThuocTinh = @Id", conn);
    cmd.Parameters.AddWithValue("@Id", id);
    await cmd.ExecuteNonQueryAsync();
    return Results.Ok(new { message = "Xóa thuộc tính thành công" });
});

app.MapGet("/api/linhkien/{id}/thuoctinh", async (int id, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    var list = new List<ChiTietThuocTinhResponse>();
    using var cmd = new MySqlCommand(@"
        SELECT c.MaThuocTinh, t.TenThuocTinh, c.GiaTri, t.DonVi 
        FROM chitietthuoctinh c 
        JOIN thuoctinh t ON c.MaThuocTinh = t.MaThuocTinh 
        WHERE c.MaLinhKien = @Id", conn);
    cmd.Parameters.AddWithValue("@Id", id);
    using var reader = await cmd.ExecuteReaderAsync();
    while(await reader.ReadAsync())
    {
        list.Add(new ChiTietThuocTinhResponse(
            Convert.ToInt32(reader["MaThuocTinh"]),
            reader["TenThuocTinh"].ToString(),
            reader["GiaTri"].ToString(),
            reader["DonVi"] != DBNull.Value ? reader["DonVi"].ToString() : ""
        ));
    }
    return Results.Ok(list);
});

app.MapPut("/api/linhkien/{id}/thuoctinh", async (int id, List<ChiTietThuocTinhRequest> reqs, IConfiguration config) =>
{
    using var conn = new MySqlConnection(GetConnectionString(config));
    await conn.OpenAsync();
    using var trans = await conn.BeginTransactionAsync();
    try {
        using var delCmd = new MySqlCommand("DELETE FROM chitietthuoctinh WHERE MaLinhKien = @Id", conn, trans);
        delCmd.Parameters.AddWithValue("@Id", id);
        await delCmd.ExecuteNonQueryAsync();

        foreach(var req in reqs) {
            using var insCmd = new MySqlCommand("INSERT INTO chitietthuoctinh (MaLinhKien, MaThuocTinh, GiaTri) VALUES (@Id, @MaThuocTinh, @GiaTri)", conn, trans);
            insCmd.Parameters.AddWithValue("@Id", id);
            insCmd.Parameters.AddWithValue("@MaThuocTinh", req.maThuocTinh);
            insCmd.Parameters.AddWithValue("@GiaTri", req.giaTri);
            await insCmd.ExecuteNonQueryAsync();
        }
        await trans.CommitAsync();
        return Results.Ok(new { message = "Cập nhật thành công!" });
    } catch {
        await trans.RollbackAsync();
        return Results.StatusCode(500);
    }
});

app.Lifetime.ApplicationStarted.Register(() =>
{
    try
    {
        var filePath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "index.html");
        if (System.IO.File.Exists(filePath))
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = filePath,
                UseShellExecute = true
            });
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Could not automatically open browser: " + ex.Message);
    }
});

app.Run("http://localhost:5000");
public record LoaiLinhKien(int id, string tenLoai);
public record LinhKienResponse(int id, string name, decimal price, string img, int categoryId, string categoryName, int discount, int stock);
public record LinhKienRequest(string name, decimal price, string img, int categoryId, int discount, int stock);

public record OrderRequest(int customerId, string customerName, string address, decimal total, List<OrderDetail> details);
public record OrderDetail(int productId, string productName, int quantity, decimal unitPrice);

public record OrderResponse(int id, string customerName, string address, decimal total, string status, DateTime orderDate);
public record OrderDetailResponse(int productId, string productName, int quantity, decimal unitPrice);
public record UpdateOrderStatusRequest(string status);
public record TopItemResponse(string name, int totalSold, decimal totalRevenue);
public record ChiTietDonHangResponse(string productName, int quantity, decimal unitPrice);
public record DonHangResponse(int id, string customerName, DateTime date, decimal total, string status, string address);

public record RegisterRequest(string username, string password, string fullName, string email, string phone);
public record LoginRequest(string username, string password);
public record UpdateUserRequest(string fullName, string email, string phone, string address);
public record ResetPasswordRequest(string email, string newPassword);
public record ThuocTinhResponse(int id, int categoryId, string categoryName, string name, string unit);
public record ThuocTinhRequest(int categoryId, string name, string? unit);
public record ChiTietThuocTinhResponse(int maThuocTinh, string tenThuocTinh, string giaTri, string unit);
public record ChiTietThuocTinhRequest(int maThuocTinh, string giaTri);

