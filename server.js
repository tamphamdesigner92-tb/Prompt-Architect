// Server tĩnh (thay cho http-server) + API lưu trữ Lịch sử / Thư viện prompt (kèm ảnh) / Thùng rác.
// Chỉ 1 dependency: express. Dữ liệu lưu dạng file JSON phẳng trong ./data (tạo tự động khi chạy).

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8931;

// Giữ tham chiếu tới HTTP server để route /api/shutdown đóng được nó một cách chủ động
let server = null;

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const LIBRARY_FILE = path.join(DATA_DIR, "library.json");

const HISTORY_LIMIT = 50;
const TRASH_RETENTION_DAYS = 30;
const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

fs.mkdirSync(IMAGES_DIR, { recursive: true });

// --- ĐỌC / GHI FILE JSON AN TOÀN ---
function readJSON(file, fallback) {
    try {
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (_) {
        return fallback; // Chưa tồn tại hoặc file hỏng -> dùng giá trị mặc định
    }
}

// Ghi qua file tạm rồi rename (atomic trên cùng ổ đĩa) để tránh hỏng file nếu tiến trình bị ngắt giữa chừng
function writeJSONAtomic(file, data) {
    const tmpFile = path.join(
        path.dirname(file),
        `.tmp-${path.basename(file)}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpFile, file);
}

function makeId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function imagePath(id) {
    return path.join(IMAGES_DIR, `${id}.jpg`);
}

function decodeAndSaveImage(id, dataUrl) {
    const match = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(dataUrl || "");
    if (!match) return false;
    fs.writeFileSync(imagePath(id), Buffer.from(match[1], "base64"));
    return true;
}

// --- DỌN THÙNG RÁC QUÁ HẠN 30 NGÀY ---
function purgeExpiredTrash() {
    const library = readJSON(LIBRARY_FILE, []);
    const now = Date.now();
    let changed = false;

    const kept = library.filter(entry => {
        const expired = entry.status === "trashed" && entry.deletedAt && (now - entry.deletedAt) > TRASH_RETENTION_MS;
        if (expired) {
            if (entry.hasImage) {
                try { fs.unlinkSync(imagePath(entry.id)); } catch (_) { /* ảnh có thể đã không còn */ }
            }
            changed = true;
        }
        return !expired;
    });

    if (changed) writeJSONAtomic(LIBRARY_FILE, kept);
}

purgeExpiredTrash();
setInterval(purgeExpiredTrash, 24 * 60 * 60 * 1000);

// --- MIDDLEWARE ---
app.use(express.json({ limit: "5mb" }));

// Chặn truy cập trực tiếp file dữ liệu thô qua HTTP (đăng ký trước static bên dưới)
app.use("/data", (req, res) => res.sendStatus(404));
app.use("/images", express.static(IMAGES_DIR));

// --- API LỊCH SỬ (tự động, cắt còn tối đa 50 mục) ---
app.get("/api/history", (req, res) => {
    res.json(readJSON(HISTORY_FILE, []));
});

app.post("/api/history", (req, res) => {
    const { idea, prompt, category } = req.body || {};
    if (!idea || !prompt || !category) {
        return res.status(400).json({ error: "Thiếu idea/prompt/category" });
    }
    const history = readJSON(HISTORY_FILE, []);
    const entry = { id: makeId(), idea, prompt, category, createdAt: Date.now() };
    history.unshift(entry);
    while (history.length > HISTORY_LIMIT) history.pop();
    writeJSONAtomic(HISTORY_FILE, history);
    res.json(entry);
});

// --- API THƯ VIỆN LƯU TRỮ (SAVED) ---
app.get("/api/saved", (req, res) => {
    const library = readJSON(LIBRARY_FILE, []);
    res.json(
        library.filter(e => e.status === "saved").sort((a, b) => b.createdAt - a.createdAt)
    );
});

app.post("/api/saved", (req, res) => {
    const { idea, prompt, category, image } = req.body || {};
    if (!prompt || !category) {
        return res.status(400).json({ error: "Thiếu prompt/category" });
    }
    const library = readJSON(LIBRARY_FILE, []);
    const id = makeId();
    let hasImage = false;
    if (image) {
        try { hasImage = decodeAndSaveImage(id, image); } catch (_) { hasImage = false; }
    }
    const entry = {
        id, idea: idea || "", prompt, category, hasImage,
        status: "saved", createdAt: Date.now(), deletedAt: null
    };
    library.push(entry);
    writeJSONAtomic(LIBRARY_FILE, library);
    res.json(entry);
});

app.put("/api/saved/:id/image", (req, res) => {
    const { image } = req.body || {};
    if (!image) return res.status(400).json({ error: "Thiếu dữ liệu ảnh" });

    const library = readJSON(LIBRARY_FILE, []);
    const entry = library.find(e => e.id === req.params.id);
    if (!entry) return res.status(404).json({ error: "Không tìm thấy prompt đã lưu" });

    let ok = false;
    try { ok = decodeAndSaveImage(entry.id, image); } catch (_) { ok = false; }
    if (!ok) return res.status(400).json({ error: "Dữ liệu ảnh không hợp lệ" });

    entry.hasImage = true;
    writeJSONAtomic(LIBRARY_FILE, library);
    res.json(entry);
});

app.delete("/api/saved/:id/image", (req, res) => {
    const library = readJSON(LIBRARY_FILE, []);
    const entry = library.find(e => e.id === req.params.id);
    if (!entry) return res.status(404).json({ error: "Không tìm thấy prompt đã lưu" });

    try { fs.unlinkSync(imagePath(entry.id)); } catch (_) { /* không có ảnh thì bỏ qua */ }
    entry.hasImage = false;
    writeJSONAtomic(LIBRARY_FILE, library);
    res.json(entry);
});

app.delete("/api/saved/:id", (req, res) => {
    const library = readJSON(LIBRARY_FILE, []);
    const entry = library.find(e => e.id === req.params.id && e.status === "saved");
    if (!entry) return res.status(404).json({ error: "Không tìm thấy prompt đã lưu" });

    entry.status = "trashed";
    entry.deletedAt = Date.now();
    writeJSONAtomic(LIBRARY_FILE, library);
    res.json(entry);
});

// --- API THÙNG RÁC (tự động dọn sau 30 ngày) ---
app.get("/api/trash", (req, res) => {
    purgeExpiredTrash();
    const library = readJSON(LIBRARY_FILE, []);
    const now = Date.now();
    const trashed = library
        .filter(e => e.status === "trashed")
        .map(e => ({
            ...e,
            daysLeft: Math.max(0, TRASH_RETENTION_DAYS - Math.floor((now - e.deletedAt) / (24 * 60 * 60 * 1000)))
        }))
        .sort((a, b) => b.deletedAt - a.deletedAt);
    res.json(trashed);
});

app.post("/api/trash/:id/restore", (req, res) => {
    purgeExpiredTrash();
    const library = readJSON(LIBRARY_FILE, []);
    const entry = library.find(e => e.id === req.params.id && e.status === "trashed");
    if (!entry) return res.status(404).json({ error: "Mục này không còn trong thùng rác (có thể đã bị dọn tự động)" });

    entry.status = "saved";
    entry.deletedAt = null;
    writeJSONAtomic(LIBRARY_FILE, library);
    res.json(entry);
});

app.delete("/api/trash/:id", (req, res) => {
    purgeExpiredTrash();
    const library = readJSON(LIBRARY_FILE, []);
    const index = library.findIndex(e => e.id === req.params.id && e.status === "trashed");
    if (index === -1) return res.status(404).json({ error: "Mục này không còn trong thùng rác" });

    const [entry] = library.splice(index, 1);
    if (entry.hasImage) {
        try { fs.unlinkSync(imagePath(entry.id)); } catch (_) { /* đã không còn thì bỏ qua */ }
    }
    writeJSONAtomic(LIBRARY_FILE, library);
    res.json({ success: true });
});

// --- KIỂM TRA SERVER CÒN SỐNG (nút Tắt ứng dụng dùng để xác nhận đã tắt thật) ---
app.get("/api/ping", (req, res) => res.json({ ok: true }));

// --- TẮT ỨNG DỤNG TỪ TRONG GIAO DIỆN ---
// Trên Windows, start-app.bat khởi động server ở một cửa sổ cmd thu nhỏ rồi tự đóng cửa
// sổ launcher, nên người dùng không còn chỗ nào bấm Ctrl+C: server chạy ngầm và giữ cổng
// 8931 mãi. Route này cho nút "Tắt ứng dụng" dừng tiến trình chủ động, trả lại cổng.
// Chỉ nhận yêu cầu từ chính máy đang chạy (localhost) để máy khác trong LAN không tắt được.
app.post("/api/shutdown", (req, res) => {
    const LOCAL_ADDRESSES = ["127.0.0.1", "::1", "::ffff:127.0.0.1"];
    if (!LOCAL_ADDRESSES.includes(req.socket.remoteAddress)) {
        return res.status(403).json({ error: "Chỉ tắt được ứng dụng từ chính máy đang chạy" });
    }

    res.json({ success: true });

    // Đợi response ra khỏi socket rồi mới đóng, để trình duyệt kịp nhận xác nhận
    res.on("finish", () => {
        console.log(`Nhận yêu cầu tắt từ giao diện. Đang dừng server, trả lại cổng ${PORT}...`);
        if (server) {
            // Kết nối keep-alive có thể giữ server.close() treo mãi -> đóng thẳng chúng
            if (typeof server.closeAllConnections === "function") server.closeAllConnections();
            server.close(() => process.exit(0));
        }
        // Chốt an toàn: còn kết nối nào chưa nhả thì vẫn thoát
        setTimeout(() => process.exit(0), 1500).unref();
    });
});

// --- PHỤC VỤ FILE TĨNH (index.html / app.js / style.css) ---
app.use(express.static(ROOT_DIR));

server = app.listen(PORT, () => {
    console.log(`Prompt Architect đang chạy tại http://localhost:${PORT}`);
    console.log("Tắt ứng dụng: bấm nút nguồn ở góc phải giao diện, hoặc Ctrl+C tại cửa sổ này.");
});
