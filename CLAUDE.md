# Prompt Architect — Kiến Trúc Ứng Dụng

> File này mô tả kiến trúc và quy ước của dự án, được Claude Code tự động nạp mỗi phiên làm việc.

## Tổng quan

**Prompt Architect** là ứng dụng web giúp người dùng soạn prompt AI chuyên nghiệp theo cấu trúc chuẩn cho từng nhóm công việc, xuất kết quả dạng Markdown. Giao diện tiếng Việt, thiết kế theo ngôn ngữ Apple (glassmorphism, segmented control, SF font stack).

**Stack:** Frontend là HTML + CSS thuần + JavaScript gốc (Vanilla JS) — **không framework, không build step**. Backend là một server **Node/Express tối giản** (`server.js`, dependency duy nhất là `express`) chỉ để phục vụ file tĩnh và cung cấp API lưu trữ dữ liệu (lịch sử prompt, thư viện lưu trữ + ảnh, thùng rác) thành file thật trong thư mục `data/` — điều mà JS thuần trong trình duyệt không tự làm được. Không thêm framework/thư viện phía frontend.

**Cách chạy:** lần đầu cần `npm install` (tự động nếu chạy qua `start-app.bat`/`start-app.sh`), sau đó dùng `start-app.bat` (hoặc `npm start`) để khởi động server tại cổng 8931 rồi mở trình duyệt. **KHÔNG mở `index.html` trực tiếp bằng file://** — Ollama chặn origin `null` (403 Forbidden) nên tính năng AI gợi ý sẽ không hoạt động; app có guard phát hiện `file:` và báo người dùng dùng start-app.bat.

## Cấu trúc file

| File | Vai trò |
|------|---------|
| `index.html` | Toàn bộ markup: màn hình chào mừng + màn hình làm việc chính + modal Lịch sử/Thư viện lưu trữ |
| `app.js` | Toàn bộ logic frontend: dữ liệu cấu trúc prompt, state, sự kiện, gọi Ollama/Gemini, gọi API lịch sử/lưu trữ |
| `style.css` | Toàn bộ style: theme theo giờ, glassmorphism, responsive |
| `server.js` | Backend Express: phục vụ file tĩnh + API `/api/history`, `/api/saved`, `/api/trash`, đọc/ghi `data/` |
| `package.json` | Khai báo dependency duy nhất: `express` |
| `data/` (gitignored, tự tạo lúc chạy) | `history.json`, `library.json` (prompt đã lưu + đã xoá), `images/<id>.jpg` |
| `start-app.bat` | Khởi động chuẩn (Windows): `npm install` (nếu cần) + `npm start` + mở trình duyệt |
| `start-app.sh` | Tương tự cho Git Bash/macOS/Linux (Ctrl+C để tắt server) |
| `.claude/launch.json` | Cấu hình preview: `npm start` cổng 8931 |

## Luồng hoạt động chính

1. **Màn hình chào mừng** (`#welcome-screen`): lần đầu hỏi tên người dùng, lưu vào `localStorage` (khóa `prompt_user_name`). Các lần sau chào theo tên rồi tự chuyển sang màn hình chính sau 2.2 giây.
2. **Màn hình chính** (`#main-screen`): header chứa menu 5 nhóm công việc (segmented control). Workspace chia 2 cột:
   - **Cột trái** (`.input-panel`): ô nhập ý tưởng ban đầu (`.idea-box`) + form các trường được sinh động từ `PROMPT_STRUCTURES`.
   - **Cột phải** (`.output-panel`): kết quả Markdown cập nhật real-time khi gõ, kèm nút Sao chép.
3. **Gợi ý bằng AI**: người dùng nhập ý tưởng → bấm "✨ Gợi ý bằng AI" (hoặc Ctrl+Enter) → gửi ý tưởng + ngữ cảnh nhóm công việc đến Ollama → nhận JSON → tự điền vào các trường (người dùng sửa lại được).

## Kiến trúc app.js

Tất cả nằm trong 2 khối chính:

### `PROMPT_STRUCTURES` (hằng số đầu file)
Database tĩnh định nghĩa 5 nhóm công việc. Mỗi nhóm có `title` và mảng `fields`; mỗi field gồm `{ id, label, desc, ex }`.

| Khóa | Nhóm công việc |
|------|----------------|
| `vibe` | Vibe Coding - Thiết Kế Ứng Dụng Nhanh |
| `problem` | Giải Quyết Lỗi & Tối Ưu Hệ Thống |
| `content` | Sáng Tạo Nội Dung & Copywriting |
| `media` | Sáng Tạo Ảnh & Video (Gen-AI) |
| `analysis` | Phân Tích Dữ Liệu & Trích Xuất Insight |

**Thêm nhóm mới:** thêm 1 entry vào `PROMPT_STRUCTURES` + 1 nút `.menu-item` với `data-category` tương ứng trong `index.html`. Không cần sửa gì khác — form, output và AI gợi ý đều đọc động từ cấu trúc này.

### `AppState` (object singleton)
Quản lý toàn bộ state và hành vi. Các method chính:

