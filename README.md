# ENJOY AI 2026 · Competition Desk

Website chấm điểm và tạo đề luyện tập **Inventions Trail** + **Battle of Stars**, chạy tĩnh trên GitHub Pages.

**Website:** https://lebinh10092003.github.io/Enjoy-AI/  
**Repository:** https://github.com/Lebinh10092003/Enjoy-AI

## Tính năng

- Quản lý đội thi Invention (4 bảng theo tài liệu luật **tiếng Việt do người dùng cung cấp**) và Battle (Tiểu học / THCS theo luật Battle).
- **Invention**: 1–20 lượt (mặc định 2), 7 nhóm nhiệm vụ; In chữ rời ENJ/YAI mỗi khối +40; Bonus +100 chỉ khi bật sau thông báo BTC; thưởng theo 0/1/2/3/4+ retry; 0 retry phải xác nhận robot hoạt động trơn tru/liên tục.
- Nhiệm vụ **không tích** = **0 điểm**, retry bỏ trống = 0. Thời gian **bắt buộc để hoàn tất**; 1–150 giây/lượt. Lưu nháp / Đã chấm / Hủy kết quả / Bỏ cuộc.
- Xếp hạng Invention cộng **mọi lượt** theo thứ tự: tổng điểm giảm dần → tổng thời gian tăng dần → tổng retry tăng dần → điểm cao nhất một lượt giảm dần. Tổng điểm 0 không được xếp hạng.
- **Battle**: 2 đội Đỏ / Xanh, Meteorite Tower (+100), Energy Defense (+10/khối, tối đa 8), Full Firepower (+15/bóng, tối đa 8), Final Fortress thắng ngay khi đủ ba điều kiện và rời khung; điểm thưởng retry và phạt lỗi 7.4.
- **Battle vòng bảng**: 3–1–0; so điểm trong trận, sau đó hoàn thành Tower khi hòa. Thống kê thắng thua, tính thắng đối đầu, điểm nhiệm vụ, số lần Tower, tổng retry. Nút tạo lịch vòng tròn tránh trùng cặp.
- **Battle loại trực tiếp**: trận có thắng ngay được xử lý ưu tiên; nếu chưa có thắng ngay sẽ phân định lần lượt điểm trận → điểm Full Firepower → Tower → retry; nếu vẫn hòa yêu cầu trận phân định.
- **Random Invention**: mỗi đề luôn có 7 mô hình nhiệm vụ chính và 3 vật cản; tùy chọn Bonus chỉ khi BTC công bố. Mô hình đặt tại khung A–J không trùng nhau; vật cản đặt riêng tại 3/9 ô chữ nhật nhỏ O1–O9, theo dấu trên ảnh sa bàn do người dùng cung cấp. Mũi tên chỉ hướng tiếp cận theo đường dẫn; seed tái lập kết quả; lưu đề / sao chép / xuất JSON / in.
- Tự động lưu trên localStorage; nhập/xuất JSON; xuất danh sách và bảng xếp hạng CSV (UTF-8 BOM hỗ trợ Excel); giao diện responsive laptop/điện thoại; không cần server.

## Quy tắc quan trọng

### Inventions Trail

| Nhiệm vụ | Điểm |
| --- | ---: |
| La bàn | 50 |
| Làm giấy | 60 |
| Thuốc súng | 40 |
| In chữ rời ENJ | 40 |
| In chữ rời YAI | 40 |
| Máy đo địa chấn | 40 |
| Kim tự tháp | 60 |
| Vạn Lý Trường Thành | 60 |
| Thưởng không chạy lại, liên tục | 40 |
| Bonus BTC (nếu công bố) | 100 |

Tối đa **430** không có Bonus, **530** có Bonus. Robot 0 retry nhưng không liên tục/trơn tru **không tự động được 40 điểm**.

### Battle of Stars

Với mỗi đội:

- Meteorite Tower +100 nếu hợp lệ (thực hiện **tự động**).
- Energy Defense +10/khối, tối đa 8 khối.
- Full Firepower +15/bóng vào hộp, tối đa 8 bóng. Cần nhập **4 ô hộp** để có thể đối chiếu điều kiện thắng ngay.
- Điều kiện **thắng ngay**: hoàn thành Tower **và** có ít nhất 5 khối phòng thủ **và** có ít nhất 2 hộp, *mỗi hộp* chứa ít nhất 2 bóng của đội; sau đó robot lấy bóng vàng rời hẳn khung.
- Thưởng số lần retry: không retry và liên tục +40; 1/2/3 lần +30/+20/+10, từ 4 lần 0.
- Mỗi vi phạm Điều 7.4 trừ 10 điểm **và** tính một retry. Ô "Retry" là **tổng**, bao gồm retry do vi phạm; ô "Vi phạm" được trừ riêng 10 điểm theo luật.
- Không tự động công nhận 2 đội cùng thắng ngay. Trận loại trực tiếp chưa phân định bằng bốn tiêu chí **phải đá/thi đấu thêm**.

## Giới hạn quan trọng

**Đây là ứng dụng trợ giúp, không phải phần mềm chấm thi được BTC phê duyệt.**

