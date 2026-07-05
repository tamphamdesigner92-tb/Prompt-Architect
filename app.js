// --- CẤU HÌNH KẾT NỐI OLLAMA (AI GỢI Ý) ---
const OLLAMA_CONFIG = {
    endpoint: "http://localhost:11434/api/generate",
    model: "gemma4:e4b" // Đổi tên model tại đây nếu máy bạn cài phiên bản khác
};

// --- DATABASE CẤU TRÚC PROMPT ĐỘNG THEO TỪNG CÔNG VIỆC ---
const PROMPT_STRUCTURES = {
    vibe: {
        title: "Vibe Coding - Thiết Kế Ứng Dụng Nhanh",
        fields: [
            { id: "vision", label: "1. Tầm Nhìn & Cảm Hứng (Vision & Vibe)", desc: "Mô tả ý tưởng cốt lõi và phong cách trải nghiệm.", ex: "Ứng dụng nghe nhạc tối giản, mượt mà phong cách Apple, Dark-mode." },
            { id: "role", label: "2. Vai Trò Hệ Thống (Role & Mindset)", desc: "Quy định trình độ chuyên môn của AI.", ex: "Chuyên gia Lập trình Sáng tạo, Kiến trúc sư Full-stack tối ưu hóa UX." },
            { id: "flow", label: "3. Luồng Trải Nghiệm Người Dùng (User Journey)", desc: "Các bước tương tác chính từ lúc mở đến lúc đóng ứng dụng.", ex: "Bấm nút bắt đầu -> Hiện pop-up nhập liệu -> Xuất kết quả dạng bảng." },
            { id: "tech", label: "4. Hệ Sinh Thái Công Nghệ (Tech Stack)", desc: "Chỉ định ngôn ngữ, framework hoặc quy định thư viện.", ex: "HTML, CSS Vanilla, JavaScript gốc. Không dùng thư viện ngoài." }
        ]
    },
    problem: {
        title: "Giải Quyết Lỗi & Tối Ưu Hệ Thống",
        fields: [
            { id: "role", label: "1. Vai Trò Chuyên Gia", desc: "Ép AI vào vị trí xử lý khủng hoảng.", ex: "Chuyên gia tối ưu hóa cơ sở dữ liệu Postgresql, Kỹ sư DevOps." },
            { id: "context", label: "2. Bối Cảnh & Log Lỗi", desc: "Mô tả hệ thống hiện tại và quăng mã lỗi/log lỗi tại đây.", ex: "Hệ thống bị sập khi có 1000 lượt truy cập đồng thời. Log lỗi: Fatal Error memory leak..." },
            { id: "constraint", label: "3. Ràng Buộc Giải Pháp", desc: "Những giới hạn và thành phần không được phép thay đổi.", ex: "Không được đổi nhà cung cấp Cloud hiện tại, phải xử lý trực tiếp trên code Node.js." }
        ]
    },
    content: {
        title: "Sáng Tạo Nội Dung & Copywriting",
        fields: [
            { id: "role", label: "1. Định Hình Vai Trò & Văn Phong", desc: "Cách AI xưng hô và sử dụng từ ngữ.", ex: "Chuyên gia Storyteller kể chuyện truyền cảm hứng, giọng văn đồng cảm, sâu sắc." },
            { id: "audience", label: "2. Đối Tượng Người Đọc (Target Audience)", desc: "Nêu rõ phân khúc độc giả và nỗi đau của họ.", ex: "Lập trình viên trẻ tuổi đang gặp tình trạng kiệt sức (burnout) trong công việc." },
            { id: "message", label: "3. Thông Điệp Cốt Lõi", desc: "Ý chính bắt buộc phải xuất hiện trong bài viết.", ex: "Lập trình không chỉ là gõ code, đó là nghệ thuật và bạn cần nghỉ ngơi đúng cách." }
        ]
    },
    media: {
        title: "Sáng Tạo Ảnh & Video (Mô Hình Gen-AI)",
        fields: [
            { id: "role", label: "1. Vai Trò & Tư Duy Nghệ Thuật", desc: "Biến AI thành đạo diễn hoặc nhiếp ảnh gia.", ex: "Đạo diễn hình ảnh phim Hollywood, trường phái Cinematic góc quay rộng." },
            { id: "subject", label: "2. Chủ Thể & Bối Cảnh", desc: "Mô tả chi tiết nhân vật, hành động, không gian.", ex: "Một người đàn ông đứng dưới mưa ngắm nhìn thành phố rực rỡ ánh đèn neon Cyberpunk." },
            { id: "camera", label: "3. Góc Máy & Ánh Sáng", desc: "Cài đặt kỹ thuật góc quay và môi trường sáng.", ex: "Góc quay ngang mắt (Eye-level), ánh sáng ngược (Rim lighting) rực rỡ, hiệu ứng xóa phông." }
        ]
    },
    analysis: {
        title: "Phân Tích Dữ Liệu & Trích Xuất Insight",
        fields: [
            { id: "role", label: "1. Vai Trò Chuyên Gia Phân Tích", desc: "Quy định chuyên môn và tư duy phân tích của AI.", ex: "Nhà khoa học dữ liệu senior, chuyên gia thống kê ứng dụng trong kinh doanh bán lẻ." },
            { id: "data", label: "2. Mô Tả Dữ Liệu (Data Context)", desc: "Nguồn dữ liệu, cấu trúc bảng, các cột quan trọng và chất lượng dữ liệu.", ex: "File Excel doanh số 12 tháng gồm các cột: Ngày, Sản phẩm, Khu vực, Doanh thu, Số lượng." },
            { id: "objective", label: "3. Mục Tiêu Phân Tích", desc: "Câu hỏi kinh doanh cụ thể mà bạn cần dữ liệu trả lời.", ex: "Xác định 3 sản phẩm tăng trưởng nhanh nhất và dự báo doanh thu quý tới." },
            { id: "method", label: "4. Phương Pháp & Công Cụ", desc: "Chỉ định kỹ thuật thống kê, ngôn ngữ hoặc công cụ được phép dùng.", ex: "Python với pandas và matplotlib, phân tích xu hướng theo mùa vụ, hồi quy tuyến tính." },
            { id: "output", label: "5. Định Dạng Kết Quả Đầu Ra", desc: "Hình thức trình bày kết quả bạn mong muốn nhận được.", ex: "Bảng tóm tắt số liệu, biểu đồ trực quan và 5 insight quan trọng kèm khuyến nghị hành động." }
        ]
    }
};

