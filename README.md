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

## Sửa lỗi nút Random (11/10/2026)

- **Tạo đề ngẫu nhiên mới** luôn dùng một seed mới; không tự điền seed vừa tạo vào ô nhập như trước (đây là nguyên nhân hai lần bấm trước đây cho cùng một bố trí).
- **Tạo lại theo seed** là thao tác riêng. Chỉ khi người dùng nhập seed, hệ thống mới phát lại cùng bố trí.
- Nếu đề vừa random trùng với bố trí đang xem, công cụ thử seed mới trước khi lưu.
- Kiểm thử giao diện xác minh nút random bấm liên tiếp đổi bố trí và seed cố định tái lập được cả 7 nhiệm vụ và 3 vật cản.

## Trải nghiệm random không nhảy trang

- Trước đây hàm thông báo sau random tự cuộn về đầu trang và `render()` xây dựng lại toàn bộ màn hình.
- Nay nút **Tạo đề ngẫu nhiên mới** chỉ cập nhật vùng kết quả; trạng thái thành công/lỗi hiển thị ngay dưới các nút thay vì chuyển người xem lên đầu trang.
- Giữ nguyên các phần tử điều khiển và ảnh nền sa bàn; thay marker nhiệm vụ/vật cản mà không tải lại ảnh nền.
- Bổ sung nút **Random lại** ở đầu khung sa bàn để tạo một bố trí mới ngay khi đang xem kết quả.
- Chọn đề đã lưu và xóa đề cũng cập nhật vùng kết quả tại chỗ. Kiểm thử tự động bảo đảm không gọi cuộn lên đầu trang và không phá hủy phần tử ảnh nền.

## Chế độ đảo Tường Thành (V+ STEAM LAB)

Phần **Random đề Invention** có trường **Vạn Lý Trường Thành – hướng lắp** với ba lựa chọn:

- **Không đảo (mặc định)**: mô hình Tường Thành ở hướng lắp mặc định của công cụ.
- **Luôn đảo Tường Thành 180°**: xoay riêng mô hình Tường Thành 180° quanh tâm mô hình trong mô phỏng.
- **Random đảo / không đảo**: với mỗi seed, dùng một bộ RNG độc lập để chọn một trong hai trạng thái.

**Không thay đổi** vị trí nhiệm vụ Tường Thành, hướng robot tiếp cận Tường Thành, vị trí/góc của sáu nhiệm vụ khác hoặc ba vật cản khi giữ cùng seed. Chế độ được lưu vào đề và bản sao lưu JSON và mô tả khi sao chép đề. Khi mở lại đề, bộ chọn trở về chế độ của đề đó.

Trong dữ liệu `layout.version = 3`: `layout.wallMode` là một trong `normal/reversed/random`; riêng nhiệm vụ `wall` có `reversed: boolean`, `modelRotation: 0 | 180`. Dữ liệu cũ thiếu các trường này được coi là **không đảo**, không bị sửa/xóa.

**Giới hạn:** đây là tùy chọn luyện tập do V+ thiết kế, không có quy định đảo 180° riêng trong luật ENJOY AI 2026. Robot và mô hình thật phải được kiểm tra về mặt thao tác trước khi dùng cách lắp đảo ở buổi thi chính thức.

Đề xuất phát triển tiếp: bản đồ tọa độ được hiệu chuẩn theo khung sa bàn, danh sách hướng lắp được kiểm nghiệm theo từng ô, tài nguyên hình ảnh lưu trong repo (không phụ thuộc website khác), và đồng bộ dữ liệu có phân quyền trọng tài.


## Nâng cấp quản lý thi — 12/10/2026

### 1. Xác minh vị trí và hướng mô hình Invention

