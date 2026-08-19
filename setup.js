#!/usr/bin/env node
/* ============================================================
 *  setup.js - Chuẩn bị môi trường cho Prompt Architect
 *
 *  Chạy được trên Windows / macOS / Linux, chỉ dùng thư viện lõi
 *  của Node (không cần node_modules để tự chạy được).
 *  Được gọi tự động bởi start-app.bat và start-app.sh, hoặc gọi
 *  tay bằng: npm run setup
 *
 *  Cờ tuỳ chọn:
 *    --check   Chỉ chẩn đoán và in báo cáo, KHÔNG cài đặt gì
 * ============================================================ */

const fs = require("fs");
const os = require("os");
const net = require("net");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT_DIR = __dirname;
const NODE_MODULES_DIR = path.join(ROOT_DIR, "node_modules");
const STATE_FILE = path.join(NODE_MODULES_DIR, ".setup-state.json");
const DATA_DIR = path.join(ROOT_DIR, "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");
const PKG_FILE = path.join(ROOT_DIR, "package.json");
const LOCK_FILE = path.join(ROOT_DIR, "package-lock.json");

const MIN_NODE_MAJOR = 18;
const PORT = 8931;
const CHECK_ONLY = process.argv.includes("--check");

// --- Tiện ích in ra màn hình (giữ đơn giản, không màu mè để mọi terminal đều đọc được) ---
const log = msg => console.log(msg);
const step = msg => console.log(`  ${msg}`);
const warn = msg => console.log(`  ⚠️  ${msg}`);

// In lỗi kèm hướng dẫn khắc phục rồi thoát với mã lỗi 1
function fail(title, hints = []) {
    console.log("");
    console.log(`❌ ${title}`);
    hints.forEach(h => console.log(`   ${h}`));
    console.log("");
    process.exit(1);
}

// --- BƯỚC 1: Phiên bản Node phải đủ mới ---
function checkNodeVersion() {
    const major = parseInt(process.versions.node.split(".")[0], 10);
    if (major < MIN_NODE_MAJOR) {
        fail(`Node.js quá cũ: đang dùng v${process.versions.node}, cần tối thiểu v${MIN_NODE_MAJOR}.`, [
            "Tải bản LTS mới nhất tại: https://nodejs.org",
            "Trên macOS có thể chạy: brew upgrade node"
        ]);
    }
    step(`Node.js v${process.versions.node} (yêu cầu >= v${MIN_NODE_MAJOR}) — đạt.`);
}

// --- BƯỚC 2: "Vân tay" môi trường ---
// Gộp nội dung package.json + package-lock.json + phiên bản Node thành 1 chuỗi băm.
// Chỉ cần một trong ba thứ đó đổi là phải cài lại dependencies.
function computeFingerprint() {
    const hash = crypto.createHash("sha256");
    hash.update(process.version);
    [PKG_FILE, LOCK_FILE].forEach(file => {
        hash.update(fs.existsSync(file) ? fs.readFileSync(file) : Buffer.from("missing"));
    });
    return hash.digest("hex");
}

// Kiểm tra express có thật sự nạp được không (bắt trường hợp node_modules cài dở/bị xoá bớt)
function expressVersion() {
    try {
        const pkgPath = require.resolve("express/package.json", { paths: [ROOT_DIR] });
        return JSON.parse(fs.readFileSync(pkgPath, "utf8")).version;
    } catch (err) {
        return null;
    }
}

// --- BƯỚC 3+4: Cài dependencies khi cần ---
// Trên Windows npm thực chất là npm.cmd -> bắt buộc shell: true
// (Node 20+ từ chối spawn thẳng file .cmd nếu không qua shell).
// Truyền nguyên một chuỗi lệnh thay vì mảng tham số để Node không cảnh báo
// DEP0190; các lệnh ở đây đều là hằng số trong file này, không có dữ liệu ngoài.
const NPM_BIN = process.platform === "win32" ? "npm.cmd" : "npm";

function runNpm(subcommand) {
    const result = spawnSync(`${NPM_BIN} ${subcommand}`, { cwd: ROOT_DIR, stdio: "inherit", shell: true });
    return result.status === 0;
}