// --- QUẢN LÝ TRẠNG THÁI ỨNG DỤNG ---
const AppState = {
    userName: localStorage.getItem("prompt_user_name") || "",
    currentCategory: "vibe",
    isSuggesting: false,

    init() {
        this.updateThemeByTime();
        this.handleScreens();
        this.setupEventListeners();
        this.renderFormFields();
    },

    // Kiểm tra thời gian hệ thống thiết lập nền & lời chào hợp lý
    getDateTimeData() {
        const hour = new Date().getHours();
        let greeting = "Chào buổi tối";
        let theme = "evening";

        if (hour >= 5 && hour < 12) {
            greeting = "Chào buổi sáng";
            theme = "morning";
        } else if (hour >= 12 && hour < 18) {
            greeting = "Chào buổi chiều";
            theme = "afternoon";
        }
        return { greeting, theme };
    },

    updateThemeByTime() {
        const { theme } = this.getDateTimeData();
        document.documentElement.setAttribute("data-theme", theme);
    },

    // Điều hướng giữa màn hình chào mừng và màn hình làm việc chính
    handleScreens() {
        const welcomeScreen = document.getElementById("welcome-screen");
        const mainScreen = document.getElementById("main-screen");
        const greetingText = document.getElementById("greeting-text");
        const nameInputContainer = document.getElementById("name-input-container");

        const { greeting } = this.getDateTimeData();

        if (!this.userName) {
            // Lần đầu mở ứng dụng
            greetingText.innerText = `${greeting}!`;
            nameInputContainer.classList.remove("hidden");
            welcomeScreen.classList.add("active");
        } else {
            // Đã có tên, hiện hiệu ứng chào mừng mượt mà rồi tự chuyển màn hình
            greetingText.innerText = `${greeting}, ${this.userName}!`;
            welcomeScreen.classList.add("active");

            setTimeout(() => {
                welcomeScreen.classList.remove("active");
                mainScreen.classList.add("active");
                document.getElementById("user-profile-tag").innerText = `👤 ${this.userName}`;
            }, 2200); // Animation In/Out diễn ra trong 2.2 giây
        }
    },

    // Thiết lập toàn bộ các cổng lắng nghe sự kiện
    setupEventListeners() {
        // Sự kiện lưu tên lần đầu
        document.getElementById("btn-save-name").addEventListener("click", () => {
            const nameInput = document.getElementById("user-name-input").value.trim();
            if (nameInput) {
                this.userName = nameInput;
                localStorage.setItem("prompt_user_name", nameInput);
                this.showToast("Cài đặt thông tin thành công!");
                this.handleScreens();
            } else {
                this.showToast("Vui lòng nhập tên hợp lệ!", "error");
            }
        });

        // Sự kiện chuyển đổi Menu các danh mục chuyên mục công việc
        document.querySelectorAll(".menu-item").forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("active"));
                e.target.classList.add("active");

                this.currentCategory = e.target.getAttribute("data-category");
                this.renderFormFields();
                this.showToast(`Đã chuyển sang cấu trúc: ${PROMPT_STRUCTURES[this.currentCategory].title}`);
            });
        });

        // Sự kiện click nút Copy prompt kết quả
        document.getElementById("btn-copy-prompt").addEventListener("click", () => {
            const markdownText = document.getElementById("markdown-output").innerText;
            if (markdownText && !markdownText.startsWith("Vui lòng")) {
                navigator.clipboard.writeText(markdownText)
                    .then(() => this.showToast("Đã sao chép Prompt vào khay nhớ tạm!"))
                    .catch(() => this.showToast("Có lỗi xảy ra khi sao chép", "error"));
            } else {
                this.showToast("Chưa có nội dung để sao chép!", "error");
            }
        });

        // Sự kiện gửi ý tưởng ban đầu để AI gợi ý điền form
        document.getElementById("btn-suggest").addEventListener("click", () => this.requestAISuggestions());
        const ideaInput = document.getElementById("idea-input");
        ideaInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                this.requestAISuggestions();
            }
        });
        // Tự động giãn chiều cao ô ý tưởng theo nội dung (có giới hạn bằng max-height trong CSS)
        ideaInput.addEventListener("input", () => this.autoResizeTextarea(ideaInput));
    },

    // Giãn chiều cao textarea theo nội dung; CSS max-height sẽ chặn giãn quá lớn
    autoResizeTextarea(el) {
        if (!el.value) {
            el.style.height = ""; // Trống -> trả về chiều cao mặc định theo CSS
            return;
        }
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    },

    // Sinh các ô nhập liệu một cách động dựa vào cấu trúc được lựa chọn
    renderFormFields() {
        const formContainer = document.getElementById("dynamic-prompt-form");
        const categoryData = PROMPT_STRUCTURES[this.currentCategory];

        document.getElementById("current-category-title").innerText = categoryData.title;
        formContainer.innerHTML = ""; // Xóa form cũ

        categoryData.fields.forEach(field => {
            const fieldWrapper = document.createElement("div");
            fieldWrapper.className = "form-field";

            fieldWrapper.innerHTML = `
                <label for="field-${field.id}">${field.label}</label>
                <span class="field-desc">${field.desc}</span>
                <span class="field-example">Ví dụ: ${field.ex}</span>
                <textarea id="field-${field.id}" placeholder="Điền thông tin của bạn vào đây..."></textarea>
            `;

            // Lắng nghe sự kiện gõ phím để tạo prompt theo thời gian thực (Real-time update)
            fieldWrapper.querySelector("textarea").addEventListener("input", () => {
                this.generateMarkdownPrompt();
            });

            formContainer.appendChild(fieldWrapper);
        });

        // Làm mới ô ý tưởng và khung kết quả bên phải
        const ideaInput = document.getElementById("idea-input");
        ideaInput.value = "";
        ideaInput.style.height = "";
        document.getElementById("markdown-output").innerText = "Vui lòng nhập liệu ở các ô bên trái để tạo cấu trúc prompt...";
    },

    // --- GỌI OLLAMA ĐỂ SINH GỢI Ý TỪ Ý TƯỞNG BAN ĐẦU ---
    async requestAISuggestions() {
        if (this.isSuggesting) return;

        // Ollama chặn request từ file:// (origin null) -> bắt buộc chạy qua localhost
        if (location.protocol === "file:") {
            this.showToast("Không dùng được AI khi mở file trực tiếp. Hãy chạy ứng dụng bằng file start-app.bat!", "error");
            return;
        }

        const idea = document.getElementById("idea-input").value.trim();
        if (!idea) {
            this.showToast("Hãy mô tả ngắn gọn ý tưởng của bạn trước!", "error");
            return;
        }

        const categoryData = PROMPT_STRUCTURES[this.currentCategory];
        const requestedCategory = this.currentCategory; // Chống ghi đè khi người dùng đổi tab giữa chừng

        // Mô tả các trường cần AI đề xuất nội dung
        const fieldSpecs = categoryData.fields
            .map(f => `- "${f.id}": ${f.label} — ${f.desc} (Ví dụ tham khảo: ${f.ex})`)
            .join("\n");

        const prompt = `Bạn là trợ lý thiết kế prompt chuyên nghiệp.
Người dùng đang soạn prompt thuộc nhóm công việc: "${categoryData.title}".
Ý tưởng ban đầu của người dùng: "${idea}"

Dựa trên ý tưởng đó, hãy đề xuất nội dung cụ thể (bằng tiếng Việt, mỗi trường 1-3 câu, bám sát ý tưởng của người dùng) cho các trường sau:
${fieldSpecs}

Chỉ trả về DUY NHẤT một JSON object hợp lệ với đúng các khóa: ${categoryData.fields.map(f => `"${f.id}"`).join(", ")}. Không thêm giải thích hay markdown.`;

        this.setSuggestingState(true);

        try {
            const response = await fetch(OLLAMA_CONFIG.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: OLLAMA_CONFIG.model,
                    prompt: prompt,
                    format: "json",
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama trả về mã lỗi ${response.status}`);
            }

            const data = await response.json();
            const suggestions = this.parseJSONSafely(data.response);

            if (!suggestions) {
                throw new Error("Không đọc được dữ liệu JSON từ model");
            }

            // Nếu người dùng đã chuyển nhóm khác trong lúc chờ thì bỏ qua kết quả
            if (this.currentCategory !== requestedCategory) return;

            let filledCount = 0;
            categoryData.fields.forEach(field => {
                const value = suggestions[field.id];
                const textarea = document.getElementById(`field-${field.id}`);
                if (textarea && typeof value === "string" && value.trim()) {
                    textarea.value = value.trim();
                    textarea.classList.add("ai-suggested");
                    setTimeout(() => textarea.classList.remove("ai-suggested"), 1600);
                    filledCount++;
                }
            });

            if (filledCount > 0) {
                this.generateMarkdownPrompt();
                this.showToast(`AI đã gợi ý ${filledCount} trường. Bạn có thể chỉnh sửa lại tùy ý!`);
            } else {
                this.showToast("Model không trả về gợi ý phù hợp, hãy thử lại.", "error");
            }
        } catch (err) {
            console.error("Lỗi gọi Ollama:", err);
            this.showToast(`Không kết nối được Ollama (${OLLAMA_CONFIG.model}). Kiểm tra Ollama đang chạy tại localhost:11434.`, "error");
        } finally {
            this.setSuggestingState(false);
        }
    },

    // Trích xuất JSON an toàn kể cả khi model trả kèm văn bản thừa
    parseJSONSafely(text) {
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (_) {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try { return JSON.parse(match[0]); } catch (_) { return null; }
            }
            return null;
        }
    },

    // Cập nhật trạng thái nút gợi ý (đang tải / sẵn sàng)
    setSuggestingState(loading) {
        this.isSuggesting = loading;
        const btn = document.getElementById("btn-suggest");
        btn.disabled = loading;
        btn.innerHTML = loading
            ? `<span class="spinner"></span> Đang gợi ý...`
            : `✨ Gợi ý bằng AI`;
    },

    // Thu thập dữ liệu từ các ô và build ra cấu trúc Markdown chuẩn tiếng Việt
    generateMarkdownPrompt() {
        const categoryData = PROMPT_STRUCTURES[this.currentCategory];
        let hasContent = false;
        let markdownResult = ``;

        categoryData.fields.forEach(field => {
            const value = document.getElementById(`field-${field.id}`).value.trim();
            if (value) {
                hasContent = true;
                // Chuyển đổi nhãn hoa mỹ thành Header trong Markdown
                markdownResult += `# ${field.label.toUpperCase()}\n- ${value}\n\n`;
            }
        });

        const outputContainer = document.getElementById("markdown-output");
        if (hasContent) {
            outputContainer.innerText = markdownResult.trim();
        } else {
            outputContainer.innerText = "Vui lòng nhập liệu ở các ô bên trái để tạo cấu trúc prompt...";
        }
    },

    // Tiện ích Toast thông báo trạng thái UX phản hồi nhanh
    showToast(message, type = "success") {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerText = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
};

// Khởi chạy ứng dụng khi DOM tải xong hoàn toàn
document.addEventListener("DOMContentLoaded", () => {
    AppState.init();
});
