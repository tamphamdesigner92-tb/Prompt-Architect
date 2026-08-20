# Prompt Architect — Kiến Trúc Ứng Dụng

> File này mô tả kiến trúc và quy ước của dự án, được Claude Code tự động nạp mỗi phiên làm việc.

## Tổng quan

**Prompt Architect** là ứng dụng web giúp người dùng soạn prompt AI chuyên nghiệp theo cấu trúc chuẩn cho từng nhóm công việc, xuất kết quả dạng Markdown. Giao diện tiếng Việt, thiết kế theo ngôn ngữ Apple (glassmorphism, segmented control, SF font stack).

**Stack:** Frontend là HTML + CSS thuần + JavaScript gốc (Vanilla JS) — **không framework, không build step**. Backend là một server **Node/Express tối giản** (`server.js`, dependency duy nhất là `express`) chỉ để phục vụ file tĩnh và cung cấp API lưu trữ dữ liệu (lịch sử prompt, thư viện lưu trữ + ảnh, thùng rác) thành file thật trong thư mục `data/` — điều mà JS thuần trong trình duyệt không tự làm được. Không thêm framework/thư viện phía frontend.

**Cách chạy:** chỉ cần chạy `start-app.bat` (Windows) hoặc `start-app.sh` (macOS/Linux/Git Bash) — script tự cài Node.js nếu thiếu, rồi gọi `setup.js` để cài thư viện, tạo thư mục `data/` và kiểm tra cổng, sau đó khởi động server tại cổng 8931 và mở trình duyệt. Yêu cầu tối thiểu **Node.js 18+**. Chạy lại riêng phần cài đặt: `npm run setup`; chỉ chẩn đoán mà không cài: `node setup.js --check`. **KHÔNG mở `index.html` trực tiếp bằng file://** — Ollama chặn origin `null` (403 Forbidden) nên tính năng AI gợi ý sẽ không hoạt động; app có guard phát hiện `file:` và báo người dùng dùng start-app.bat.

## Cấu trúc file

| File | Vai trò |
|------|---------|
| `index.html` | Toàn bộ markup: màn hình chào mừng + màn hình làm việc chính + modal Lịch sử/Thư viện lưu trữ |
| `app.js` | Toàn bộ logic frontend: dữ liệu cấu trúc prompt, state, sự kiện, gọi Ollama/Gemini, gọi API lịch sử/lưu trữ |
| `style.css` | Toàn bộ style: theme theo giờ, glassmorphism, responsive |
| `server.js` | Backend Express: phục vụ file tĩnh + API `/api/history`, `/api/saved`, `/api/trash`, đọc/ghi `data/` |
| `package.json` | Khai báo dependency duy nhất (`express`), ngưỡng `engines.node >= 18` và script `start`/`setup` |
| `setup.js` | Chuẩn bị môi trường: kiểm tra phiên bản Node, cài thư viện (`npm ci`, lùi về `npm install` nếu lock lệch), tạo `data/images/`, kiểm tra cổng 8931, in báo cáo. Gọi bởi cả hai file `start-app.*` |
| `data/` (gitignored, tự tạo lúc chạy) | `history.json`, `library.json` (prompt đã lưu + đã xoá), `images/<id>.jpg` |
| `start-app.bat` | Khởi động chuẩn (Windows): tự cài Node.js qua `winget` nếu thiếu + `node setup.js` + `npm start` + mở trình duyệt |
| `start-app.sh` | Tương tự cho macOS/Linux/Git Bash: tự cài Node.js qua Homebrew (macOS) nếu thiếu (Ctrl+C để tắt server). **Bắt buộc lưu bằng LF** — CRLF sẽ làm script chết trên macOS |
| `.gitattributes` | Khoá ký tự xuống dòng: `*.sh` = LF, `*.bat` = CRLF |
| `.claude/launch.json` | Cấu hình preview: `npm start` cổng 8931 |

## Luồng hoạt động chính

