// --- CẤU HÌNH CÁC NHÀ CUNG CẤP AI ---
const AI_CONFIG = {
    gemini: {
        model: "gemini-2.5-flash",
        buildEndpoint: (model, key) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        rotateAfter: 10 // Luân phiên sang API key kế tiếp sau số lượt gợi ý thành công
    },
    ollama: {
        endpoint: "http://localhost:11434/api/generate",
        model: "gemma4:e4b" // Đổi tên model tại đây nếu máy bạn cài phiên bản khác
    }
};

const SETTINGS_STORAGE_KEY = "prompt_ai_settings";

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
    },
    research: {
        title: "Nghiên Cứu Chuyên Sâu Một Chủ Đề",
        fields: [
            { id: "role", label: "1. Vai Trò Chuyên Gia Nghiên Cứu", desc: "Quy định chuyên môn, lĩnh vực và tư duy phản biện của AI.", ex: "Nhà nghiên cứu độc lập chuyên ngành kinh tế số, có kinh nghiệm rà soát tài liệu học thuật (literature review)." },
            { id: "scope", label: "2. Chủ Đề & Phạm Vi Nghiên Cứu", desc: "Chủ đề cụ thể, giới hạn thời gian/địa lý/ngành và những gì loại trừ khỏi phạm vi.", ex: "Tác động của AI tạo sinh lên ngành thiết kế đồ họa Việt Nam giai đoạn 2023-2025; không xét mảng game và phim hoạt hình." },
            { id: "questions", label: "3. Câu Hỏi Nghiên Cứu Cốt Lõi", desc: "3-5 câu hỏi cụ thể, đo lường được, tránh hỏi chung chung.", ex: "Tỷ lệ designer đã dùng AI trong quy trình? Nhóm kỹ năng nào bị thay thế nhanh nhất? Mức giá dịch vụ thay đổi ra sao?" },
            { id: "sources", label: "4. Nguồn Tham Khảo & Tiêu Chí Tin Cậy", desc: "Loại nguồn được ưu tiên, năm xuất bản tối thiểu và yêu cầu đối chiếu chéo.", ex: "Ưu tiên báo cáo ngành và khảo sát có mẫu từ 500 người trở lên, xuất bản từ 2023; mỗi số liệu phải đối chiếu tối thiểu 2 nguồn độc lập." },
            { id: "method", label: "5. Phương Pháp Phân Tích & Lập Luận", desc: "Kỹ thuật phân tích, cách xử lý mâu thuẫn giữa các nguồn và mức độ chắc chắn.", ex: "So sánh đối chiếu đa nguồn, phân tích nguyên nhân - hệ quả, nêu rõ điểm còn tranh cãi và mức độ tin cậy của từng kết luận." },
            { id: "output", label: "6. Định Dạng Báo Cáo & Trích Dẫn", desc: "Cấu trúc báo cáo, kiểu trích dẫn và yêu cầu ghi nguồn.", ex: "Tóm tắt điều hành khoảng 200 từ, thân bài theo từng câu hỏi, mục hạn chế nghiên cứu; mọi số liệu ghi nguồn kèm link." }
        ]
    }
};

