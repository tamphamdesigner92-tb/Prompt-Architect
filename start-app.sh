#!/usr/bin/env bash
# ============================================================
#  Khởi động Prompt Architect qua server local (cổng 8931)
#  Bắt buộc chạy qua http://localhost để Ollama chấp nhận CORS
#  (mở trực tiếp index.html bằng file:// sẽ bị Ollama chặn 403)
#  Server là Node/Express (server.js) - phục vụ file tĩnh +
#  API lưu lịch sử/prompt/thùng rác trong thư mục data/
#
#  Dùng được trên: Git Bash (Windows), macOS, Linux
# ============================================================
cd "$(dirname "$0")"

# Khi chạy bằng double-click (Finder) hoặc từ ứng dụng khác, PATH không có
# các thư mục cài Homebrew (node/npm/npx nằm ở đây) vì .zprofile/.bash_profile
# không được nạp -> "npx: command not found" một cách âm thầm. Bổ sung thủ công.
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH"

PORT=8931
URL="http://localhost:$PORT"
LOG="$(pwd)/start-app.log"

# Ghi toàn bộ output ra vừa màn hình vừa file log, để nếu cửa sổ Terminal tự
# đóng thì vẫn xem lại được chuyện gì đã xảy ra (mở lại file start-app.log).
exec > >(tee -a "$LOG") 2>&1

echo "===== $(date) ====="
echo "Đang khởi động Prompt Architect tại $URL ..."

# Nếu cửa sổ này tự đóng ngay khi có lỗi, người dùng vẫn kịp đọc thông báo.
finish() {
    status=$?
    if [ -n "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null
    fi
    echo ""
    echo "(Log đầy đủ được lưu tại: $LOG)"
    echo "Nhấn phím bất kỳ để đóng cửa sổ này..."
    read -n 1 -s -r -t 60 _ || true
    exit "$status"
}
trap finish EXIT

# --- Kiểm tra node/npm có sẵn không, báo lỗi rõ ràng thay vì im lặng thoát ---
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo ""
    echo "❌ Không tìm thấy Node.js/npm trong PATH."
    echo "   Kiểm tra Node.js đã cài chưa: https://nodejs.org (hoặc 'brew install node')."
    echo "   PATH hiện tại: $PATH"
    exit 1
fi

# Lần đầu chạy (hoặc sau khi xóa node_modules) thì cài dependencies trước
if [ ! -d "node_modules" ]; then
    echo "Lần đầu chạy: đang cài đặt dependencies (npm install)..."
    npm install
fi

npm start &
SERVER_PID=$!

# Chờ server thực sự phản hồi (thay vì sleep cố định) - tối đa ~15 giây
READY=0
for i in $(seq 1 30); do
    if curl -s -o /dev/null "$URL"; then
        READY=1
        break
    fi
    # Nếu tiến trình server đã chết (vd: port bận, thiếu gói) thì dừng chờ luôn
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        break
    fi
    sleep 0.5
done

if [ "$READY" -ne 1 ]; then
    echo ""
    echo "⚠️  Không kết nối được tới $URL sau khi chờ."
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "    Tiến trình server đã thoát sớm — xem log phía trên để biết lỗi cụ thể."
        echo "    Nguyên nhân thường gặp: cổng $PORT đang bị chiếm bởi tiến trình khác."
        echo "    Kiểm tra bằng lệnh: lsof -i :$PORT"
    else
        echo "    Nguyên nhân thường gặp: chưa cài xong dependencies hoặc lỗi khi khởi động server.js."
    fi
    echo "    Thử chạy tay: npm install && npm start  (rồi mở $URL khi thấy dòng 'đang chạy tại')"
    echo ""
    exit 1
fi

echo ""
echo "Server đã sẵn sàng. Đang mở trình duyệt tại $URL ..."

# Không để lệnh mở trình duyệt làm chết cả script nếu nó lỗi
OPEN_OK=1
case "$(uname -s)" in
    Darwin*)                open "$URL" || OPEN_OK=0 ;;        # macOS
    MINGW*|MSYS*|CYGWIN*)   cmd //c start "" "$URL" || OPEN_OK=0 ;;  # Git Bash trên Windows
    *)                      xdg-open "$URL" 2>/dev/null || OPEN_OK=0 ;;  # Linux
esac

echo ""
if [ "$OPEN_OK" -eq 1 ]; then
    echo "Ứng dụng đã mở trong trình duyệt."
else
    echo "⚠️  Không tự mở được trình duyệt. Hãy tự mở địa chỉ: $URL"
fi
echo "Nhấn Ctrl+C để tắt server (hoặc đóng cửa sổ này)."

# Giữ script chạy cùng server
wait "$SERVER_PID"