- `init()` — khởi chạy khi `DOMContentLoaded`
- `getDateTimeData()` / `updateThemeByTime()` — chọn lời chào + theme (`morning`/`afternoon`/`evening`) theo giờ hệ thống, gán vào `data-theme` trên `<html>`
- `handleScreens()` — điều hướng welcome ↔ main
- `setupEventListeners()` — gắn toàn bộ event (lưu tên, đổi tab, copy, submit ý tưởng)
- `renderFormFields()` — sinh động các textarea từ `PROMPT_STRUCTURES[currentCategory]`, id dạng `field-<field.id>`
- `requestAISuggestions()` — gọi Ollama (chi tiết bên dưới)
- `generateMarkdownPrompt()` — gom giá trị các textarea thành Markdown (`# LABEL\n- value`), cập nhật real-time, **trả về** chuỗi markdown (dùng để ghi lịch sử/lưu trữ)
- `showToast(message, type)` — thông báo góc phải trên (`success`/`error`)
- `commitHistoryEntry()` / `openHistory()` / `useHistoryEntry()` — Lịch sử prompt (chi tiết bên dưới)
- `savePromptToLibrary()` / `openSaved()` / `compressImageFile()` — Thư viện lưu trữ + ảnh + thùng rác (chi tiết bên dưới)

## Tích hợp AI (2 nhà cung cấp)

- **Config:** hằng số `AI_CONFIG` đầu `app.js`, gồm `gemini` (mặc định) và `ollama`. Cài đặt người dùng lưu ở localStorage khóa `prompt_ai_settings`: `{ provider, geminiKeys[], activeKeyIndex, promptCount }` — quản lý qua `loadSettings()`/`saveSettings()`.
- **Prompt gửi AI:** build tại `buildSuggestionPrompt()` — dùng chung cho cả 2 provider, yêu cầu vai trò chuyên gia Prompt Engineering, mỗi trường 3-6 câu chi tiết có số liệu/thuật ngữ, cấm từ chung chung, trả về JSON object có khóa đúng bằng các `field.id` của nhóm hiện tại.
- **Điều phối:** `requestAISuggestions()` → `callGemini()` hoặc `callOllama()` → `parseJSONSafely()` → `applySuggestions()` (điền textarea kèm hiệu ứng `.ai-suggested` 1.6s + `generateMarkdownPrompt()`).
- **Chống race:** lưu `requestedCategory` trước khi gọi; nếu người dùng đổi tab trong lúc chờ thì bỏ qua kết quả. Cờ `isSuggesting` chặn double-submit, nút chuyển sang spinner khi đang chờ.

### Gemini API (mặc định)
- Model `gemini-2.5-flash`, endpoint `generativelanguage.googleapis.com/v1beta/.../generateContent?key=...`, dùng `responseMimeType: "application/json"`.
- **Luân phiên nhiều API key** (`callGemini()`): người dùng thêm key trong modal Cài đặt (nút ⚙️ trên header). Sau mỗi **10 lượt thành công** tự chuyển key kế tiếp (`rotateAfter` trong `AI_CONFIG.gemini`); khi key lỗi/không phản hồi thì tự thử lần lượt các key còn lại trong cùng request. Chưa có key → mở modal Cài đặt và báo lỗi.
- Modal Cài đặt: `#settings-modal` trong `index.html`, render danh sách key (che ký tự) qua `renderKeyList()`.

### Ollama (lựa chọn phụ)
- Endpoint `http://localhost:11434/api/generate`, model **`gemma4:e4b`** (lưu ý: đúng là `e4b`, không phải `eb4`). POST `{ model, prompt, format: "json", stream: false }`.
- **Hiệu năng:** model 8B, phản hồi thường mất **30-60 giây** — đây là bình thường, không phải lỗi.
- **CORS:** Ollama chặn origin `null` — bắt buộc chạy qua http-server (`start-app.bat`); app có guard báo lỗi nếu mở bằng `file://`.

## Backend: server.js

Server Express tối giản, không có view engine/framework nào khác:

- `express.static(__dirname)` phục vụ `index.html`/`app.js`/`style.css` (thay cho `http-server` trước đây).
- Middleware chặn `/data/*` (trả 404) đăng ký **trước** static, để không lộ `history.json`/`library.json` thô qua HTTP. `/images` mount riêng vào `data/images/` để hiển thị ảnh đã lưu.
- Dữ liệu lưu dạng file JSON phẳng, đọc/ghi đồng bộ (`fs.readFileSync`/`writeFileSync`) — an toàn vì Node đơn luồng và handler không có `await` xen giữa read-modify-write. Ghi luôn qua file tạm rồi `fs.renameSync` (atomic) để tránh hỏng file nếu tiến trình bị ngắt giữa chừng.
- `data/history.json`: mảng `{id, idea, prompt, category, createdAt}`, tự cắt còn tối đa **50 mục** (FIFO) mỗi khi `POST /api/history`.
- `data/library.json`: mảng `{id, idea, prompt, category, hasImage, status: "saved"|"trashed", createdAt, deletedAt}` — prompt đã lưu và đã xoá dùng chung 1 file, chỉ khác `status` (đổi trạng thái là 1 lần ghi atomic, tránh cửa sổ lỗi khi tách/ghép 2 file riêng).
- `data/images/<id>.jpg`: 1 ảnh/entry, tên file = id của entry (không đổi khi chuyển saved ↔ trashed). Ảnh chỉ thật sự xoá khi xoá vĩnh viễn hoặc bị `purgeExpiredTrash()` dọn.
- `purgeExpiredTrash()`: xoá các entry `status="trashed"` quá **30 ngày** kể từ `deletedAt` (kèm file ảnh). Chạy lúc server khởi động, mỗi 24h (`setInterval`), và đầu mỗi handler `/api/trash*` (purge-then-act).
- Route đầy đủ: `GET/POST /api/history`, `GET/POST /api/saved`, `PUT/DELETE /api/saved/:id/image`, `DELETE /api/saved/:id` (chuyển vào thùng rác), `GET /api/trash`, `POST /api/trash/:id/restore`, `DELETE /api/trash/:id` (xoá vĩnh viễn).

