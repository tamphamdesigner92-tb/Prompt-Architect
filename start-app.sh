#!/usr/bin/env bash
# ============================================================
#  Khởi động Prompt Architect qua server local (cổng 8931)
#  Bắt buộc chạy qua http://localhost để Ollama chấp nhận CORS
#  (mở trực tiếp index.html bằng file:// sẽ bị Ollama chặn 403)
#
#  Dùng được trên: Git Bash (Windows), macOS, Linux
# ============================================================
set -e

cd "$(dirname "$0")"

PORT=8931
URL="http://localhost:$PORT"

echo "Đang khởi động Prompt Architect tại $URL ..."
npx -y http-server -p "$PORT" -c-1 &
SERVER_PID=$!

# Tắt server khi thoát script (Ctrl+C)
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT

# Chờ server sẵn sàng rồi mở trình duyệt
sleep 3

case "$(uname -s)" in
    Darwin*)                open "$URL" ;;                    # macOS
    MINGW*|MSYS*|CYGWIN*)   cmd //c start "" "$URL" ;;        # Git Bash trên Windows
    *)                      xdg-open "$URL" 2>/dev/null || echo "Hãy tự mở trình duyệt tại: $URL" ;;  # Linux
esac

echo ""
echo "Ứng dụng đã mở trong trình duyệt."
echo "Nhấn Ctrl+C để tắt server."

# Giữ script chạy cùng server
wait "$SERVER_PID"
