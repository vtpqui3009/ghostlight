# Ghostlight — kế hoạch kiểm chứng và đối chiếu Kiroween 2026

**Ngày: 31/10/2026 (UTC). Trạng thái: đã chọn để kiểm chứng; chưa được chốt xây toàn bộ.** Không có phỏng vấn, thử nghiệm người dùng, prototype thực thi hoặc app nào được thực hiện trong bước lập kế hoạch này. Không tuyên bố độc nhất hoặc chắc thắng. Kế hoạch này cụ thể hóa [báo cáo cuối](KIROWEEN_FINAL_REVIEW.md); [phụ lục bằng chứng](KIROWEEN_RESEARCH_EVIDENCE.md) vẫn giữ nguyên.

## 1. Việc cần xác nhận trước tiên

Bạn xác nhận có thể tiếp cận **hai stage manager/ASM có kinh nghiệm**, có **một chuỗi đạo cụ/run-sheet thật được phép sử dụng sau khi ẩn danh**, cùng thời gian và thiết bị thực tế có thể dành cho kiểm chứng. Chỉ cung cấp tài liệu đã bỏ tên người, liên hệ, nội dung nhạy cảm và thông tin không được phép chia sẻ. Không cần gửi nguyên kịch bản riêng tư.

Bước hiện tại là chuẩn bị thử trên giấy và quyết định tiếp tục/dừng. Chưa tự liên hệ người thử, đăng ký tài khoản dịch vụ, mua công cụ, tạo prototype, viết app hoặc nộp bài. Không mặc định bạn có bốn tuần rảnh hoặc quyền truy cập công cụ sân khấu.

## 2. Phù hợp cuộc thi ở điểm nào?

**Hạng mục đề xuất: Costume Contest.** “Bóng ma” thể hiện vị trí/người giữ được yêu cầu; đạo cụ đặc thể hiện trạng thái được mô hình hóa từ chuỗi thao tác. Khi hai hình không khớp, người dùng nhìn thấy điều kiện chưa được đáp ứng, mở được cue nguyên nhân và nhiệm vụ cần sửa. Giao diện Halloween phục vụ việc đọc sai lệch, thay vì chỉ trang trí. Đây là suy luận về mức phù hợp hạng mục; ban tổ chức đánh giá bài nộp thực tế. Chọn ý tưởng không tự bảo đảm đủ điều kiện.