// --- QUẢN LÝ TRẠNG THÁI ỨNG DỤNG ---
const AppState = {
    userName: localStorage.getItem("prompt_user_name") || "",
    currentCategory: "vibe",
    isSuggesting: false,

    // Ngữ cảnh nâng cao chỉ áp dụng cho các nhóm liên quan tới code
    CONTEXT_CATEGORIES: ["vibe", "problem"],
    // Ảnh tham chiếu (đầu vào tạm thời cho nhóm media): mảng dataURL JPEG, tối đa 3, KHÔNG lưu server
    referenceImages: [],
    MAX_REFERENCE_IMAGES: 3,

    // Cài đặt AI: Gemini là mặc định, gemma4 (Ollama) là lựa chọn phụ
    settings: {
        provider: "gemini",
        geminiKeys: [],       // Danh sách API key, luân phiên sử dụng
        activeKeyIndex: 0,    // Key đang dùng
        promptCount: 0        // Số lượt đã gợi ý bằng key hiện tại
    },

    init() {
        this.loadSettings();
        this.updateThemeByTime();
        this.handleScreens();
        this.setupEventListeners();
        this.setupModalKeyboard();
        this.renderFormFields();
    },

    // --- CÀI ĐẶT: LƯU / ĐỌC TỪ LOCALSTORAGE ---
    loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY));
            if (saved && typeof saved === "object") {
                this.settings = { ...this.settings, ...saved };
            }
        } catch (_) { /* Dữ liệu hỏng thì dùng mặc định */ }
    },

    saveSettings() {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
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
                // Icon là markup tĩnh, còn tên người dùng giữ nguyên dạng text node
        // (không nhét vào innerHTML) để tên có ký tự như < > không phá vỡ DOM
        const profileTag = document.getElementById("user-profile-tag");
        profileTag.innerHTML = `<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-user"></use></svg><span></span>`;
        profileTag.querySelector("span").textContent = this.userName;
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
                    .then(() => {
                        this.showToast("Đã sao chép Prompt vào khay nhớ tạm!");
                        const idea = document.getElementById("idea-input").value.trim();
                        this.commitHistoryEntry(idea, markdownText, this.currentCategory);
                    })
                    .catch(() => this.showToast("Có lỗi xảy ra khi sao chép", "error"));
            } else {
                this.showToast("Chưa có nội dung để sao chép!", "error");
            }
        });

        // Sự kiện lưu prompt hiện tại vào thư viện
        document.getElementById("btn-save-prompt").addEventListener("click", () => this.savePromptToLibrary());

        // --- SỰ KIỆN LỊCH SỬ PROMPT ---
        document.getElementById("btn-open-history").addEventListener("click", () => this.openHistory());
        document.getElementById("btn-close-history").addEventListener("click", () => this.closeHistory());
        document.getElementById("history-modal").addEventListener("click", (e) => {
            if (e.target.id === "history-modal") this.closeHistory();
        });

        // --- SỰ KIỆN THƯ VIỆN LƯU TRỮ + THÙNG RÁC ---
        document.getElementById("btn-open-saved").addEventListener("click", () => this.openSaved());
        document.getElementById("btn-close-saved").addEventListener("click", () => this.closeSaved());
        document.getElementById("saved-modal").addEventListener("click", (e) => {
            if (e.target.id === "saved-modal") this.closeSaved();
        });
        document.querySelectorAll(".saved-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => this.switchSavedTab(btn.getAttribute("data-tab")));
        });
        document.getElementById("saved-image-input").addEventListener("change", (e) => {
            const file = e.target.files[0];
            this.handleImageSelected(file);
            e.target.value = ""; // reset để chọn lại đúng file cũ vẫn kích hoạt sự kiện change
        });

        // Sự kiện gửi ý tưởng ban đầu để AI gợi ý điền form
        document.getElementById("btn-suggest").addEventListener("click", () => this.requestAISuggestions());

        // Nút Tối ưu / Sửa lỗi Prompt: nhờ AI phê bình & viết lại các trường hiện có
        document.getElementById("btn-optimize").addEventListener("click", () => this.optimizePrompt());

        // Vùng ảnh tham chiếu (nhóm media)
        this.setupReferenceImages();
        const ideaInput = document.getElementById("idea-input");
        ideaInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                this.requestAISuggestions();
            }
        });
        ideaInput.addEventListener("input", () => this.autoResize(ideaInput));

        // --- SỰ KIỆN MÀN HÌNH CÀI ĐẶT AI ---
        document.getElementById("btn-open-settings").addEventListener("click", () => this.openSettings());
        document.getElementById("btn-close-settings").addEventListener("click", () => this.closeSettings());

        // Bấm vào nền mờ bên ngoài card thì đóng modal
        document.getElementById("settings-modal").addEventListener("click", (e) => {
            if (e.target.id === "settings-modal") this.closeSettings();
        });

        // Chuyển đổi nhà cung cấp AI
        document.querySelectorAll('input[name="ai-provider"]').forEach(radio => {
            radio.addEventListener("change", (e) => {
                this.settings.provider = e.target.value;
                this.saveSettings();
                const label = e.target.value === "gemini" ? "Gemini API" : `Ollama (${AI_CONFIG.ollama.model})`;
                this.showToast(`Đã chuyển sang dùng ${label}`);
            });
        });

        // Thêm API key Gemini mới
        const addKey = () => {
            const input = document.getElementById("new-gemini-key");
            const key = input.value.trim();
            if (!key) {
                this.showToast("Hãy dán API key vào ô trước khi thêm!", "error");
                return;
            }
            if (this.settings.geminiKeys.includes(key)) {
                this.showToast("API key này đã có trong danh sách!", "error");
                return;
            }
            this.settings.geminiKeys.push(key);
            this.saveSettings();
            this.renderKeyList();
            input.value = "";
            this.showToast(`Đã thêm API key #${this.settings.geminiKeys.length}!`);
        };
        document.getElementById("btn-add-key").addEventListener("click", addKey);
        document.getElementById("new-gemini-key").addEventListener("keydown", (e) => {
            if (e.key === "Enter") { e.preventDefault(); addKey(); }
        });
    },


    // --- QUẢN LÝ MODAL DÙNG CHUNG CHO CẢ 3 HỘP THOẠI ---
    // Trước đây modal chỉ toggle class "hidden": không đóng được bằng Esc, tiêu điểm
    // bàn phím vẫn chạy ra ngoài phía sau lớp phủ, và sau khi đóng thì tiêu điểm mất
    // hẳn. Ba hàm dưới xử lý chung để không phải lặp lại ở từng modal.
    lastFocusedElement: null,

    // Danh sách phần tử có thể nhận tiêu điểm bên trong một modal
    getFocusable(modal) {
        const selector = 'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
        return Array.from(modal.querySelectorAll(selector))
            .filter(el => !el.disabled && el.offsetParent !== null);
    },

    openModal(modalId) {
        // Ghi nhớ nút đã mở modal để trả tiêu điểm về đúng chỗ khi đóng
        this.lastFocusedElement = document.activeElement;
        const modal = document.getElementById(modalId);
        modal.classList.remove("hidden");

        // Đưa tiêu điểm vào trong modal để người dùng bàn phím không bị mắc ngoài
        const focusable = this.getFocusable(modal);
        if (focusable.length) focusable[0].focus();
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.add("hidden");
        // Trả tiêu điểm về nút đã mở modal (hành vi chuẩn của hộp thoại)
        if (this.lastFocusedElement && document.body.contains(this.lastFocusedElement)) {
            this.lastFocusedElement.focus();
        }
        this.lastFocusedElement = null;
    },

    // Modal đang mở (nếu có). Dùng cho phím Esc và bẫy Tab.
    getOpenModal() {
        return document.querySelector(".modal-overlay:not(.hidden)");
    },

    // Esc để đóng + Tab/Shift+Tab quay vòng bên trong modal (focus trap)
    setupModalKeyboard() {
        document.addEventListener("keydown", (e) => {
            const modal = this.getOpenModal();
            if (!modal) return;

            if (e.key === "Escape") {
                e.preventDefault();
                this.closeModal(modal.id);
                return;
            }

            if (e.key !== "Tab") return;

            const focusable = this.getFocusable(modal);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            // Đến phần tử cuối rồi nhấn Tab thì quay về đầu, và ngược lại
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    },

    // --- MÀN HÌNH CÀI ĐẶT AI ---
    openSettings() {
        // Đồng bộ trạng thái hiện tại lên giao diện trước khi hiện
        document.querySelectorAll('input[name="ai-provider"]').forEach(radio => {
            radio.checked = radio.value === this.settings.provider;
        });
        this.renderKeyList();
        this.openModal("settings-modal");
    },

    closeSettings() {
        this.closeModal("settings-modal");
    },

    // Vẽ danh sách API key (che bớt ký tự để bảo mật) + trạng thái luân phiên
    renderKeyList() {
        const list = document.getElementById("gemini-key-list");
        const status = document.getElementById("key-rotation-status");
        list.innerHTML = "";

        if (this.settings.geminiKeys.length === 0) {
            status.innerText = "Chưa có API key nào. Lấy key miễn phí tại aistudio.google.com";
            return;
        }

        this.settings.geminiKeys.forEach((key, index) => {
            const item = document.createElement("li");
            item.className = "key-item";

            const masked = key.length > 12 ? `${key.slice(0, 6)}••••••${key.slice(-4)}` : "••••••";
            const label = document.createElement("span");
            label.className = "key-label";
            label.textContent = `Key #${index + 1}: ${masked}`;

            if (index === this.settings.activeKeyIndex) {
                const badge = document.createElement("span");
                badge.className = "key-badge";
                badge.textContent = "Đang dùng";
                label.appendChild(badge);
            }

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn-delete-key";
            deleteBtn.title = "Xóa key này";
            deleteBtn.textContent = "✕";
            deleteBtn.addEventListener("click", () => {
                this.settings.geminiKeys.splice(index, 1);
                // Điều chỉnh lại con trỏ key đang dùng sau khi xóa
                if (this.settings.activeKeyIndex >= this.settings.geminiKeys.length) {
                    this.settings.activeKeyIndex = 0;
                }
                this.settings.promptCount = 0;
                this.saveSettings();
                this.renderKeyList();
                this.showToast("Đã xóa API key.");
            });

            item.appendChild(label);
            item.appendChild(deleteBtn);
            list.appendChild(item);
        });

        status.innerText = `Đang dùng key #${this.settings.activeKeyIndex + 1}/${this.settings.geminiKeys.length} — đã gợi ý ${this.settings.promptCount}/${AI_CONFIG.gemini.rotateAfter} lượt (đủ ${AI_CONFIG.gemini.rotateAfter} lượt sẽ tự chuyển key kế tiếp).`;
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

            // Lắng nghe sự kiện gõ phím: tự co giãn chiều cao + tạo prompt theo thời gian thực
            const textarea = fieldWrapper.querySelector("textarea");
            textarea.addEventListener("input", () => {
                this.autoResize(textarea);
                this.generateMarkdownPrompt();
            });

            formContainer.appendChild(fieldWrapper);
        });

        // Làm mới ô ý tưởng và khung kết quả bên phải
        document.getElementById("idea-input").value = "";
        document.getElementById("markdown-output").innerText = "Vui lòng nhập liệu ở các ô bên trái để tạo cấu trúc prompt...";

        // Bật/tắt các panel phụ theo nhóm công việc hiện tại (kèm reset dữ liệu tạm)
        this.updateContextPanels();
    },

    // Hiện ngữ cảnh nâng cao ở nhóm code (vibe/problem) và ảnh tham chiếu ở nhóm media,
    // đồng thời xóa dữ liệu tạm để không mang sang nhóm khác.
    updateContextPanels() {
        const showContext = this.CONTEXT_CATEGORIES.includes(this.currentCategory);
        const advanced = document.getElementById("advanced-context");
        advanced.classList.toggle("hidden", !showContext);
        if (!showContext) advanced.removeAttribute("open");
        document.getElementById("context-architecture").value = "";
        document.getElementById("context-tech").value = "";

        const showReference = this.currentCategory === "media";
        document.getElementById("reference-panel").classList.toggle("hidden", !showReference);
        this.referenceImages = [];
        this.renderReferenceThumbs();
    },

    // --- XÂY DỰNG PROMPT CHẤT LƯỢNG CAO GỬI CHO AI ---
    buildSuggestionPrompt(idea, categoryData, extras = {}) {
        const fieldSpecs = categoryData.fields
            .map(f => `- "${f.id}" (${f.label}): ${f.desc} Ví dụ tham khảo: ${f.ex}`)
            .join("\n");

        // Ngữ cảnh kỹ thuật bổ sung (kiến trúc + công nghệ) — chỉ dùng để AI bám sát, không bắt buộc có
        let contextBlock = "";
        const archi = (extras.architecture || "").trim();
        const tech = (extras.tech || "").trim();
        if (archi || tech) {
            contextBlock = "\n\nNGỮ CẢNH KỸ THUẬT BỔ SUNG (bám sát khi viết, đây là ràng buộc thật của dự án):";
            if (archi) contextBlock += `\n- Kiến trúc ứng dụng: ${archi}`;
            if (tech) contextBlock += `\n- Công nghệ sử dụng: ${tech}`;
        }

        // Khi có ảnh tham chiếu (nhóm media): yêu cầu AI phân tích ảnh để trích đặc trưng thị giác
        const imageBlock = extras.hasImages
            ? "\n\nẢNH THAM CHIẾU: Người dùng đã đính kèm ảnh tham chiếu. Hãy phân tích kỹ để trích xuất phong cách nghệ thuật, bố cục/khung hình, bảng màu, nguồn sáng & không khí, rồi phản ánh chính xác các đặc trưng đó vào các thành phần tương ứng."
            : "";

        return `Bạn là chuyên gia Prompt Engineering cấp cao, chuyên thiết kế prompt chất lượng sản xuất (production-grade) cho các mô hình AI.

NHIỆM VỤ: Từ ý tưởng thô của người dùng, viết nội dung CHI TIẾT và CHUYÊN NGHIỆP cho từng thành phần của một prompt thuộc nhóm công việc: "${categoryData.title}".

Ý TƯỞNG GỐC CỦA NGƯỜI DÙNG: "${idea}"${contextBlock}${imageBlock}

CÁC THÀNH PHẦN CẦN VIẾT:
${fieldSpecs}

YÊU CẦU CHẤT LƯỢNG (bắt buộc tuân thủ):
1. Viết bằng tiếng Việt, mỗi thành phần 3-6 câu, giàu thông tin và đi thẳng vào trọng tâm.
2. Cụ thể hóa tối đa: dùng con số, tiêu chí đo lường được và thuật ngữ chuyên ngành chính xác. TUYỆT ĐỐI tránh các từ chung chung như "chất lượng cao", "tối ưu", "đẹp", "tốt nhất" mà không giải thích cụ thể như thế nào.
3. Chủ động bổ sung các chi tiết chuyên môn quan trọng mà người dùng chưa nghĩ tới: ràng buộc kỹ thuật, tiêu chuẩn ngành, trường hợp biên (edge case), phong cách/tài liệu tham chiếu phù hợp.
4. Bám sát và mở rộng đúng hướng ý tưởng gốc — không suy diễn sang chủ đề khác.
5. Các thành phần phải nhất quán và bổ trợ lẫn nhau, ghép lại thành một prompt hoàn chỉnh có thể dùng ngay mà không cần sửa.

ĐỊNH DẠNG ĐẦU RA: Chỉ trả về DUY NHẤT một JSON object hợp lệ với đúng các khóa: ${categoryData.fields.map(f => `"${f.id}"`).join(", ")}. Giá trị là chuỗi văn bản thuần tiếng Việt. Không thêm lời giải thích, không markdown, không code fence.`;
    },

    // --- ĐIỀU PHỐI GỌI AI THEO NHÀ CUNG CẤP ĐANG CHỌN ---
    async requestAISuggestions() {
        if (this.isSuggesting) return;

        const provider = this.settings.provider;

        // Ollama chặn request từ file:// (origin null) -> bắt buộc chạy qua localhost
        if (provider === "ollama" && location.protocol === "file:") {
            this.showToast("Không dùng được Ollama khi mở file trực tiếp. Hãy chạy ứng dụng bằng file start-app.bat!", "error");
            return;
        }

        // Gemini cần ít nhất 1 API key
        if (provider === "gemini" && this.settings.geminiKeys.length === 0) {
            this.showToast("Bạn chưa thêm API key Gemini. Hãy thêm key trong Cài đặt!", "error");
            this.openSettings();
            return;
        }

        const idea = document.getElementById("idea-input").value.trim();
        if (!idea) {
            this.showToast("Hãy mô tả ngắn gọn ý tưởng của bạn trước!", "error");
            return;
        }

        const categoryData = PROMPT_STRUCTURES[this.currentCategory];
        const requestedCategory = this.currentCategory; // Chống ghi đè khi người dùng đổi tab giữa chừng
        const images = this.currentCategory === "media" ? this.referenceImages.slice() : [];
        const prompt = this.buildSuggestionPrompt(idea, categoryData, {
            architecture: this.CONTEXT_CATEGORIES.includes(this.currentCategory) ? document.getElementById("context-architecture").value : "",
            tech: this.CONTEXT_CATEGORIES.includes(this.currentCategory) ? document.getElementById("context-tech").value : "",
            hasImages: images.length > 0
        });

        this.setSuggestingState(true);

        try {
            const rawText = provider === "gemini"
                ? await this.callGemini(prompt, images)
                : await this.callOllama(prompt, images);

            const suggestions = this.parseJSONSafely(rawText);
            if (!suggestions) {
                throw new Error("Không đọc được dữ liệu JSON từ model");
            }

            // Nếu người dùng đã chuyển nhóm khác trong lúc chờ thì bỏ qua kết quả
            if (this.currentCategory !== requestedCategory) return;

            this.applySuggestions(suggestions, categoryData);
        } catch (err) {
            console.error("Lỗi gọi AI:", err);
            const message = provider === "gemini"
                ? "Gọi Gemini thất bại trên tất cả API key. Kiểm tra key trong Cài đặt và kết nối mạng."
                : `Không kết nối được Ollama (${AI_CONFIG.ollama.model}). Kiểm tra Ollama đang chạy tại localhost:11434.`;
            this.showToast(message, "error");
        } finally {
            this.setSuggestingState(false);
        }
    },

    // --- GỌI GEMINI API VỚI CƠ CHẾ LUÂN PHIÊN KEY ---
    // Key lỗi -> tự thử key kế tiếp. Đủ 10 lượt thành công -> chủ động chuyển key.
    async callGemini(promptText, images = []) {
        const keys = this.settings.geminiKeys;
        const total = keys.length;
        let lastError = null;

        // Ghép ảnh tham chiếu (nếu có) vào parts dưới dạng inline_data để Gemini phân tích đa phương thức
        const parts = [{ text: promptText }];
        images.forEach(dataUrl => {
            const parsed = this.parseDataUrl(dataUrl);
            if (parsed) parts.push({ inline_data: { mime_type: parsed.mimeType, data: parsed.base64 } });
        });

        for (let attempt = 0; attempt < total; attempt++) {
            const index = (this.settings.activeKeyIndex + attempt) % total;
            try {
                const response = await fetch(AI_CONFIG.gemini.buildEndpoint(AI_CONFIG.gemini.model, keys[index]), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.7
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Gemini trả về mã lỗi ${response.status}`);
                }

                const data = await response.json();
                const text = data.candidates && data.candidates[0]
                    && data.candidates[0].content && data.candidates[0].content.parts
                    && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

                if (!text) {
                    throw new Error("Gemini không trả về nội dung");
                }

                // Nếu phải nhảy sang key khác do key trước lỗi thì thông báo
                if (index !== this.settings.activeKeyIndex) {
                    this.settings.activeKeyIndex = index;
                    this.settings.promptCount = 0;
                    this.showToast(`API key trước không phản hồi, đã tự chuyển sang key #${index + 1}.`);
                }

                // Đếm lượt dùng, đủ ngưỡng thì luân phiên sang key kế tiếp
                this.settings.promptCount++;
                if (this.settings.promptCount >= AI_CONFIG.gemini.rotateAfter) {
                    this.settings.promptCount = 0;
                    if (total > 1) {
                        this.settings.activeKeyIndex = (index + 1) % total;
                        this.showToast(`Đã dùng đủ ${AI_CONFIG.gemini.rotateAfter} lượt, tự chuyển sang API key #${this.settings.activeKeyIndex + 1}.`);
                    }
                }
                this.saveSettings();

                return text;
            } catch (err) {
                lastError = err;
                console.warn(`API key #${index + 1} lỗi:`, err.message);
            }
        }

        throw lastError || new Error("Tất cả API key đều không phản hồi");
    },

    // --- GỌI OLLAMA LOCAL (gemma4) ---
    async callOllama(promptText, images = []) {
        // Ollama /api/generate nhận ảnh qua mảng "images" là chuỗi base64 (bỏ tiền tố data:)
        const base64Images = images
            .map(dataUrl => (this.parseDataUrl(dataUrl) || {}).base64)
            .filter(Boolean);

        const payload = {
            model: AI_CONFIG.ollama.model,
            prompt: promptText,
            format: "json",
            stream: false
        };
        if (base64Images.length) payload.images = base64Images;

        const response = await fetch(AI_CONFIG.ollama.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Ollama trả về mã lỗi ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    },

    // Điền gợi ý AI vào các ô nhập liệu kèm hiệu ứng
    applySuggestions(suggestions, categoryData) {
        let filledCount = 0;
        categoryData.fields.forEach(field => {
            const value = suggestions[field.id];
            const textarea = document.getElementById(`field-${field.id}`);
            if (textarea && typeof value === "string" && value.trim()) {
                textarea.value = value.trim();
                this.autoResize(textarea); // Nới chiều cao vừa với nội dung AI vừa điền
                textarea.classList.add("ai-suggested");
                setTimeout(() => textarea.classList.remove("ai-suggested"), 1600);
                filledCount++;
            }
        });

        if (filledCount > 0) {
            const markdown = this.generateMarkdownPrompt();
            const idea = document.getElementById("idea-input").value.trim();
            this.commitHistoryEntry(idea, markdown, this.currentCategory);
            this.showToast(`AI đã gợi ý ${filledCount} trường. Bạn có thể chỉnh sửa lại tùy ý!`);
        } else {
            this.showToast("Model không trả về gợi ý phù hợp, hãy thử lại.", "error");
        }
    },

    // Tự điều chỉnh chiều cao textarea vừa khít nội dung (auto-grow)
    autoResize(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
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

    // Cập nhật trạng thái khi gọi AI (đang tải / sẵn sàng). mode: "suggest" | "optimize"
    // quyết định nút nào hiển thị spinner; cả hai nút đều bị khóa để tránh gọi chồng.
    setSuggestingState(loading, mode = "suggest") {
        this.isSuggesting = loading;
        const suggestBtn = document.getElementById("btn-suggest");
        const optimizeBtn = document.getElementById("btn-optimize");

        suggestBtn.disabled = loading;
        optimizeBtn.disabled = loading;

        suggestBtn.innerHTML = (loading && mode === "suggest")
            ? `<span class="spinner"></span> Đang gợi ý...`
            : `✨ Gợi ý bằng AI`;
        optimizeBtn.innerHTML = (loading && mode === "optimize")
            ? `<span class="spinner"></span> Đang tối ưu...`
            : `🪄 Tối ưu / Sửa lỗi`;
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
        const finalMarkdown = hasContent ? markdownResult.trim() : "";
        outputContainer.innerText = finalMarkdown || "Vui lòng nhập liệu ở các ô bên trái để tạo cấu trúc prompt...";
        return finalMarkdown; // Chuỗi rỗng nếu chưa có nội dung — dùng để ghi lịch sử/lưu trữ
    },

    // --- LỊCH SỬ PROMPT (tự động lưu tại các điểm chốt, tối đa 50 mục) ---
    lastHistoryPrompt: "",

    async openHistory() {
        this.openModal("history-modal");
        await this.loadHistoryList();
    },

    closeHistory() {
        this.closeModal("history-modal");
    },

    async loadHistoryList() {
        const list = document.getElementById("history-list");
        list.innerHTML = `<li class="entry-empty">Đang tải...</li>`;
        try {
            const res = await fetch("/api/history");
            this.renderHistoryList(await res.json());
        } catch (err) {
            console.error("Không tải được lịch sử:", err);
            list.innerHTML = `<li class="entry-empty">Không tải được lịch sử. Kiểm tra server đang chạy.</li>`;
        }
    },

    renderHistoryList(items) {
        const list = document.getElementById("history-list");
        list.innerHTML = "";

        if (!items.length) {
            list.innerHTML = `<li class="entry-empty">Chưa có lịch sử nào. Lịch sử sẽ tự lưu sau khi bạn dùng AI gợi ý hoặc sao chép prompt.</li>`;
            return;
        }

        items.forEach(entry => {
            const item = document.createElement("li");
            item.className = "entry-card";

            const categoryTitle = (PROMPT_STRUCTURES[entry.category] || {}).title || entry.category;
            const excerpt = entry.idea.length > 140 ? `${entry.idea.slice(0, 140)}…` : entry.idea;

            item.innerHTML = `
                <div class="entry-meta">
                    <span class="key-badge">${categoryTitle}</span>
                    <span class="field-desc">${this.formatRelativeTime(entry.createdAt)}</span>
                </div>
                <p class="entry-excerpt">${excerpt}</p>
            `;

            const actions = document.createElement("div");
            actions.className = "entry-actions";
            const useBtn = document.createElement("button");
            useBtn.className = "btn-secondary";
            useBtn.textContent = "Dùng lại ý tưởng này";
            useBtn.addEventListener("click", () => this.useHistoryEntry(entry));
            actions.appendChild(useBtn);
            item.appendChild(actions);

            list.appendChild(item);
        });
    },

    useHistoryEntry(entry) {
        if (!PROMPT_STRUCTURES[entry.category]) return;

        document.querySelectorAll(".menu-item").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-category") === entry.category);
        });
        this.currentCategory = entry.category;
        this.renderFormFields(); // Làm mới form theo đúng nhóm công việc đã lưu

        document.getElementById("idea-input").value = entry.idea;
        document.getElementById("markdown-output").innerText = entry.prompt;
        this.lastHistoryPrompt = entry.prompt;

        this.closeHistory();
        this.showToast("Đã khôi phục ý tưởng và prompt từ lịch sử. Bấm Gợi ý AI để điền lại từng trường nếu cần.");
    },

    // Ghi lịch sử tại các điểm "chốt" (sau khi AI gợi ý thành công / khi bấm Sao chép),
    // KHÔNG ghi mỗi lần gõ phím — nếu không sẽ nhanh chóng lấp đầy 50 slot bằng bản nháp giữa chừng.
    commitHistoryEntry(idea, prompt, category) {
        if (!idea || !idea.trim() || !prompt || prompt === this.lastHistoryPrompt) return;
        this.lastHistoryPrompt = prompt;

        fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idea: idea.trim(), prompt, category })
        }).catch(err => console.warn("Không lưu được lịch sử:", err));
    },

    formatRelativeTime(timestamp) {
        const diffMs = Date.now() - timestamp;
        const minute = 60 * 1000, hour = 60 * minute, day = 24 * hour;

        if (diffMs < minute) return "Vừa xong";
        if (diffMs < hour) return `${Math.floor(diffMs / minute)} phút trước`;
        if (diffMs < day) return `${Math.floor(diffMs / hour)} giờ trước`;
        if (diffMs < 30 * day) return `${Math.floor(diffMs / day)} ngày trước`;
        return new Date(timestamp).toLocaleDateString("vi-VN");
    },

    // --- THƯ VIỆN LƯU TRỮ PROMPT + ẢNH MINH HỌA + THÙNG RÁC ---
    savedActiveTab: "saved",
    pendingImageEntryId: null,

    async openSaved(tab = "saved") {
        this.openModal("saved-modal");
        this.switchSavedTab(tab);
    },

    closeSaved() {
        this.closeModal("saved-modal");
    },

    switchSavedTab(tab) {
        this.savedActiveTab = tab;
        document.querySelectorAll(".saved-tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
        });
        document.getElementById("saved-list").classList.toggle("hidden", tab !== "saved");
        document.getElementById("trash-list").classList.toggle("hidden", tab !== "trash");

        if (tab === "saved") this.loadSavedList();
        else this.loadTrashList();
    },

    async savePromptToLibrary() {
        const markdown = document.getElementById("markdown-output").innerText;
        if (!markdown || markdown.startsWith("Vui lòng")) {
            this.showToast("Chưa có nội dung prompt để lưu!", "error");
            return;
        }
        const idea = document.getElementById("idea-input").value.trim();

        try {
            const res = await fetch("/api/saved", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idea, prompt: markdown, category: this.currentCategory })
            });
            if (!res.ok) throw new Error("Lưu thất bại");

            this.showToast("Đã lưu prompt vào thư viện!");
            await this.openSaved("saved");
        } catch (err) {
            console.error(err);
            this.showToast("Không lưu được prompt, kiểm tra server đang chạy.", "error");
        }
    },

    async loadSavedList() {
        const list = document.getElementById("saved-list");
        list.innerHTML = `<li class="entry-empty">Đang tải...</li>`;
        try {
            const res = await fetch("/api/saved");
            this.renderSavedList(await res.json());
        } catch (err) {
            console.error("Không tải được thư viện lưu trữ:", err);
            list.innerHTML = `<li class="entry-empty">Không tải được dữ liệu. Kiểm tra server đang chạy.</li>`;
        }
    },

    async loadTrashList() {
        const list = document.getElementById("trash-list");
        list.innerHTML = `<li class="entry-empty">Đang tải...</li>`;
        try {
            const res = await fetch("/api/trash");
            this.renderTrashList(await res.json());
        } catch (err) {
            console.error("Không tải được thùng rác:", err);
            list.innerHTML = `<li class="entry-empty">Không tải được dữ liệu. Kiểm tra server đang chạy.</li>`;
        }
    },

    // Khung card dùng chung cho cả 2 tab Đã lưu / Thùng rác, chỉ khác hành động đi kèm
    buildSavedCard(entry, options) {
        const item = document.createElement("li");
        item.className = "saved-card";

        const thumb = document.createElement("div");
        thumb.className = "saved-thumb";
        if (entry.hasImage) {
            const img = document.createElement("img");
            img.src = `/images/${entry.id}.jpg?t=${Date.now()}`;
            img.alt = "Ảnh minh họa";
            thumb.appendChild(img);
        } else {
            thumb.innerHTML = `<span class="thumb-placeholder">+<br>Thêm ảnh</span>`;
        }
        if (options.allowImageUpload) {
            thumb.classList.add("saved-thumb-clickable");
            thumb.title = "Bấm để thêm/thay ảnh minh họa";
            thumb.addEventListener("click", () => {
                this.pendingImageEntryId = entry.id;
                document.getElementById("saved-image-input").click();
            });
        }

        const categoryTitle = (PROMPT_STRUCTURES[entry.category] || {}).title || entry.category;
        const excerpt = entry.prompt.length > 160 ? `${entry.prompt.slice(0, 160)}…` : entry.prompt;

        const content = document.createElement("div");
        content.className = "saved-content";

        const meta = document.createElement("div");
        meta.className = "entry-meta";
        meta.innerHTML = `
            <span class="key-badge">${categoryTitle}</span>
            <span class="field-desc">${options.metaExtra || this.formatRelativeTime(entry.createdAt)}</span>
        `;

        const excerptEl = document.createElement("p");
        excerptEl.className = "entry-excerpt";
        excerptEl.textContent = excerpt;

        const actions = document.createElement("div");
        actions.className = "entry-actions";

        const copyBtn = document.createElement("button");
        copyBtn.className = "btn-secondary";
        copyBtn.textContent = "Sao chép";
        copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(entry.prompt)
                .then(() => this.showToast("Đã sao chép Prompt vào khay nhớ tạm!"))
                .catch(() => this.showToast("Có lỗi xảy ra khi sao chép", "error"));
        });
        actions.appendChild(copyBtn);
        options.buildActions(actions, entry);

        content.appendChild(meta);
        content.appendChild(excerptEl);
        content.appendChild(actions);

        item.appendChild(thumb);
        item.appendChild(content);
        return item;
    },

    renderSavedList(items) {
        const list = document.getElementById("saved-list");
        list.innerHTML = "";

        if (!items.length) {
            list.innerHTML = `<li class="entry-empty">Chưa lưu prompt nào. Bấm nút "Lưu" ở khung kết quả để thêm.</li>`;
            return;
        }

        items.forEach(entry => {
            list.appendChild(this.buildSavedCard(entry, {
                allowImageUpload: true,
                buildActions: (actions, e) => {
                    const deleteBtn = document.createElement("button");
                    deleteBtn.className = "btn-delete-key";
                    deleteBtn.innerHTML =
                `<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-trash"></use></svg> Xoá`;
                    deleteBtn.title = "Chuyển vào thùng rác";
                    deleteBtn.addEventListener("click", () => this.deleteSavedEntry(e.id));
                    actions.appendChild(deleteBtn);
                }
            }));
        });
    },

    renderTrashList(items) {
        const list = document.getElementById("trash-list");
        list.innerHTML = "";

        if (!items.length) {
            list.innerHTML = `<li class="entry-empty">Thùng rác trống. Prompt bị xoá sẽ nằm ở đây 30 ngày trước khi tự dọn.</li>`;
            return;
        }

        items.forEach(entry => {
            list.appendChild(this.buildSavedCard(entry, {
                allowImageUpload: false,
                metaExtra: `Còn ${entry.daysLeft} ngày trước khi tự xoá`,
                buildActions: (actions, e) => {
                    const restoreBtn = document.createElement("button");
                    restoreBtn.className = "btn-secondary";
                    restoreBtn.textContent = "Khôi phục";
                    restoreBtn.addEventListener("click", () => this.restoreTrashEntry(e.id));

                    const deleteBtn = document.createElement("button");
                    deleteBtn.className = "btn-delete-key";
                    deleteBtn.textContent = "Xoá vĩnh viễn";
                    deleteBtn.addEventListener("click", () => this.permanentlyDeleteEntry(e.id));

                    actions.appendChild(restoreBtn);
                    actions.appendChild(deleteBtn);
                }
            }));
        });
    },

    async deleteSavedEntry(id) {
        try {
            const res = await fetch(`/api/saved/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Xoá thất bại");
            this.showToast("Đã chuyển prompt vào thùng rác.");
            this.loadSavedList();
        } catch (err) {
            console.error(err);
            this.showToast("Không xoá được prompt này.", "error");
        }
    },

    async restoreTrashEntry(id) {
        try {
            const res = await fetch(`/api/trash/${id}/restore`, { method: "POST" });
            if (!res.ok) throw new Error("Khôi phục thất bại");
            this.showToast("Đã khôi phục prompt về thư viện.");
            this.loadTrashList();
        } catch (err) {
            console.error(err);
            this.showToast("Không khôi phục được, mục này có thể đã bị dọn tự động.", "error");
        }
    },

    async permanentlyDeleteEntry(id) {
        if (!confirm("Xoá vĩnh viễn prompt này? Hành động này không thể hoàn tác.")) return;
        try {
            const res = await fetch(`/api/trash/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Xoá thất bại");
            this.showToast("Đã xoá vĩnh viễn.");
            this.loadTrashList();
        } catch (err) {
            console.error(err);
            this.showToast("Không xoá được, mục này có thể đã bị dọn tự động.", "error");
        }
    },

    // Nén ảnh phía client trước khi tải lên: giữ nguyên tỉ lệ khung hình gốc (không crop vuông),
    // giới hạn cạnh dài nhất ~800px, xuất JPEG chất lượng vừa phải để dung lượng luôn nhỏ gọn.
    // createImageBitmap với imageOrientation "from-image" tự sửa xoay ảnh theo EXIF.
    async compressImageFile(file, maxSide = 800) {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        let { width, height } = bitmap;
        if (width > maxSide || height > maxSide) {
            const scale = maxSide / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);

        return canvas.toDataURL("image/jpeg", 0.72);
    },

    async handleImageSelected(file) {
        const entryId = this.pendingImageEntryId;
        this.pendingImageEntryId = null;
        if (!entryId || !file) return;

        try {
            const dataUrl = await this.compressImageFile(file);
            const res = await fetch(`/api/saved/${entryId}/image`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: dataUrl })
            });
            if (!res.ok) throw new Error("Upload thất bại");
            this.showToast("Đã cập nhật ảnh minh họa!");
            this.loadSavedList();
        } catch (err) {
            console.error(err);
            this.showToast("Không xử lý được ảnh này, hãy thử ảnh khác.", "error");
        }
    },

    // Tách dataURL "data:image/jpeg;base64,XXXX" thành { mimeType, base64 } để gửi lên AI đa phương thức
    parseDataUrl(dataUrl) {
        const match = /^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/.exec(dataUrl || "");
        if (!match) return null;
        return { mimeType: match[1], base64: match[2] };
    },

    // --- ẢNH THAM CHIẾU (nhóm media): kéo-thả / chọn file, nén client, KHÔNG lưu server ---
    setupReferenceImages() {
        const dropzone = document.getElementById("reference-dropzone");
        const fileInput = document.getElementById("reference-image-input");

        dropzone.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (e) => {
            this.handleReferenceFiles(e.target.files);
            e.target.value = ""; // reset để chọn lại đúng file cũ vẫn kích hoạt change
        });

        ["dragenter", "dragover"].forEach(evt => dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        }));
        ["dragleave", "drop"].forEach(evt => dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
        }));
        dropzone.addEventListener("drop", (e) => {
            if (e.dataTransfer && e.dataTransfer.files) this.handleReferenceFiles(e.dataTransfer.files);
        });
    },

    async handleReferenceFiles(fileList) {
        const files = Array.from(fileList || []).filter(f => f.type.startsWith("image/"));
        if (!files.length) return;

        const slots = this.MAX_REFERENCE_IMAGES - this.referenceImages.length;
        if (slots <= 0) {
            this.showToast(`Chỉ nhận tối đa ${this.MAX_REFERENCE_IMAGES} ảnh tham chiếu.`, "error");
            return;
        }

        for (const file of files.slice(0, slots)) {
            try {
                const dataUrl = await this.compressImageFile(file, 1024); // độ phân giải cao hơn để AI phân tích tốt
                this.referenceImages.push(dataUrl);
            } catch (err) {
                console.error(err);
                this.showToast("Không xử lý được một ảnh, hãy thử ảnh khác.", "error");
            }
        }
        if (files.length > slots) {
            this.showToast(`Đã đạt tối đa ${this.MAX_REFERENCE_IMAGES} ảnh, các ảnh dư bị bỏ qua.`, "error");
        }
        this.renderReferenceThumbs();
    },

    renderReferenceThumbs() {
        const container = document.getElementById("reference-thumbs");
        if (!container) return;
        container.innerHTML = "";

        this.referenceImages.forEach((dataUrl, index) => {
            const thumb = document.createElement("div");
            thumb.className = "reference-thumb";

            const img = document.createElement("img");
            img.src = dataUrl;
            img.alt = `Ảnh tham chiếu ${index + 1}`;

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "reference-remove";
            removeBtn.title = "Xóa ảnh này";
            removeBtn.textContent = "✕";
            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation(); // tránh mở hộp thoại chọn file của dropzone
                this.referenceImages.splice(index, 1);
                this.renderReferenceThumbs();
            });

            thumb.appendChild(img);
            thumb.appendChild(removeBtn);
            container.appendChild(thumb);
        });

        // Ẩn gợi ý "thêm ảnh" khi đã đủ số lượng tối đa
        const hint = document.querySelector("#reference-dropzone .reference-hint");
        if (hint) hint.classList.toggle("hidden", this.referenceImages.length >= this.MAX_REFERENCE_IMAGES);
    },

    // --- TỐI ƯU / SỬA LỖI PROMPT: nhờ AI phê bình & viết lại các trường hiện có ---
    async optimizePrompt() {
        if (this.isSuggesting) return;

        const provider = this.settings.provider;
        if (provider === "ollama" && location.protocol === "file:") {
            this.showToast("Không dùng được Ollama khi mở file trực tiếp. Hãy chạy ứng dụng bằng file start-app.bat!", "error");
            return;
        }
        if (provider === "gemini" && this.settings.geminiKeys.length === 0) {
            this.showToast("Bạn chưa thêm API key Gemini. Hãy thêm key trong Cài đặt!", "error");
            this.openSettings();
            return;
        }

        const categoryData = PROMPT_STRUCTURES[this.currentCategory];
        const requestedCategory = this.currentCategory;

        // Gom nội dung hiện có của từng trường
        const current = {};
        let hasAny = false;
        categoryData.fields.forEach(field => {
            const value = (document.getElementById(`field-${field.id}`).value || "").trim();
            current[field.id] = value;
            if (value) hasAny = true;
        });
        if (!hasAny) {
            this.showToast("Chưa có nội dung prompt để tối ưu. Hãy điền hoặc gợi ý trước!", "error");
            return;
        }

        const images = this.currentCategory === "media" ? this.referenceImages.slice() : [];
        const prompt = this.buildOptimizePrompt(current, categoryData, {
            architecture: this.CONTEXT_CATEGORIES.includes(this.currentCategory) ? document.getElementById("context-architecture").value : "",
            tech: this.CONTEXT_CATEGORIES.includes(this.currentCategory) ? document.getElementById("context-tech").value : "",
            hasImages: images.length > 0
        });

        this.setSuggestingState(true, "optimize");
        try {
            const rawText = provider === "gemini"
                ? await this.callGemini(prompt, images)
                : await this.callOllama(prompt, images);

            const improved = this.parseJSONSafely(rawText);
            if (!improved) throw new Error("Không đọc được dữ liệu JSON từ model");
            if (this.currentCategory !== requestedCategory) return;

            this.applySuggestions(improved, categoryData);
        } catch (err) {
            console.error("Lỗi tối ưu prompt:", err);
            const message = provider === "gemini"
                ? "Gọi Gemini thất bại trên tất cả API key. Kiểm tra key trong Cài đặt và kết nối mạng."
                : `Không kết nối được Ollama (${AI_CONFIG.ollama.model}). Kiểm tra Ollama đang chạy tại localhost:11434.`;
            this.showToast(message, "error");
        } finally {
            this.setSuggestingState(false);
        }
    },

    // Prompt yêu cầu AI phê bình & viết lại từng trường tốt hơn dựa trên nội dung hiện có
    buildOptimizePrompt(current, categoryData, extras = {}) {
        const fieldSpecs = categoryData.fields
            .map(f => `- "${f.id}" (${f.label}): ${f.desc}\n  Nội dung hiện tại: ${current[f.id] ? `"${current[f.id]}"` : "(đang để trống)"}`)
            .join("\n");

        let contextBlock = "";
        const archi = (extras.architecture || "").trim();
        const tech = (extras.tech || "").trim();
        if (archi || tech) {
            contextBlock = "\n\nNGỮ CẢNH KỸ THUẬT BỔ SUNG (bám sát khi viết lại):";
            if (archi) contextBlock += `\n- Kiến trúc ứng dụng: ${archi}`;
            if (tech) contextBlock += `\n- Công nghệ sử dụng: ${tech}`;
        }
        const imageBlock = extras.hasImages
            ? "\n\nẢNH THAM CHIẾU: Người dùng đã đính kèm ảnh tham chiếu. Đối chiếu để đảm bảo phong cách, bố cục, màu sắc và ánh sáng trong prompt khớp với ảnh."
            : "";

        return `Bạn là chuyên gia Prompt Engineering cấp cao, chuyên rà soát và nâng cấp prompt lên chất lượng sản xuất (production-grade).

NHIỆM VỤ: Rà soát prompt hiện có cho nhóm công việc "${categoryData.title}", phát hiện điểm yếu (mơ hồ, thiếu số liệu, thiếu ràng buộc, thiếu nhất quán) và VIẾT LẠI từng thành phần cho tốt hơn — giữ đúng ý định gốc, chỉ làm rõ và nâng chất.${contextBlock}${imageBlock}

CÁC THÀNH PHẦN CẦN RÀ SOÁT & VIẾT LẠI:
${fieldSpecs}

YÊU CẦU CHẤT LƯỢNG (bắt buộc tuân thủ):
1. Viết bằng tiếng Việt, mỗi thành phần 3-6 câu, giàu thông tin và đi thẳng vào trọng tâm.
2. Cụ thể hóa tối đa: dùng con số, tiêu chí đo lường được và thuật ngữ chuyên ngành chính xác. TUYỆT ĐỐI tránh từ chung chung như "chất lượng cao", "tối ưu", "đẹp".
3. Giữ đúng ý định và chủ đề gốc của người dùng — không đổi hướng. Với trường đang trống, hãy viết mới cho phù hợp và nhất quán với các trường khác.
4. Các thành phần phải bổ trợ lẫn nhau, ghép lại thành một prompt hoàn chỉnh dùng được ngay.

ĐỊNH DẠNG ĐẦU RA: Chỉ trả về DUY NHẤT một JSON object hợp lệ với đúng các khóa: ${categoryData.fields.map(f => `"${f.id}"`).join(", ")}. Giá trị là chuỗi văn bản thuần tiếng Việt. Không thêm lời giải thích, không markdown, không code fence.`;
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
