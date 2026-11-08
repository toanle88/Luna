# Luna — Hướng dẫn chạy source code

Đây là source của bản Luna v7 đã tạo trong cuộc trò chuyện, gồm chế độ tự động/thủ công, tiếng Việt/Anh, biểu đồ chu kỳ, PWA và nhập/xuất JSON.

## 1. Chuẩn bị

- Cài Node.js phiên bản 22.13.0 trở lên.
- Cài pnpm đúng phiên bản của dự án:

```bash
npm install -g pnpm@11.25.0
```

## 2. Chạy để phát triển

Giải nén ZIP. Mở Terminal trong thư mục `luna-source` chứa `package.json` rồi chạy:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Mở địa chỉ mà Terminal in ra (mặc định `http://localhost:5173`). Dự án không cần tài khoản ChatGPT hay API key để sử dụng các tính năng theo dõi chu kỳ trên máy.

## 3. Build và kiểm tra bản PWA

```bash
pnpm build
node scripts/generate-pwa.mjs
node scripts/validate-pwa.mjs
pnpm start
```

Mở địa chỉ localhost được Terminal in ra. Bước `generate-pwa.mjs` tạo danh sách tài nguyên ngoại tuyến từ bản build mới. Khi đưa ứng dụng lên hosting riêng, dùng HTTPS để các tính năng PWA hoạt động.

Lệnh `pnpm start` chạy Worker đã build trên máy qua Wrangler. Để kiểm tra ngoại tuyến, mở ứng dụng một lần khi có mạng và chờ trạng thái sẵn sàng trong phần Cài ứng dụng. Khi cài trên iPhone, dùng hướng dẫn trong ứng dụng.

## 4. Chạy kiểm tra

```bash
pnpm exec tsc --noEmit
node --test tests/cycle.test.mjs tests/backup.test.mjs tests/pwa.test.mjs
```

Source này đã qua build và 45 kiểm tra. Chưa xác minh thao tác cài PWA trực tiếp trên thiết bị thật.

## 5. Các file quan trọng

- `app/page.tsx`: màn hình và tương tác.
- `app/globals.css`: giao diện.
- `lib/cycle.ts`: chu kỳ, chế độ tự động và dự đoán giai đoạn.
- `lib/i18n.ts`: tiếng Việt và tiếng Anh.
- `lib/backup.ts`: nhập/xuất bản sao lưu.
- `components/cycle-chart.tsx`: biểu đồ chu kỳ.
- `lib/use-pwa.ts`, `public/sw.js`, `public/manifest.webmanifest`: PWA.
- `tests/`: các kiểm tra.
- `README.md`: tài liệu kỹ thuật gốc của starter.

## 6. Dữ liệu và hosting

Dữ liệu kỳ kinh nằm trong localStorage của trình duyệt, không nằm trong source ZIP. Để chuyển dữ liệu từ trang đang dùng sang bản chạy trên máy: vào **Cài đặt → Sao lưu & khôi phục → Xuất file JSON**, rồi dùng **Nhập bản sao lưu** trên bản mới. Mỗi tên miền/cổng localhost có vùng lưu riêng.

`.openai/hosting.json` giữ cấu hình dự án Sites hiện tại để tham chiếu. Chạy dev hoặc build trên máy không tự xuất bản lên trang đang dùng. ZIP không chứa `.git`, `node_modules`, thư mục runtime hay thông tin xác thực phiên làm việc.

Chế độ tự động dùng trung bình tối đa 6 khoảng chu kỳ hợp lệ gần nhất. Khi thiếu dữ liệu, dùng 28 ngày chu kỳ và 5 ngày hành kinh. Ngày kết thúc tự dự đoán không được dùng làm dữ liệu thực tế để học lại thời lượng hành kinh. Các dự đoán giai đoạn chỉ để tham khảo, không dùng để tránh thai.