Nguồn chính thức, đối chiếu ngày 31/10/2026: [overview](https://kiroween.devpost.com/), [thể lệ 2026](https://kiroween.devpost.com/rules), [FAQ](https://kiroween.devpost.com/details/faqs). Thể lệ là nguồn quyết định; những ngưỡng người dùng bên dưới là đề xuất của kế hoạch, không phải yêu cầu cuộc thi.

### Đối chiếu yêu cầu bắt buộc với bằng chứng cần chuẩn bị

| Yêu cầu chính thức | Áp dụng cho Ghostlight nếu bước xây được chấp thuận | Trạng thái hiện tại |
|---|---|---|
| Dự án mới trong kỳ nộp | App được xây từ 30/10/2026 09:00 Pacific Time đến 04/12/2026 14:00 PST; khai rõ mã/thư viện có trước | Đã xác minh thể lệ; chưa có app |
| Hạn nộp | **05:00 ngày 05/12/2026 giờ Việt Nam**; không dùng mốc năm 2025 | Đã xác minh lịch |
| Dùng Kiro có ý nghĩa | Kiro là môi trường chính để đặc tả và xây code app, có bằng chứng thật về quyết định, kiểm tra và sửa lỗi | Chiến lược đề xuất; chưa thực hiện |
| Repository công khai | GitHub, đủ source/assets/hướng dẫn chạy; giấy phép mã nguồn mở được nhận diện và hiển thị trên repo | Chưa có repository app để nộp |
| Thư mục Kiro | Commit `/.kiro` ở gốc; không bỏ thư mục hoặc thư mục con vào `.gitignore` | Chưa tạo; không giả lập bằng chứng |
| App chạy được và có URL | Luồng nhập → kiểm tra → giải thích → sửa → xuất bản in hoạt động nhất quán; có URL/test build cho giám khảo | NOT RUN — chưa xây/chưa deploy |
| Quyền truy cập giám khảo | Nếu cần đăng nhập, ghi thông tin và hướng dẫn ở trường riêng của submission; cho giám khảo kiểm tra miễn phí đến hết kỳ chấm | Chưa triển khai; không công khai mật khẩu riêng tư |
| Video | YouTube công khai, dưới ba phút, quay app hoạt động trên thiết bị mục tiêu; dùng nội dung có quyền | Chưa quay/đăng |
| Ngôn ngữ | Nội dung nộp bằng tiếng Anh hoặc có bản dịch tiếng Anh cho video, mô tả, hướng dẫn và tài liệu nộp | Chưa soạn bộ hồ sơ |
| Hạng mục và nhóm | Nộp Costume Contest; tối đa ba người và đáp ứng điều kiện người dự thi trong thể lệ | Hạng mục dự kiến; lựa chọn chưa phải chấp nhận của ban tổ chức |

Kiro phải đóng góp thực chất trong quá trình phát triển; **app không bắt buộc chứa LLM**. Không có quy tắc mọi dòng code chỉ được do Kiro viết. Chọn Kiro để xây phần app chính là chiến lược tạo bằng chứng rõ ràng, không phải diễn giải thành độc quyền công cụ. Không thêm MCP hoặc dùng mọi tính năng Kiro chỉ để đủ danh sách; không dựng lại log như thể công việc đã xảy ra.

### Năm tiêu chí, mỗi tiêu chí 20%

| Tiêu chí | Bằng chứng cụ thể cần có nếu đi tiếp |
|---|---|
| Potential Impact — 20% | Một tình huống thật đã ẩn danh, cách hiện tại xử lý nó, lỗi/thiếu sót công cụ giúp thấy và phản hồi của người thử; chưa hứa số phút tiết kiệm |
| Technological Implementation — 20% | Specs/steering/hooks/PBT thực sự được dùng trong Kiro; chỉ ra một yêu cầu dẫn đến kiểm tra, lỗi tìm được và thay đổi code tương ứng |
| Design — 20% | Luồng hoàn chỉnh, ghost/solid giải thích được sai lệch, có bản danh sách tĩnh, bàn phím, tương phản và giảm chuyển động; kiểm tra người dùng phải tự hoàn thành được |
| Innovation/Idea — 20% | So tính năng kiểm tra từng bản vật lý và nguồn/người giữ độc lập với CueCall, DigiScript, Standby; nêu phần đã có và khoảng trống được xác minh, không chỉ đổi tên tính năng |
| Presentation — 20% | Video dưới ba phút trình bày một vấn đề, app chạy từ đầu đến cuối, giải thích một nguyên nhân và sửa lỗi; phân biệt dữ liệu minh họa với bằng chứng người dùng thật |

Nguồn trọng số và yêu cầu: [thể lệ, mục Project/Submission Requirements và Judges & Criteria](https://kiroween.devpost.com/rules). Không có điểm thi hay xác suất giải nào được dự đoán ở đây.

## 3. Giới hạn bài toán kiểm chứng

**Giả thuyết:** yêu cầu nguồn/người giữ và đích đến vốn có trong chỉ dẫn đạo cụ có thể giúp suy ra lần chuyển giao bị thiếu, không buộc người dùng phải nhập trước chính lỗi đó. Cần xác thực giá trị và công sức nhập liệu; tài liệu công khai chưa chứng minh có nhu cầu đủ mạnh.

Phạm vi ban đầu: tối đa **12 bản đạo cụ vật lý**, khoảng **40 cue/bước run-sheet có thứ tự**, **6 khu vực**. Một cue có thể có nhiều thao tác; không hứa giới hạn hoặc khả năng xử lý “40 action” khi chưa đo nhu cầu. Vai trò là người lập kế hoạch đạo cụ/ASM trong paper tech hoặc rehearsal, crew có thể dùng bản in.

Nếu được phép xây sau kiểm chứng, ưu tiên React/TypeScript local-first với dữ liệu nhỏ, nhập/xuất JSON/CSV và bản in; đây chỉ là phương án triển khai, chưa có code.

- Mỗi bản vật lý có ID riêng, kể cả hai món trông giống nhau. Loại “lá thư” không thay thế `letter-A` và `letter-B`.
- Tách **trạng thái khởi đầu**, **yêu cầu nguồn/người giữ của cue** và **trạng thái tính toán**. Yêu cầu nhập từ run-sheet/người dùng độc lập; không tự điền “expected” từ trạng thái hiện tại để phép kiểm tra luôn đúng.
- Các thao tác dự kiến: `place`, `collect`, `transfer`, `carryOff`, `consume`, `replenish`. `transfer` tương đương lần bàn giao; `replenish` tạo bản mới có ID mới. Bản đã tiêu hao không được hồi sinh bằng reset trong cùng lần chạy.
- Trạng thái khởi đầu chưa biết → báo “chưa đủ thông tin”, không coi là lỗi chắc chắn. Thao tác cùng cue phải có thứ tự rõ; nếu chưa rõ thứ tự thì yêu cầu làm rõ, không tự đoán đồng thời.
- “Vị trí theo mô hình” khác vị trí thực tế. Chỉ kiểm tra thiếu sót trong kế hoạch; không theo dõi trực tiếp người/đồ, bảo đảm an toàn hoặc phát hiện diễn viên thực hiện sai.

Không đưa QR/inventory tổng quát, 3D, tìm đường diễn viên, live cue control, LLM đọc cả script, vật lý, hộp lồng nhau hoặc chất lỏng dùng một phần vào bài kiểm chứng này.

## 4. Cách kiểm chứng và câu hỏi ngắn

Khi có người thử và được chấp thuận thực hiện, làm từng buổi riêng để giảm ảnh hưởng lẫn nhau:

1. Cho họ giải thích một chuỗi thật và cách xử lý bằng công cụ hiện tại trước khi giới thiệu Ghostlight.
2. Ghi baseline: thời gian đọc/chuẩn bị/sửa, số trường cần nhập, số lần phải hỏi lại, cách tìm cue nguyên nhân và giá trị bản in. Chưa đặt lời hứa hiệu suất; thống nhất trước với họ công sức nào là chấp nhận được.
3. Đối chiếu cùng tình huống trên giấy/mô hình nhỏ; không gợi ý sẵn lỗi. Tách thời gian hướng dẫn khỏi thời gian thao tác.
4. Để họ tự nhập/sửa tình huống thật, quan sát phần khó và hỏi có muốn dùng lại đầu ra cho công việc thực tế nào không. Ghi nguyên ý kiến, cả phản chứng.

Câu hỏi phỏng vấn:

- Lần gần nhất một đạo cụ ở sai vị trí/người giữ trước cue là khi nào? Run-sheet thiếu thông tin gì?
- Hiện bạn nhận ra và sửa vấn đề đó bằng cách nào; công cụ nào đã đủ tốt?
- Bạn có thực sự phân biệt hai bản giống nhau, đồ tiêu hao và người bàn giao không? Nếu không, vì sao?
- Trong một dòng chỉ dẫn bình thường, nguồn/người giữ được ghi sẵn hay phải bổ sung riêng?
- Với ví dụ vừa thử, phần nhập liệu nào đáng công; phần nào phiền hơn giấy/spreadsheet hoặc công cụ hiện tại?
- Bạn có chọn dùng lại bản kiểm tra/bản in này cho một việc thật cụ thể không? Điều gì khiến bạn từ chối?

Không coi lời khen, tình huống giả lập hoặc ý định dùng chung chung là bằng chứng nhu cầu đã được xác thực.

### Đối chiếu đối thủ trước khi chốt khác biệt

Dùng cùng một bộ tình huống, ghi riêng cho [CueCall duties](https://www.cuecall.app/docs/run-sheets-reports-tab-adding-duties), [DigiScript](https://dreamteamprod.github.io/DigiScript/pages/show_config/stage_management.html) và [Standby](https://github.com/ShannonH/standby): có phân biệt bản vật lý, yêu cầu nguồn độc lập, phát hiện thiếu chuyển giao/dùng lại bản tiêu hao và truy nguyên cue trước hay không? Ghi nguồn, phiên bản, cách kiểm tra, kết quả và phần chưa truy cập được.

Handoffs, presets, tracks, reports và playback đã tồn tại; không tính là đổi mới. **Không thấy trong docs công khai chưa đăng nhập không có nghĩa là sản phẩm thiếu.** Chưa thử được khả năng tương đương thì giữ trạng thái chưa xác minh, không đánh dấu đạt. Chỉ dùng quyền truy cập được phép; không tự mua/cài/liên hệ nhà cung cấp trong bước lập kế hoạch.

## 5. Năm tình huống thử trên giấy/mô hình nhỏ — tất cả NOT RUN

Đầu vào minh họa phải được đánh dấu synthetic. Với run-sheet thật, giữ một bản ẩn danh gốc và một bản ghi các thay đổi để không lẫn lỗi cấy thử với lỗi vốn có. Chưa có prototype thực thi hoặc test code.

| Tình huống | Thiết lập và thao tác trên giấy | Kết quả mong đợi | Trạng thái |
|---|---|---|---|
| Thiếu chuyển giao | `letter-A` từ bàn trái được A lấy và mang ra cánh phải. Cue sau ghi độc lập B cần lấy `letter-A` từ bàn trái; không có lần trả | Báo nguồn/người giữ không khớp, dẫn về thao tác trước làm đổi trạng thái; không tự điền bàn phải vào yêu cầu | NOT RUN |
| Dùng lại món tiêu hao | `seal-A` bị `consume`; cue sau lại cần chính `seal-A`. Thêm một bước `replenish seal-B` để thử sửa | Từ chối dùng lại A; B là bản mới, chỉ đáp ứng khi cue thật sự yêu cầu B. Không hồi sinh A bằng reset | NOT RUN |
| Hai bản giống nhau | `letter-A` ở A; `letter-B` vẫn ở bàn trái. Cue B lấy `letter-B`; biến thể sửa yêu cầu thành `letter-A` | Trường hợp B không lỗi vì copy A đã chuyển đi; biến thể A báo sai nguồn. Không gộp hai món theo tên loại | NOT RUN |
| Đổi thứ tự cue | Ban đầu `key-A` ở bàn phải; bước đặt sang bàn trái rồi bước lấy từ bàn trái hợp lệ. Hoán đổi hai bước | Chỉ ra yêu cầu nguồn bị vi phạm sau khi đổi thứ tự và cue nguyên nhân; yêu cầu gốc không thay theo mô phỏng | NOT RUN |
| Chuỗi hợp lệ làm đối chứng | `letter-A` ban đầu ở bàn trái; A lấy, chuyển cho B, B mang ra cánh phải rồi đặt lên bàn phải; yêu cầu nguồn mỗi bước khai đúng | Không báo lỗi trên chuỗi đầy đủ; trạng thái cuối và dấu vết đúng. Ngăn việc hệ thống luôn báo lỗi để “bắt trúng” bốn tình huống kia | NOT RUN |

Ngoài năm ví dụ này, quy tắc “không biết thì báo chưa đủ thông tin” và thứ tự trong cùng cue cần được rà lại khi chốt mô hình; không tự biến các trường hợp chưa rõ thành kết quả PASS.

## 6. Cổng quyết định và trạng thái kiểm chứng

Người dùng/dữ liệu, khác biệt, mô hình độc lập, giá trị nhập liệu và điều kiện thực hiện là các cổng trước khi xây toàn bộ. Các dòng runtime, tiếp cận và kết quả app ghi phần kiểm tra còn phải làm trong prototype/MVP và trước khi nộp; không có kết quả code để đánh dấu đạt lúc này.

| Cổng | Điều kiện đạt | Trạng thái ngày 31/10/2026 |
|---|---|---|
| Nguồn thể lệ | Yêu cầu, lịch và năm hiện tại đã đối chiếu nguồn chính thức | VERIFIED — chỉ xác minh yêu cầu, chưa chứng nhận bài nộp |
| Mức hợp hạng mục | Ghost/solid giúp đọc sai lệch thật và có luồng hữu ích | INFERENCE — chưa kiểm tra runtime/người dùng |
| Người dùng và dữ liệu | Hai stage manager/ASM có kinh nghiệm; một chuỗi thật đã ẩn danh và được phép | NOT RUN — chưa có buổi kiểm chứng |
| Khác biệt với công cụ gần | Kiểm tra tương đương từng bản vật lý bằng nguồn đủ mạnh; phần chưa truy cập phải ghi rõ | NOT RUN — research công khai chưa đủ kết luận runtime |
| Độ đúng mô hình | Năm tình huống ở mục 5 cho kết quả đúng; required-source độc lập; xử lý unknown và thứ tự rõ ràng | NOT RUN — chưa thử/viết code |
| Giá trị và công sức nhập | Cả hai tự nhập/sửa ví dụ thật; ít nhất một người chọn dùng lại đầu ra cho vấn đề thật; bookkeeping chấp nhận được so baseline | NOT RUN |
| Khả dụng và tiếp cận | Luồng dùng được bằng bàn phím, thông tin đủ ở bản tĩnh, tương phản và giảm chuyển động được kiểm tra | NOT RUN |
| Điều kiện thực hiện | Xác nhận thời gian, thiết bị, tiếp cận người dùng và khả năng dùng Kiro của bạn | PENDING — chưa mặc định kế hoạch bốn tuần |
| Kết quả code/app | Test thực tế, app hoạt động, URL và bằng chứng Kiro | NOT RUN — chưa có app |

**Dừng trước full build** nếu không có người/tài liệu thật, đối thủ đã giải quyết tương đương, yêu cầu chỉ đúng nhờ tự điền từ mô phỏng, người dùng không tự thao tác được hoặc công sức ghi chép lớn hơn lợi ích. Thiếu khả năng dùng Kiro/thiết bị/thời gian cũng phải giải quyết trước khi đi tiếp. Không tự chuyển sang ý tưởng dự phòng hoặc thêm tính năng để cứu giả thuyết thất bại.

Chỉ tinh chỉnh nhỏ khi giá trị cốt lõi đã được xác nhận: nhãn nút, cột CSV, mẫu bản in, mật độ timeline hoặc thuật ngữ nghề. Nếu phải thay đổi bài toán cốt lõi để vượt cổng, mở lại quyết định thay vì đánh dấu đạt.

## 7. Giao diện và bằng chứng Kiro nếu được phép triển khai

Giao diện: timeline và danh sách cue; ghost ở vị trí yêu cầu, solid ở vị trí mô hình; nhãn văn bản “cần”/“theo kế hoạch”, không dùng màu làm tín hiệu duy nhất. Mỗi cảnh báo mở được điều kiện sai và thao tác trước liên quan. Có focus nhìn rõ, bàn phím, độ tương phản đủ và bản danh sách/bản in tương đương khi giảm chuyển động. Không giấu nút để tạo cảm giác kinh dị hoặc dùng jump scare. **Chưa kiểm tra accessibility thực tế.**

Các đặc tả dự kiến để thực hiện trong Kiro sau khi được phép xây — hiện **chưa tạo file `.kiro`**:

- `requirements`: nhu cầu ASM, ranh giới plan/live, bản vật lý, nguồn độc lập, unknown và tiêu chí chấp nhận của năm tình huống.
- `design`: mô hình trạng thái/sự kiện có thứ tự, điều kiện hợp lệ, kết quả lỗi/uncertainty, causal trace và định dạng JSON/CSV/bản in.
- `tasks`: model trước, test mô hình, UI nhập/sửa và giải thích, import/export, kiểm tra tiếp cận, demo và hồ sơ nộp.
- Steering: giữ phạm vi, thuật ngữ và bằng chứng trung thực. Hook kiểm tra schema/type/test khi thay đổi model nếu thực sự hữu ích; không tạo hook hình thức.

PBT là kế hoạch kiểm tra các thuộc tính có ý nghĩa, không phải kết quả đã PASS:

| Thuộc tính | Điều cần kiểm tra khi có code |
|---|---|
| Single custody | Mỗi bản vật lý còn dùng được có tối đa một người giữ/vị trí hợp lệ trong mô hình, không bị nhân đôi sau transfer |
| Consumption | Bản đã consume không thể được collect/transfer lại; replenish tạo ID mới và không hồi sinh ID cũ |
| Determinism | Cùng trạng thái ban đầu, yêu cầu và chuỗi có thứ tự → cùng kết quả/traces |
| Causal trace | Lỗi truy được về trạng thái khởi đầu hoặc thao tác trước liên quan của đúng ID, không viện dẫn cue tương lai |
| Invalid actions | Thao tác bị từ chối không làm thay đổi trạng thái; lỗi/uncertainty phải được trả về rõ |

Lưu spec, thay đổi, kết quả test và cách Kiro ảnh hưởng quyết định đúng với những gì thực sự làm. Không bịa log, lời người dùng hoặc số liệu. Review nghiên cứu này không thay thế bằng chứng phát triển bằng Kiro.

## 8. Demo và lịch triển khai chỉ sau quyết định GO

Video mục tiêu **2 phút 50 giây**, chừa khoảng dưới giới hạn ba phút:

- 0:00–0:20: một cảnh ngắn tự viết, ai dùng và món đạo cụ cần ở đâu; ghi rõ synthetic demo.
- 0:20–1:00: nhập/mở chuỗi đầy đủ, xem trạng thái theo mô hình và bản in; không gọi đây là tracking trực tiếp.
- 1:00–1:45: thiếu bàn giao, ghost/solid lệch, mở nguyên nhân rồi sửa; chạy lại cho thấy kết quả thay đổi.
- 1:45–2:15: ngắn gọn phân biệt copy và món tiêu hao; cho thấy bản danh sách/keyboard.
- 2:15–2:40: bằng chứng dùng Kiro thực tế và khác biệt đã kiểm chứng; chưa có nghiên cứu người dùng thì nói rõ.
- 2:40–2:50: URL app/repo và giới hạn. Tiếng Anh hoặc bản dịch; dùng tài sản tự tạo/có quyền, không lộ run-sheet riêng tư.

Nếu vượt các cổng và sau đó được chấp thuận xây, một lịch **bốn tuần giả định** có thể chia: tuần 1 đặc tả/model/test trong Kiro; tuần 2 luồng UI và import/export; tuần 3 thử người dùng và khả dụng/tiếp cận; tuần 4 hoàn thiện app, demo và hồ sơ đúng thể lệ. Đây không phải cam kết tiến độ hoặc lịch đang chạy; phải điều chỉnh theo thời gian thật và hạn nộp.

**Hành động tiếp theo hiện tại:** xác nhận khả năng tiếp cận hai người thử, một chuỗi được phép dùng sau ẩn danh và điều kiện thời gian/thiết bị. Chưa bắt đầu code hoặc liên hệ ai. Tên Ghostlight chỉ là tên làm việc, chưa được kiểm tra nhãn hiệu.