- Mỗi nhiệm vụ trong danh sách phân bố có nút **Xác nhận đã thử** để giáo viên chỉ đánh dấu khi đã kiểm tra trên mô hình/sa bàn và robot thật.
- Dữ liệu xác nhận lưu tại \`placementApprovals\` trong cùng bản sao lưu JSON; phân biệt nhiệm vụ, khung A–J, hướng robot tiếp cận và trạng thái đảo Tường Thành.
- Bật **Chỉ dùng vị trí/hướng đã xác nhận trên sa bàn thật** để random từ các cấu hình đã được đánh dấu. Thiếu cấu hình sẽ **báo lỗi, không tự chuyển sang hướng chưa xác minh**.
- Chế độ thường vẫn tạo đề **luyện tập/mô phỏng**, tuyệt đối không được ngầm xem như đề chính thức. Tính hợp lệ của BTC là một việc khác với xác nhận thao tác thực tế.
- Khi đảo Great Wall 180° phải xác nhận riêng cho cấu hình đảo, không dùng lại xác nhận không đảo.

### 2. Nhập đội hàng loạt CSV / JSON

- Tại **Đội Invention** hoặc **Đội Battle**, mở phần **Nhập danh sách đội hàng loạt**; tải CSV, dán CSV hoặc JSON (mảng đối tượng / đối tượng \`{"teams":[...]}\`).
- Có **Sao chép mẫu CSV** và **Sao chép mẫu JSON**; mẫu được điền vào vùng nhập để dễ chỉnh sửa.
- Cột chuẩn: \`code,name,school,division,group,member1,member2,coach,note,type\`. CSV chấp nhận dấu phẩy, chấm phẩy hoặc tab, UTF-8 BOM, ô có dấu ngoặc kép/dấu xuống dòng.
- Các mã bảng: Invention \`p13\`, \`p46\`, \`m79\`, \`h1012\`; Battle \`primary\`, \`middle\`. Mỗi lần nhập tối đa 500 đội.
- Bấm **Kiểm tra danh sách** trước khi **Nhập đội hợp lệ**. Có dòng lỗi thì không được nhập; tên/mã đội trùng được bỏ qua. Dữ liệu đội và điểm số cũ **không bị ghi đè**.
- Đội Battle được nhập riêng; không trộn dữ liệu đội Battle sang Invention hoặc ngược lại. Tài liệu mẫu dùng dữ liệu giả, phải thay trước khi nhập.

### 3. Thời gian thập phân

- Thời gian Invention tối đa 150 giây và Battle tối đa 180 giây. Nhập \`13.5\`, \`13,5\`, \`13,5s\` hoặc \`13,5 giây\` đều lưu là **13.5** (giây), không làm tròn xuống 13.
- Hỗ trợ tối đa 3 chữ số thập phân. Thời gian trên bảng xếp hạng hiển thị theo định dạng Việt Nam (VD \`13,5\`).
- Dữ liệu thời gian cũ là số nguyên vẫn được đọc bình thường.

### 4. Bảng xếp hạng và giao diện

- Invention: tab **Tổng quan** và 4 bảng lớp; Battle: **Tổng quan**, Tiểu học, THCS. Hạng được tính độc lập trong từng bảng/nhóm, không xếp hạng chéo cấp lớp.
- Có thống kê, Top 3, bảng tiến độ từng lượt/trận, xuất CSV theo tab đang xem và danh sách thi đấu loại trực tiếp Battle.
- Giao diện mới sử dụng \`vplus-experience.css\`: thẻ kết quả, màu xanh V+, khoảng trắng, trạng thái, tab ngang trên di động, chuyển động ngắn và \`prefers-reduced-motion\`. Không dùng thư viện UI nặng.
- Toàn bộ dữ liệu vẫn chỉ lưu ở trình duyệt hiện tại; muốn sử dụng chính thức nhiều trọng tài đồng thời cần backend có đồng bộ, phân quyền, kiểm toán thao tác.

### Kiểm thử

\`\`\`sh
node --test tests/*.test.mjs
\`\`\`
Bao gồm kiểm tra parser CSV/JSON, trùng dữ liệu, thập phân, bộ lọc bảng xếp hạng, xác nhận hướng lắp và các thao tác giao diện.

## Thiết kế lại giao diện V+ STEAM LAB (2026-10-12)

Bản thiết kế này là **tái cấu trúc giao diện**, không chỉ sửa màu:

- **Thanh bên trái**: xanh than đậm, icon SVG vector, phân nhóm Invention / Battle / Hệ thống, trạng thái lưu trên thiết bị và điểm nhấn xanh lá V+.
- **Tổng quan**: hero Competition Control Center với đồ họa robot tạo bằng CSS/SVG; số liệu thực tế về đội, lượt Invention, trận Battle, đề đã tạo; lối tắt vào random/chấm điểm; tiến độ và kết quả dẫn đầu của **từng bảng** (không xếp hạng chéo cấp lớp).
- **Random Studio**: bố cục hai cột trên laptop/desktop gồm bảng cấu hình và sa bàn thật; máy tính bảng/điện thoại chuyển thành bố cục dọc. Việc bấm Random **chỉ cập nhật kết quả**, không thay đổi vị trí cuộn, không tải lại ảnh sa bàn.
- **Bảng xếp hạng**: giữ tab Chung / từng bảng, Top 3, tiến độ, xếp hạng độc lập. **Nhập đội**: giữ nguyên CSV/JSON, template, xác thực, dữ liệu cũ.
- **Hiệu ứng**: hiệu ứng tải nội dung ngắn, hover nút/thẻ, đồ họa robot chuyển động nhẹ ở trang tổng quan, tôn trọng `prefers-reduced-motion`.
- **Nhận diện thương hiệu**: sử dụng logo V+ tại nguồn chính thức (nếu truy cập được) và chữ V+ thay thế khi ảnh lỗi, kèm favicon.
- **CSS**: chỉ còn `styles.css` (nền/cấu trúc) và `vplus-2026.css` (theme hiện tại). `vplus-theme.css` và `vplus-experience.css` là tệp lịch sử, **không còn được nạp**. Không phụ thuộc thư viện UI mới.

### Kiểm thử thiết kế

`node --test tests/*.test.mjs` kiểm tra chức năng giao diện và tính hợp lệ của các tệp CSS. Kiểm thử tự động không thay thế bước đánh giá trực quan trên trình duyệt thật, đặc biệt đối với kích thước 360px, 768px, 1280px và hình nền sa bàn có tọa độ phần trăm.