1. Luật quốc tế Invention (tiếng Anh) có mô tả 3 nhóm, còn bản luật Việt ngữ người dùng cung cấp có **4 bảng lớp**. Phần mềm sử dụng **4 bảng theo tài liệu Việt ngữ**; BTC có thể áp dụng phân nhóm khác tại một giải cụ thể.
2. Luật Invention quy định thay đổi vị trí/hướng mô hình theo thông báo BTC, **không** xác định số nhiệm vụ/độ khó bắt buộc theo từng lớp. Các cấp độ random và vị trí A–J trong phần mềm là **mẫu luyện tập**, **không phải sơ đồ được xác nhận để bố trí sa bàn thật**. Mô hình còn phụ thuộc khung đặt, hướng lắp và vật cản thực tế.
3. Bonus Invention chỉ bật khi BTC thông báo. Trọng tài phải xác nhận trạng thái hợp lệ theo luật (mô hình hư hỏng, can thiệp, khiếu nại...).
4. GitHub Pages chỉ lưu trên **trình duyệt hiện tại**, không tự chia sẻ điểm giữa các máy. Không sử dụng nhiều máy cùng chấm chính thức khi chưa bổ sung backend, đồng bộ và phân quyền. JSON là bản sao lưu **thủ công**.
5. Trong mọi trường hợp, **bản luật/điều chỉnh của BTC hiện hành và Trọng tài trưởng** quyết định cuối cùng.

## Nguồn

- Luật **ENJOY AI 2026: Thử thách Sáng chế** (13 trang), phiếu điểm (1 trang), luật **ENJOY AI 2026 Inventions Trail** tiếng Anh (16 trang), ảnh sa bàn: tài liệu do người dùng cung cấp.
- [ENJOY AI Global — 2026 Season](https://www.enjoyaiglobal.org/resources)
- [Battle of Stars 2026 — Luật chi tiết](https://www.enjoyaigreece.gr/en/enjoy-ai-2026-battle-of-stars/)
- [Battle of Stars — PDF tiếng Anh](https://www.enjoyaigreece.gr/wp-content/uploads/2026/02/ENJOY-AI-Battle-of-Stars.pdf)
- [Inventions Trail — Luật chi tiết](https://www.enjoyaigreece.gr/en/enjoy-ai-2026-inventions-trail/)

## Triển khai GitHub Pages

Website thuần HTML/CSS/JavaScript, không có bước build. Nếu chưa bật Pages, vào **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**. Chờ workflow \`pages build and deployment\` thành công rồi mở link website ở đầu README.

### Kiểm thử

\`\`\`sh
node --test tests/core.test.mjs
node --check app.mjs
node --check core.mjs
\`\`\`

GitHub Actions tự kiểm thử với Node.js 22 khi push vào main.
## V+ STEAM LAB · Bản nâng cấp

- Đây là **hệ thống luyện tập random đề và chấm điểm ENJOY AI 2026 của V+ STEAM LAB**, không phải sản phẩm chính thức do ENJOY AI phát hành. Logo V+ sử dụng trực tiếp từ website chính thức `https://stemrobotics.io.vn/static/frontend/brand-logo.png`.
- Menu **Đội Invention** và **Đội Battle** được tách riêng; có mã đội, trường, bảng thi, nhóm Battle, hai học sinh, huấn luyện viên và ghi chú. Dữ liệu cũ vẫn đọc được và có thể bổ sung trường thiếu khi sửa.
- Phần Random dùng **ảnh sa bàn 2026 người dùng cung cấp**, với 10 khung được đánh dấu A–J, vị trí tương đối theo ảnh 2048×1137. Ảnh mặc định được tải từ bản sao trực tuyến, có thể thay bằng ảnh do người quản lý tải lên.
- Ảnh minh họa từng mô hình từ [ENJOY AI Greece – Inventions Trail 2026](https://www.enjoyaigreece.gr/en/enjoy-ai-2026-inventions-trail/) là chính các hình mô hình trong bộ luật, được crop bằng CSS để dễ quan sát. Nếu ảnh nguồn thay đổi, cần đưa asset về máy chủ riêng để bảo đảm ổn định.
- Công cụ không còn chọn ngẫu nhiên 0°/90°/180°/270° cho mọi nhiệm vụ. **Hướng tiếp cận** là kết quả lọc theo vị trí, đường dẫn và loại khung: các khung chéo được hạn chế với mô hình nhỏ; khung thường chọn hướng tiếp cận theo đường dẫn. Bộ sinh có backtracking để tránh dùng một khung hai lần.
- **Cảnh báo về tính khả thi:** hướng tiếp cận về hình học chưa chứng minh cơ cấu nhiệm vụ thật ở từng vị trí có thể thao tác thành công. Cần thử nghiệm với robot, mô hình và sa bàn thật, rồi hiệu chỉnh `APPROACH_RULES` trong `placement.mjs` trước khi coi là đề đã xác thực.
- Với dữ liệu được sử dụng tại một sự kiện thi đấu, BTC và trọng tài vẫn quyết định hiệu lực đề, điểm số và các ngoại lệ theo điều lệ hiện hành.

## Chốt số lượng sa bàn (11/10/2026)

- **7 nhiệm vụ Invention chính** xuất hiện trong **mọi đề**: La bàn, Làm giấy, Thuốc súng, In chữ rời, Máy đo địa chấn, Kim tự tháp, Vạn Lý Trường Thành. Nhiệm vụ In chữ rời có hai đối tượng chấm điểm ENJ/YAI nhưng chỉ là **một mô hình cần đặt**.
- **3 vật cản** được chọn ngẫu nhiên trong **9 vị trí hình chữ nhật nhỏ O1–O9** đánh dấu trên ảnh đã cung cấp, **không** dùng các khung mô hình nhiệm vụ A–J.
- Các cấp độ luyện tập hiện **không thay đổi số lượng** nhiệm vụ/vật cản. Những điều kiện khác theo cấp độ phải căn cứ điều chỉnh BTC; không tự đặt tiêu chí ngoài tài liệu.
- Các đề đã tạo ở phiên bản cũ được bảo tồn và được cảnh báo khi mở, không tính là đề theo chuẩn mới. Bấm **Tạo đề mới** để có đủ 7+3.
