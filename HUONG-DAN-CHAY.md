# Luna — Hướng dẫn chạy và đóng góp

Source hiện được quản lý theo phiên bản SemVer, bắt đầu từ `0.1.0`. Tên “v7” trước đây chỉ là số bản
chụp của trang đã tạo, không phải phiên bản phát hành hiện tại.

## Chạy trên máy

Cần Node.js 22.13 trở lên trong nhánh 22.x hoặc Node.js 24.x, và pnpm 11.25.0.

```bash
git clone https://github.com/toanle88/Luna.git
cd Luna
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Mở địa chỉ Terminal in ra, thông thường là `http://localhost:5173`.

## Kiểm tra và build

```bash
pnpm format
pnpm check
pnpm build
pnpm start
```

- `pnpm check` chạy kiểm tra định dạng, ESLint, TypeScript, test và liên kết tài liệu.
- `pnpm build` tự tạo và kiểm tra tài nguyên PWA; không cần chạy thêm bước tạo PWA riêng.
- `pnpm start` chạy bản build qua Wrangler trên máy. Mở địa chỉ được in trong Terminal.

Để thử PWA, mở bản production một lần khi có mạng, chờ trạng thái sẵn sàng ngoại tuyến rồi làm theo
hướng dẫn cài trong ứng dụng. Khi triển khai trên hosting khác, cần HTTPS và môi trường tương thích
Cloudflare Workers.

## Dữ liệu của bạn

Dữ liệu nằm trong localStorage của trình duyệt và không nằm trong source. Để chuyển sang trình duyệt
hoặc tên miền khác, dùng **Cài đặt → Sao lưu & khôi phục → Xuất file JSON**, rồi nhập file ở bản
mới.

Chế độ tự động tính trung bình tối đa 6 khoảng chu kỳ hợp lệ gần nhất. Khi thiếu dữ liệu, dùng 28
ngày chu kỳ và 5 ngày hành kinh. Ngày kết thúc tự dự đoán không được dùng để học lại số ngày hành
kinh. Các dự đoán chỉ để tham khảo, không dùng để tránh thai.

## Đóng góp và phiên bản

Xem [CONTRIBUTING.md](CONTRIBUTING.md), [quy chuẩn code](docs/CODING_STANDARD.md) và
[quy trình phát hành](docs/RELEASING.md). Tạo nhánh riêng, mở pull request và chờ CI đạt trước khi
merge. Không đưa dữ liệu kỳ kinh thật vào issue, test hoặc ảnh chụp công khai.

Bản PWA vẫn cần kiểm tra trực tiếp trên trình duyệt và thiết bị; kiểm tra tự động không thay thế
bước này.
