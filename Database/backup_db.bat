@echo off
set "BACKUP_DIR=d:\Thuc_tap_HTTT\Tuan_3\cv3\backups"
set "DB_NAME=QuanLyLinhKienPC"
set "DB_USER=root"
set "DB_PASS=123456"
set "DB_PORT=3307"

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "delims=" %%I in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy_MM_dd_HHmm'"') do set datetime=%%I

set "FILE_NAME=%BACKUP_DIR%\%DB_NAME%_%datetime%.sql"

echo Dang sao luu co so du lieu %DB_NAME% vao %FILE_NAME%...
mysqldump -u%DB_USER% -p%DB_PASS% -h 127.0.0.1 -P %DB_PORT% %DB_NAME% > "%FILE_NAME%"

if %ERRORLEVEL% equ 0 (
    echo Sao luu thanh cong!
) else (
    echo Co loi xay ra trong qua trinh sao luu.
)
pause
