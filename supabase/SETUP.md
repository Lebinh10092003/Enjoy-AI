# Enjoy-AI — cấu hình Supabase PostgreSQL (02/11/2026)

## Kiểm tra thực tế ngày 02/11/2026
- Project **Enjoy-AI** đang ở trạng thái **ACTIVE_HEALTHY**.
- Truy vấn trực tiếp Supabase cho thấy **0 user** ở `auth.users`, **0 thành viên** ở `competition_members`, dữ liệu workspace `main` ở revision **0** và chưa có đội. Vì vậy website hiển thị **Cloud · Chưa đăng nhập** là đúng; chưa có tài khoản để đăng nhập. Kết nối Supabase với ChatGPT không thay thế việc tạo tài khoản của web.
- **Không cần chạy lại schema.sql, không cần project mới.**
- Người quản trị chủ động tạo tài khoản trong [Authentication → Users](https://supabase.com/dashboard/project/oooiaqnzqcvodjuwnagh/auth/users), chọn **Add user → Create new user** (hoặc **Send invitation** nếu muốn người được mời tự thiết lập mật khẩu). Các email/lời mời chỉ được gửi khi quản trị viên chủ động thực hiện trên Supabase.
- Trong web, vào **Dữ liệu & cài đặt → Database Cloud**; điền email đã tạo, chọn vai trò, bấm **Sao chép SQL cấp quyền**; kiểm tra nội dung và chạy trong [SQL Editor](https://supabase.com/dashboard/project/oooiaqnzqcvodjuwnagh/sql/new). Sau đó đăng nhập trên website.
- Để khởi tạo quản trị, chọn **admin** cho đúng tài khoản của mình. Chỉ cấp **referee** hoặc **viewer** cho tài khoản khác; không dùng chung thông tin đăng nhập.
- **Trước lần đăng nhập đầu tiên**, xuất JSON để giữ dữ liệu đang lưu trên máy; website có tự sao lưu cục bộ trước khi thay thế bởi Cloud nhưng vẫn nên lưu một bản JSON độc lập.
- Nút **Kiểm tra kết nối Auth** chỉ xác minh khả năng truy cập dịch vụ Auth; không xác nhận tài khoản có tồn tại hoặc được phân quyền.
- Sau khi tạo và cấp quyền thành công, kiểm tra `Cloud · Đã lưu`. Không nhập ngược JSON cũ nếu không chắc Cloud chưa có dữ liệu mới.

## Trạng thái đã triển khai
- **Project**: Enjoy-AI / `oooiaqnzqcvodjuwnagh`, Singapore.
- **Project URL**: `https://oooiaqnzqcvodjuwnagh.supabase.co`
- **Database**: PostgreSQL 17, trạng thái ACTIVE_HEALTHY khi thiết lập.
- **Migration**: `enjoy_ai_competition_cloud_v1`, đã thực thi thành công.
- **Bảng**: `public.competition_members`, `public.competition_state`, `app_private.competition_audit`.
- **Dữ liệu khởi tạo**: workspace `main`, revision `0`, các danh sách trống.
- **Frontend**: `cloud-config.mjs` chứa URL và **publishable key**. Đây là key công khai được phép sử dụng trên GitHub Pages; không chứa service_role hay secret.
- **Chưa có tài khoản chấm**: không tự tạo tài khoản hoặc mật khẩu thay người dùng.

## Cấp quyền để bắt đầu
1. Mở [Authentication > Users](https://supabase.com/dashboard/project/oooiaqnzqcvodjuwnagh/auth/users). Chọn **Add user** (hoặc Invite user) để thêm tài khoản quản trị/trọng tài riêng. Dùng email thực và mật khẩu đủ mạnh; không dùng chung tài khoản.
2. Mở [SQL Editor](https://supabase.com/dashboard/project/oooiaqnzqcvodjuwnagh/sql/new) và chạy SQL sau (đổi email mẫu thành email tài khoản vừa tạo):

```sql
insert into public.competition_members (user_id, role)
select id, 'admin' from auth.users where email = 'admin@example.com'
on conflict (user_id) do update set role = excluded.role;
```

Dùng `'referee'` cho trọng tài hoặc `'viewer'` cho người chỉ xem. **Không** cho đăng ký người dùng tự do để tránh phát sinh tài khoản ngoài dự kiến (Auth > Providers > Email).

3. Mở website, vào **Dữ liệu & cài đặt > Database Cloud** để đăng nhập. Chỉ thành viên có quyền mới được tải dữ liệu; `admin/referee` được ghi, `viewer` chỉ đọc.

## Chuyển dữ liệu hiện có
Trước khi đăng nhập Cloud, dùng **Xuất dữ liệu JSON** để sao lưu dữ liệu `localStorage` đang có. Cloud mới ban đầu trống. Sau khi đăng nhập, nhập lại JSON trên website (thay thế dữ liệu Cloud sau xác nhận) để chuyển số liệu hiện có sang database. Sau khi lưu, kiểm tra trạng thái **Cloud · Đã lưu** và so đối chiếu số đội/lượt.

## Xung đột và bảo vệ dữ liệu
- Client ghi snapshot JSON, sử dụng revision theo điều kiện update (optimistic concurrency). Nếu có trọng tài khác đã ghi, sẽ báo **XUNG ĐỘT**; phải xuất JSON và đối soát, không được tự ghi đè.
- Cloud lưu một bản dữ liệu tổng hợp, phù hợp giai đoạn MVP. Chưa hỗ trợ merge tự động ở cấp từng lượt chấm; cần tách bảng cho giải thi nhiều trọng tài.
- Lần thử lại trừ 10 điểm (0/1/2/3/4+ tương ứng 40/30/20/10/0), lượt chấm mới mặc định tích sẵn robot chạy liên tục. Trọng tài bỏ tích khi robot không đạt; bản ghi cũ không tự đổi điểm.
- Luôn sao lưu JSON định kỳ. Chỉ cấp quyền cho người thực sự cần xem dữ liệu học sinh.
- Schema SQL đã triển khai; `schema.sql` dùng để tái tạo trong một dự án *mới*, không chạy lại vào dự án này.

## Phạm vi bảo mật
- RLS bật trên toàn bộ bảng. Bảng audit ở schema private, không cung cấp qua REST API. Trigger cập nhật revision, thời gian và nhật ký.
- Không sử dụng hay commit service_role/secret key.
- Chưa có xác thực nghiệp vụ điểm số hoàn chỉnh phía server; chưa đủ để sử dụng như hệ thống chấm thi chính thức của BTC.