1. **Màn hình chào mừng** (`#welcome-screen`): lần đầu hỏi tên người dùng, lưu vào `localStorage` (khóa `prompt_user_name`). Các lần sau chào theo tên rồi tự chuyển sang màn hình chính sau 2.2 giây.
2. **Màn hình chính** (`#main-screen`): header chứa menu 6 nhóm công việc (segmented control). Workspace chia 2 cột:
   - **Cột trái** (`.input-panel`): ô nhập ý tưởng ban đầu (`.idea-box`) + form các trường được sinh động từ `PROMPT_STRUCTURES`.
   - **Cột phải** (`.output-panel`): kết quả Markdown cập nhật real-time khi gõ, kèm nút Sao chép.
3. **Gợi ý bằng AI**: người dùng nhập ý tưởng → bấm "✨ Gợi ý bằng AI" (hoặc Ctrl+Enter) → gửi ý tưởng + ngữ cảnh nhóm công việc đến Ollama → nhận JSON → tự điền vào các trường (người dùng sửa lại được).

## Kiến trúc app.js

Tất cả nằm trong 2 khối chính:

### `PROMPT_STRUCTURES` (hằng số đầu file)
Database tĩnh định nghĩa 6 nhóm công việc. Mỗi nhóm có `title` và mảng `fields`; mỗi field gồm `{ id, label, desc, ex }`.

| Khóa | Nhóm công việc |
|------|----------------|
| `vibe` | Vibe Coding - Thiết Kế Ứng Dụng Nhanh |
| `problem` | Giải Quyết Lỗi & Tối Ưu Hệ Thống |
| `content` | Sáng Tạo Nội Dung & Copywriting |
| `media` | Sáng Tạo Ảnh & Video (Gen-AI) |
| `analysis` | Phân Tích Dữ Liệu & Trích Xuất Insight |
| `research` | Nghiên Cứu Chuyên Sâu Một Chủ Đề |

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
- **Prompt gửi AI:** build tại `buildSuggestionPrompt()` — dùng chung cho cả 2 provider, yêu cầu vai trò chuyên gia Prompt Engineering, mỗi trường 3-6 câu chi tiết có số liệu/thuật ngữ, cấm từ chung chung, trả về JSON object có khóa đúng bằng các `field.id` của nhóm hiện tại. Nhận `extras = { architecture, tech, hasImages }` để chèn khối "NGỮ CẢNH KỸ THUẬT BỔ SUNG" và chỉ dẫn phân tích ảnh khi có.
- **Điều phối:** `requestAISuggestions()` → `callGemini(prompt, images)` hoặc `callOllama(prompt, images)` → `parseJSONSafely()` → `applySuggestions()` (điền textarea kèm hiệu ứng `.ai-suggested` 1.6s + `generateMarkdownPrompt()`).
- **Chống race:** lưu `requestedCategory` trước khi gọi; nếu người dùng đổi tab trong lúc chờ thì bỏ qua kết quả. Cờ `isSuggesting` chặn double-submit; `setSuggestingState(loading, mode)` với `mode="suggest"|"optimize"` quyết định nút nào hiện spinner (khóa cả hai nút khi đang chờ).

### Ngữ cảnh nâng cao & Ảnh tham chiếu & Tối ưu prompt
- **Ngữ cảnh nâng cao** (`#advanced-context`, `<details>`): 2 trường `#context-architecture` (text/JSON/YAML) + `#context-tech` (từ khóa). **Chỉ hiện ở nhóm trong `CONTEXT_CATEGORIES = ["vibe","problem"]`**. Chỉ dùng làm ngữ cảnh cho AI (chèn vào prompt gửi đi), **KHÔNG** đưa vào Markdown kết quả.
- **Ảnh tham chiếu** (`#reference-panel`): **chỉ hiện ở nhóm `media`**, tối đa `MAX_REFERENCE_IMAGES = 3`. Kéo-thả/chọn file → `compressImageFile(file, 1024)` → lưu tạm trong `AppState.referenceImages` (mảng dataURL JPEG, **KHÔNG lưu server**, khác hẳn ảnh Thư viện). Gửi cho AI: Gemini nhận `inline_data` trong `contents.parts`; Ollama nhận mảng `images` base64. `parseDataUrl()` tách `{ mimeType, base64 }`. `updateContextPanels()` bật/tắt 2 panel theo nhóm và xoá dữ liệu tạm khi đổi tab.
- **Tối ưu / Sửa lỗi Prompt** (`#btn-optimize`): `optimizePrompt()` gom giá trị field hiện có → `buildOptimizePrompt()` (yêu cầu AI phê bình & VIẾT LẠI, giữ nguyên ý định) → cùng luồng `callGemini/callOllama` → `applySuggestions()`. Cùng cơ chế chống race + ảnh tham chiếu như trên.