## Lịch sử prompt & Thư viện lưu trữ (app.js)

- **Lịch sử**: tự động ghi qua `commitHistoryEntry(idea, prompt, category)`, gọi tại 2 "điểm chốt": sau khi `applySuggestions()` áp dụng gợi ý AI thành công, và khi bấm nút Sao chép — **không** ghi mỗi lần gõ phím (sẽ lấp đầy 50 slot bằng bản nháp). So sánh với `lastHistoryPrompt` để tránh ghi trùng lặp liên tiếp. Modal `#history-modal`, nút "Dùng lại ý tưởng này" chỉ khôi phục lại ô ý tưởng + chuyển đúng nhóm công việc + hiển thị lại markdown đã lưu — không khôi phục từng field con (đơn giản hoá, người dùng bấm lại "✨ Gợi ý bằng AI" nếu cần).
- **Thư viện lưu trữ**: nút "💾 Lưu" ở `.output-header` gọi `savePromptToLibrary()` → `POST /api/saved` → tự mở modal `#saved-modal` (tab "Đã lưu"). Mỗi card có ô ảnh vuông cố định (`.saved-thumb`, 104×104px) — ảnh con dùng `max-width/max-height:100%; width/height:auto` (không phải `object-fit:cover`) để chỉ scale-down theo chiều giới hạn, **không bóp méo, không crop vuông**.
- **Nén ảnh phía client** (`compressImageFile()`): đọc file qua `createImageBitmap(file, {imageOrientation: "from-image"})` (tự sửa xoay theo EXIF, không cần parse EXIF thủ công) → resize giữ nguyên tỉ lệ gốc, giới hạn cạnh dài nhất ~800px → xuất `canvas.toDataURL("image/jpeg", 0.72)` → luôn ra `.jpg` dù ảnh gốc định dạng gì, gửi lên `PUT /api/saved/:id/image`.
- **Thùng rác**: tab thứ 2 trong `#saved-modal`, hiển thị số ngày còn lại trước khi tự xoá (`daysLeft` do server tính). Nút "Khôi phục" / "Xoá vĩnh viễn" (có `confirm()` xác nhận).

## Kiến trúc style.css

- **CSS variables trong `:root`** + 3 theme override theo `html[data-theme="..."]` (morning/afternoon/evening). Theme evening là dark mode — khi thêm component mới cần kiểm tra cả evening.
- **Ngôn ngữ thiết kế Apple:**
  - Glassmorphism: `backdrop-filter: saturate(180%) blur(20px)` trên `.glass-card` / `.glass-header`
  - Menu nhóm công việc: segmented control kiểu iOS (nền `rgba(120,120,128,0.16)`, item active nền trắng nổi)
  - Nút: active `scale(0.97)`, hover `brightness(1.08)`
  - Typography: font stack `-apple-system`, letter-spacing âm cho tiêu đề (`-0.022em`)
  - Border-radius lớn (12-20px), bóng đổ mềm
- **Responsive:** dưới 1100px chuyển workspace 2 cột → 1 cột, menu cuộn ngang (media query ở cuối file — phải giữ ở cuối để không bị cascade ghi đè).

## Quy ước khi sửa code

- Giữ nguyên stack Vanilla JS ở **frontend** — không thêm framework/thư viện ngoài. Backend chỉ có Express, tránh thêm dependency mới nếu không thật cần thiết (không cần lib xử lý ảnh phía server — nén ảnh đã xử lý xong ở client bằng Canvas API).
- Comment và text giao diện viết bằng **tiếng Việt**.
- Mọi tính năng mới nên đọc động từ `PROMPT_STRUCTURES` thay vì hardcode theo nhóm.
- Khi thêm UI mới: dùng CSS variables sẵn có, kiểm tra trên cả theme sáng và theme evening (dark).
- Khi sửa route trong `server.js`: luôn ghi file qua `writeJSONAtomic()` (không gọi `fs.writeFileSync` trực tiếp lên `history.json`/`library.json`) để giữ tính atomic.
- Test nhanh: `preview_start` với config `prompt-architect` (cổng 8931, chạy `npm start`). Nếu chưa có `node_modules`, chạy `npm install` trước.
