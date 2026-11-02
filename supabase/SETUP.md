# Cloud database cho ENJOY AI (Supabase PostgreSQL)

## 1. Khởi tạo
1. Tạo dự án tại https://supabase.com/dashboard và sao lưu thông tin truy cập an toàn.
2. Trong SQL Editor, thực thi toàn bộ `supabase/schema.sql` đúng một lần.
3. Tại Authentication > Users, tạo/invite tài khoản có mật khẩu cho từng trọng tài. Tắt đăng ký tự do nếu dùng cho giải thật.
4. Sau khi tài khoản xuất hiện, trong SQL Editor chạy mẫu lệnh `insert ... competition_members` ở cuối file SQL. Quyền `admin` và `referee` được ghi điểm, quyền `viewer` chỉ đọc.
5. Trong Project Settings > API Keys, sao chép **publishable key / anon key** và Project URL vào `cloud-config.mjs`. Tuyệt đối không đưa **secret key/service_role** vào mã nguồn công khai.

## 2. Sử dụng
- Mở website GitHub Pages, vào **Dữ liệu & cài đặt > Cloud**, đăng nhập bằng tài khoản Supabase đã cấp quyền.
- Ứng dụng sẽ tải dữ liệu từ Cloud; dữ liệu cục bộ khác biệt được tự động giữ lại tại bản sao `*-precloud-migration` trên trình duyệt và có nút tải JSON.
- Mọi thao tác chấm sau đăng nhập tự đồng bộ. Trạng thái **Đã đồng bộ / Chờ lưu / Lỗi / Xung đột** hiển thị rõ trên giao diện.
- Nếu hai thiết bị thay đổi cùng một phiên bản, thiết bị cập nhật sau sẽ báo **xung đột**, không âm thầm ghi đè. Xuất JSON và đối soát trước khi tải lại Cloud.
- Muốn chuyển dữ liệu cũ lên Cloud, tải JSON từ bản cục bộ, đăng nhập Cloud, dùng chức năng **Nhập JSON** (yêu cầu xác nhận). Chỉ thực hiện khi đã thống nhất nguồn dữ liệu chính và được cấp quyền ghi.
- Dùng Sao lưu JSON thường xuyên; tính năng lưu Cloud không thay thế backup độc lập.

## 3. Giới hạn của bản tích hợp
- Snapshot JSON trong một bản ghi phù hợp một giải quy mô vừa và phát triển ít xâm lấn tới mã hiện có. Chưa hỗ trợ phân tách bảng chấm theo lượt, không có merge tự động khi nhiều người chấm đồng thời.
- Các khoản điểm được tính trong trình duyệt và SQL hiện mới xác thực cấu trúc cơ bản. **Không dùng để chấm giải chính thức** trước khi bổ sung server-side score validation, khóa phiếu chấm, và quy trình duyệt kết quả.
- Bản ghi audit chỉ có người thao tác, revision, thời điểm và số lượng bản ghi; chưa ghi diff từng trường.
- Ảnh sa bàn nhúng base64 làm tăng dung lượng snapshot. Nên chuyển ảnh sang Supabase Storage khi triển khai nhiều ảnh lớn.
- Không dùng Supabase như nơi chia sẻ dữ liệu công khai chứa tên học sinh nếu chưa làm cơ chế ẩn thông tin phù hợp.
