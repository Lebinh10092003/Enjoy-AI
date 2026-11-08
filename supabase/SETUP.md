# Enjoy-AI — cấu hình Supabase PostgreSQL (08/11/2026)

## Kiểm tra thực tế ngày 02/11/2026
- Project **Enjoy-AI** đang ở trạng thái **ACTIVE_HEALTHY**.
- Trạng thái hiện tại: `competition_members` có **0 thành viên**, `competition_events` có **1 đợt mặc định** (`main`), `competition_state` giữ nguyên dữ liệu của đợt này ở revision **0**. Chưa có tài khoản được cấp quyền chấm; Cloud chỉ đăng nhập được sau khi tạo Auth user và thêm thành viên. Kết nối Supabase với ChatGPT không thay thế tài khoản của website.
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
- **Migrations**: `enjoy_ai_competition_cloud_v1`, `competition_event_management_v1`, `competition_event_metadata_indexes_v1` đã thực thi thành công.
- **Bảng**: `public.competition_members`, `public.competition_events`, `public.competition_state`, `app_private.competition_audit`.
- **Dữ liệu khởi tạo**: sự kiện `main` (Đợt thi hiện tại) được giữ nguyên; mỗi đợt mới có một dòng `competition_events` và một snapshot `competition_state` riêng.
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
4. Sau khi đăng nhập, dùng bộ chọn **Đợt thi** trên thanh đầu trang. Chỉ `admin` thấy và sử dụng được nút **Đợt thi mới**; `referee` được chuyển đợt và chấm điểm; `viewer` chỉ xem.

## Quản lý nhiều đợt thi
- Mỗi đợt thi có mã, tên, mùa giải/năm, ngày tổ chức, địa điểm và một snapshot dữ liệu độc lập. Danh sách đội, lượt Invention, trận Battle, đề Random, cấu hình Bonus và bảng xếp hạng không dùng chung giữa các đợt.
- Đợt `main` hiện tại được ánh xạ thành **Đợt thi hiện tại**; migration không xóa hoặc khởi tạo lại dữ liệu của đợt này.
- Tạo đợt Cloud dùng RPC `create_competition_event` trong transaction, chỉ tài khoản `admin` được gọi. Function chạy `SECURITY INVOKER`; quyền `INSERT` được kiểm soát đồng thời bằng GRANT và RLS, không dùng service-role key hoặc function `SECURITY DEFINER`.
- `competition_events` được bật RLS, chỉ thành viên đọc; chỉ Admin tạo. `competition_state` chỉ Admin tạo; Admin/Referee ghi vào đợt đang hoạt động; Viewer chỉ đọc. Đợt lưu trữ (nếu được chuyển trạng thái bằng thao tác quản trị DB) không nhận điểm mới.
- Chế độ local cũng hỗ trợ nhiều đợt, lưu tách biệt theo từng trình duyệt. Khi chưa đăng nhập Cloud, dữ liệu local không tự đồng bộ sang máy khác.

## Chuyển dữ liệu hiện có
Trước khi đăng nhập Cloud, dùng **Xuất dữ liệu JSON** để sao lưu dữ liệu local hiện có. Đợt `main` trên Cloud giữ nguyên dữ liệu đã có. Sau khi đăng nhập, nếu cần chuyển dữ liệu từ local, chọn đúng đợt rồi nhập JSON vào đợt đang mở (thao tác sẽ thay thế snapshot của đợt đó sau khi xác nhận). Xuất JSON chỉ xuất đợt đang chọn. Sau khi lưu, kiểm tra trạng thái **Cloud · Đã lưu** và đối chiếu số đội/lượt.

## Xung đột và bảo vệ dữ liệu
- Client ghi snapshot JSON, sử dụng revision theo điều kiện update (optimistic concurrency). Nếu có trọng tài khác đã ghi, sẽ báo **XUNG ĐỘT**; phải xuất JSON và đối soát, không được tự ghi đè.
- Mỗi đợt Cloud lưu một snapshot riêng và có revision riêng. Chưa hỗ trợ merge tự động ở cấp từng lượt chấm trong cùng một đợt; khi hai trọng tài ghi đồng thời, hệ thống báo xung đột và yêu cầu đối soát.
- Lần thử lại trừ 10 điểm (0/1/2/3/4+ tương ứng 40/30/20/10/0), lượt chấm mới mặc định tích sẵn robot chạy liên tục. Trọng tài bỏ tích khi robot không đạt; bản ghi cũ không tự đổi điểm.
- Luôn sao lưu JSON định kỳ. Chỉ cấp quyền cho người thực sự cần xem dữ liệu học sinh.
- Schema SQL đã triển khai; `schema.sql` dùng để tái tạo trong một dự án *mới*, không chạy lại vào dự án này.

## Phạm vi bảo mật
- RLS bật trên toàn bộ bảng. Bảng audit ở schema private, không cung cấp qua REST API. Trigger cập nhật revision, thời gian và nhật ký.
- Không sử dụng hay commit service_role/secret key.
- Chưa có xác thực nghiệp vụ điểm số hoàn chỉnh phía server; chưa đủ để sử dụng như hệ thống chấm thi chính thức của BTC.
