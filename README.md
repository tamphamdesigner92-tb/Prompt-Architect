# Prompt Architect

Ứng dụng web giúp soạn prompt AI chuyên nghiệp theo cấu trúc chuẩn cho từng nhóm công việc, xuất kết quả dạng Markdown.

## Cài đặt & chạy

Yêu cầu duy nhất: **Node.js 18 trở lên**. Nếu máy chưa có, script khởi động sẽ tự cài giúp bạn.

### Windows

Bấm đúp vào **`start-app.bat`**.

Lần đầu chạy script sẽ tự động:
1. Cài Node.js bằng `winget` nếu máy chưa có (máy không có `winget` thì script sẽ hiện link tải).
2. Cài thư viện đúng phiên bản khoá trong `package-lock.json`.
3. Tạo thư mục dữ liệu `data/` và kiểm tra cổng 8931.
4. Khởi động server rồi mở trình duyệt.

> Nếu vừa mới cài Node.js xong, hãy đóng cửa sổ và chạy lại `start-app.bat` — Windows cần cửa sổ mới để nhận PATH.

### macOS / Linux

```bash
./start-app.sh
```

Nếu báo `Permission denied` (thường xảy ra khi tải về dạng .zip thay vì `git clone`):

```bash
chmod +x start-app.sh
```

Trên macOS, nếu chưa có Node.js thì script sẽ tự cài bằng Homebrew. Máy chưa có Homebrew, script sẽ in sẵn lệnh cài để bạn dán vào Terminal.

Tắt ứng dụng: nhấn `Ctrl+C` trong cửa sổ Terminal.

### Các lệnh hữu ích

| Lệnh | Công dụng |
|------|-----------|
| `npm run setup` | Chạy lại phần cài đặt/kiểm tra môi trường mà không khởi động app |
| `node setup.js --check` | Chỉ chẩn đoán và in báo cáo môi trường, **không** cài gì |
| `npm start` | Khởi động server thủ công tại http://localhost:8931 |

## Lưu ý quan trọng

**Không mở `index.html` trực tiếp bằng `file://`.** Ollama chặn origin `null` (lỗi 403) nên tính năng gợi ý bằng AI sẽ không hoạt động. Luôn khởi động qua `start-app.bat` / `start-app.sh`.

## Khắc phục sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Không mở được http://localhost:8931 | Chạy `node setup.js --check`. Nếu báo cổng 8931 bị chiếm: `netstat -ano \| findstr :8931` (Windows) hoặc `lsof -i :8931` (macOS/Linux) |
| Lỗi khi cài thư viện | `npm cache clean --force`, xoá thư mục `node_modules`, rồi chạy lại script khởi động |
| macOS báo `$'\r': command not found` | File `start-app.sh` đã bị đổi sang CRLF. Chạy `sed -i '' 's/\r$//' start-app.sh` |
| Gợi ý AI không chạy | Kiểm tra API key Gemini trong nút ⚙️ Cài đặt, hoặc Ollama đang chạy tại `localhost:11434` |

Chi tiết kiến trúc và quy ước code: xem [CLAUDE.md](CLAUDE.md).