### Gemini API (mặc định)
- Model `gemini-2.5-flash`, endpoint `generativelanguage.googleapis.com/v1beta/.../generateContent?key=...`, dùng `responseMimeType: "application/json"`.
- **Luân phiên nhiều API key** (`callGemini()`): người dùng thêm key trong modal Cài đặt (nút ⚙️ trên header). Sau mỗi **10 lượt thành công** tự chuyển key kế tiếp (`rotateAfter` trong `AI_CONFIG.gemini`); khi key lỗi/không phản hồi thì tự thử lần lượt các key còn lại trong cùng request. Chưa có key → mở modal Cài đặt và báo lỗi.
- Modal Cài đặt: `#settings-modal` trong `index.html`, render danh sách key (che ký tự) qua `renderKeyList()`.

### Ollama (lựa chọn phụ)
- Endpoint `http://localhost:11434/api/generate`, model **`gemma4:e4b`** (lưu ý: đúng là `e4b`, không phải `eb4`). POST `{ model, prompt, format: "json", stream: false }`; khi có ảnh tham chiếu thì thêm mảng `images` (base64, đã bỏ tiền tố `data:`).
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

### Hệ token (quan trọng nhất — đọc trước khi thêm component)

Toàn bộ màu và cỡ chữ đi qua token trong `:root`; theme `evening` chỉ khai báo lại **cùng bộ token đó**, **không** override từng component. Số lượng selector `html[data-theme="evening"] .xxx` hiện là **0** — nếu bạn phải thêm một cái, gần như chắc chắn là đang hardcode sai chỗ.

| Nhóm token | Giá trị | Dùng cho |
|---|---|---|
| `--fill-1` … `--fill-4` | `rgba(120,120,128, .20/.16/.12/.08)` — evening dùng `.36/.32/.24/.18` | Nền của mọi bề mặt phụ: card, input, panel, nút phụ. Màu xám trung tính nên **hoạt động trên cả nền sáng và tối** — đây là lý do không cần override evening |
| `--text-primary` / `--text-secondary` | `#1d1d1f` / `rgba(60,60,67,0.72)` | Thang label kiểu Apple. **Lưu ý:** alpha là 0.72 chứ không phải 0.60 của Apple — con số 0.60 chỉ đạt 3.3:1, dưới ngưỡng WCAG |
| `--glass-bg` / `--glass-border` | `rgba(255,255,255,0.72)` / `rgba(60,60,67,0.14)` | Material kiểu Apple. Đục hơn glassmorphism thường vì mục đích là **tách** nội dung |
| `--knob-bg` / `--knob-shadow` | `#ffffff` / bóng mềm | Núm trắng nổi của segmented control |
| `--focus-glow` / `--accent-tint` / `--scrim` | dẫn xuất từ accent | Vầng focus, nền hover accent, lớp phủ modal |
| `--text-title-1/2/3`, `--text-body`, `--text-subhead`, `--text-footnote`, `--text-caption` | 7 bậc | Thang chữ. **Không viết `font-size` bằng số tho** — file hiện không còn giá trị rem nào rời rạc |

Nền 3 theme cố tình **bão hoà thấp**: nguyên tắc Apple là nền gần trung tính, dồn toàn bộ sức màu vào một accent. Đừng nâng saturation lên — nó sẽ kéo tương phản chữ xuống dưới ngưỡng đọc được.