function ensureDependencies() {
    const fingerprint = computeFingerprint();

    // Đã cài đúng bộ này rồi thì bỏ qua, để các lần chạy sau khởi động tức thì
    if (fs.existsSync(STATE_FILE)) {
        try {
            const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
            if (state.fingerprint === fingerprint && expressVersion()) {
                step(`Thư viện đã sẵn sàng (express v${expressVersion()}) — bỏ qua bước cài đặt.`);
                return;
            }
        } catch (err) {
            // File trạng thái hỏng thì coi như chưa cài, cài lại cho chắc
        }
    }

    if (CHECK_ONLY) {
        const installed = expressVersion();
        warn(installed
            ? `Thư viện có sẵn (express v${installed}) nhưng chưa khớp package-lock.json / phiên bản Node hiện tại.`
            : "Chưa cài thư viện (không nạp được express).");
        warn("Đang ở chế độ --check nên không cài gì. Chạy 'npm run setup' để cài.");
        return;
    }

    // npm ci cài ĐÚNG phiên bản khoá trong package-lock.json -> mọi máy giống hệt nhau
    let ok = false;
    if (fs.existsSync(LOCK_FILE)) {
        step("Đang cài thư viện theo package-lock.json (npm ci)...");
        ok = runNpm("ci");
        if (!ok) warn("npm ci thất bại (lock file lệch hoặc npm quá cũ). Thử lại bằng npm install...");
    } else {
        warn("Không thấy package-lock.json — dùng npm install.");
    }

    if (!ok) {
        step("Đang cài thư viện (npm install)...");
        ok = runNpm("install");
    }

    if (!ok) {
        fail("Không cài được thư viện.", [
            "Kiểm tra kết nối mạng rồi thử các lệnh sau trong thư mục dự án:",
            "   npm cache clean --force",
            process.platform === "win32"
                ? '   rmdir /s /q node_modules  (rồi chạy lại start-app.bat)'
                : "   rm -rf node_modules  (rồi chạy lại ./start-app.sh)"
        ]);
    }

    // --- BƯỚC 5: Kiểm chứng sau khi cài ---
    const version = expressVersion();
    if (!version) {
        fail("Cài xong nhưng vẫn không nạp được thư viện express.", [
            "Thư mục node_modules có thể bị hỏng. Hãy xoá node_modules rồi chạy lại."
        ]);
    }

    fs.writeFileSync(
        STATE_FILE,
        JSON.stringify({ fingerprint, node: process.version, express: version, at: new Date().toISOString() }, null, 2)
    );
    step(`Đã cài xong thư viện (express v${version}).`);
}

// --- BƯỚC 6: Thư mục dữ liệu ---
function ensureDataDirs() {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    step(`Thư mục dữ liệu sẵn sàng: ${DATA_DIR}`);
}

// --- BƯỚC 7: Cổng 8931 có đang bị chiếm không ---
// Chỉ là cảnh báo, không chặn: có thể chính server của app đang chạy sẵn.
function checkPort() {
    return new Promise(resolve => {
        const tester = net.createServer();
        tester.once("error", err => {
            if (err.code === "EADDRINUSE") {
                warn(`Cổng ${PORT} đang bị một tiến trình khác chiếm.`);
                console.log(`      Tra thủ phạm: ${process.platform === "win32"
                    ? `netstat -ano | findstr :${PORT}`
                    : `lsof -i :${PORT}`}`);
                console.log("      (Nếu đó chính là Prompt Architect đang chạy sẵn thì bỏ qua cảnh báo này.)");
                resolve(false);
            } else {
                warn(`Không kiểm tra được cổng ${PORT}: ${err.message}`);
                resolve(false);
            }
        });
        tester.once("listening", () => tester.close(() => {
            step(`Cổng ${PORT} còn trống.`);
            resolve(true);
        }));
        // exclusive: true -> đặt SO_EXCLUSIVEADDRUSE. Bắt buộc phải có, nếu không
        // Windows vẫn cho bind 127.0.0.1 dù server khác đang giữ 0.0.0.0 cùng cổng
        // và ta sẽ báo nhầm là "cổng còn trống".
        tester.listen({ port: PORT, exclusive: true });
    });
}

// --- BƯỚC 8: Báo cáo tổng kết ---
function report() {
    const npmVersion = spawnSync(`${NPM_BIN} -v`, { cwd: ROOT_DIR, shell: true, encoding: "utf8" });
    log("");
    log("  --- Thông tin môi trường ---");
    log(`  Hệ điều hành : ${os.type()} ${os.release()} (${process.arch})`);
    log(`  Node.js      : ${process.version}`);
    log(`  npm          : ${(npmVersion.stdout || "?").trim()}`);
    log(`  express      : ${expressVersion() || "chưa cài"}`);
    log(`  Thư mục dữ liệu: ${DATA_DIR}`);
}

async function main() {
    log("");
    log(CHECK_ONLY ? "🔍 Chẩn đoán môi trường Prompt Architect..." : "🔧 Chuẩn bị môi trường Prompt Architect...");
    log("");

    checkNodeVersion();
    ensureDependencies();
    ensureDataDirs();
    await checkPort();
    report();

    log("");
    log(CHECK_ONLY ? "✅ Chẩn đoán xong." : "✅ Môi trường đã sẵn sàng.");
    log("");
}

main().catch(err => {
    fail(`Lỗi ngoài dự kiến khi chuẩn bị môi trường: ${err.message}`, [
        "Hãy gửi lại toàn bộ thông báo phía trên để được hỗ trợ."
    ]);
});
