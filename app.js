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
    }
};

// --- QUẢN LÝ TRẠNG THÁI ỨNG DỤNG ---
const AppState = {
    userName: localStorage.getItem("prompt_user_name") || "",
    currentCategory: "vibe",
    isSuggesting: false,

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

    // --- MÀN HÌNH CÀI ĐẶT AI ---
    openSettings() {
        // Đồng bộ trạng thái hiện tại lên giao diện trước khi hiện
        document.querySelectorAll('input[name="ai-provider"]').forEach(radio => {
            radio.checked = radio.value === this.settings.provider;
        });
        this.renderKeyList();
        document.getElementById("settings-modal").classList.remove("hidden");
    },

    closeSettings() {
        document.getElementById("settings-modal").classList.add("hidden");
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
    },

    // --- XÂY DỰNG PROMPT CHẤT LƯỢNG CAO GỬI CHO AI ---
    buildSuggestionPrompt(idea, categoryData) {
        const fieldSpecs = categoryData.fields
            .map(f => `- "${f.id}" (${f.label}): ${f.desc} Ví dụ tham khảo: ${f.ex}`)
            .join("\n");

        return `Bạn là chuyên gia Prompt Engineering cấp cao, chuyên thiết kế prompt chất lượng sản xuất (production-grade) cho các mô hình AI.

NHIỆM VỤ: Từ ý tưởng thô của người dùng, viết nội dung CHI TIẾT và CHUYÊN NGHIỆP cho từng thành phần của một prompt thuộc nhóm công việc: "${categoryData.title}".

Ý TƯỞNG GỐC CỦA NGƯỜI DÙNG: "${idea}"

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
        const prompt = this.buildSuggestionPrompt(idea, categoryData);

        this.setSuggestingState(true);

        try {
            const rawText = provider === "gemini"
                ? await this.callGemini(prompt)
                : await this.callOllama(prompt);

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
    async callGemini(promptText) {
        const keys = this.settings.geminiKeys;
        const total = keys.length;
        let lastError = null;

        for (let attempt = 0; attempt < total; attempt++) {
            const index = (this.settings.activeKeyIndex + attempt) % total;
            try {
                const response = await fetch(AI_CONFIG.gemini.buildEndpoint(AI_CONFIG.gemini.model, keys[index]), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
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
    async callOllama(promptText) {
        const response = await fetch(AI_CONFIG.ollama.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: AI_CONFIG.ollama.model,
                prompt: promptText,
                format: "json",
                stream: false
            })
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
            this.generateMarkdownPrompt();
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