### Khả năng truy cập (đã đạt, đừng làm hỏng)

- **Tương phản:** 12/12 cặp màu trên cả 4 theme đạt WCAG AA (4.5:1). Đổi màu thì phải tính lại.
- **Focus ring:** một khối `:focus-visible` dùng chung cuối file phủ mọi control. Thêm control mới thì thêm selector vào khối đó, **không** đặt `outline: none` rời rạc.
- **`prefers-reduced-motion`:** khối cuối file, phải **giữ ở cuối** để thắng cascade.
- **Icon:** SVG sprite `<symbol id="i-*">` đầu `<body>`, gọi bằng `<use href="#i-tên">` với class `.ico`. **Không dùng emoji làm icon** — emoji không nhận `currentColor` nên không đổi theo theme, và mỗi hệ điều hành vẽ một kiểu. Ngoại lệ có chủ ý: `✨` và `🪄` trên 2 nút AI, giữ vì mang sắc thái cảm xúc chứ không phải icon điều hướng.
- **Modal:** cả 3 modal có `role="dialog"` + `aria-modal` + `aria-labelledby`. Hành vi bàn phím dùng chung qua `AppState.openModal()` / `closeModal()` / `setupModalKeyboard()` — Esc để đóng, Tab quay vòng bên trong (focus trap), trả tiêu điểm về nút đã mở. Modal mới phải đi qua 2 hàm này.
- **Vùng bấm:** `.btn-icon` giữ vòng tròn 34px nhưng mở vùng bấm ra 44×44px bằng `::before` (kỹ thuật Apple HIG khuyến nghị). Ngưỡng tối thiểu của web là 24×24 CSS px (WCAG 2.2 AA).

### Ngôn ngữ thiết kế Apple

- Glassmorphism: `backdrop-filter: saturate(180%) blur(20px)` trên `.glass-card` / `.glass-header`
- Menu nhóm công việc: segmented control kiểu iOS (nền `var(--fill-2)`, núm active `var(--knob-bg)`)
- Nút: active `scale(0.97)`, nút icon `scale(0.92)` — nút nhỏ hơn thì lún sâu hơn
- Typography: font stack `-apple-system`, letter-spacing âm theo cấp tiêu đề, luôn dùng đơn vị `em` (không dùng `px`)
- Border-radius lớn (12-20px), bóng đổ mềm
- **Responsive:** dưới 1280px chuyển workspace 2 cột → 1 cột, menu cuộn ngang (media query gần cuối file — giữ nguyên vị trí để không bị cascade ghi đè).

## Quy ước khi sửa code

- Giữ nguyên stack Vanilla JS ở **frontend** — không thêm framework/thư viện ngoài. Backend chỉ có Express, tránh thêm dependency mới nếu không thật cần thiết (không cần lib xử lý ảnh phía server — nén ảnh đã xử lý xong ở client bằng Canvas API).
- Comment và text giao diện viết bằng **tiếng Việt**.
- Mọi tính năng mới nên đọc động từ `PROMPT_STRUCTURES` thay vì hardcode theo nhóm.
- Khi thêm UI mới: dùng token sẵn có (`--fill-*`, `--text-*`), **không hardcode `rgba()` hay `font-size` bằng số tho**. Nếu thấy mình cần viết `html[data-theme="evening"] .xxx` thì hãy dừng lại — token đã xử lý cả 2 theme.
- Control mới phải thêm vào khối `:focus-visible` dùng chung; icon mới thêm `<symbol>` vào sprite thay vì dùng emoji.
- Đổi màu thì tính lại tương phản WCAG (ngưỡng 4.5:1 cho text thường) trước khi commit — hiện cả 4 theme đều đạt.
- Khi sửa route trong `server.js`: luôn ghi file qua `writeJSONAtomic()` (không gọi `fs.writeFileSync` trực tiếp lên `history.json`/`library.json`) để giữ tính atomic.
- Test nhanh: `preview_start` với config `prompt-architect` (cổng 8931, chạy `npm start`). Nếu chưa có `node_modules`, chạy `npm install` trước.
