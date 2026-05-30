# Database schema dự kiến

Tài liệu này mô tả schema dự kiến cho Financial Report Intelligence. Đây là thiết kế nền tảng cho các task sau, chưa phải migration SQL chính thức và chưa triển khai đọc/ghi dữ liệu trong ứng dụng.

## Nguyên tắc dữ liệu

- Không lưu kết quả phân tích như dữ liệu thật nếu chưa có báo cáo gốc và dữ liệu đã được người dùng kiểm tra.
- Các chỉ số tài chính trong `financial_metrics` phải được tính bằng công thức cố định trong code ở các task sau.
- Các insight AI trong `ai_insights` phải có nguồn dữ liệu, giới hạn phân tích và mức độ tin cậy khi được triển khai.
- Các điểm bất thường trong `anomalies` phải có bằng chứng trong trường `evidence`.
- Trạng thái xử lý báo cáo được quản lý bằng `reports.status`.

## Bảng `profiles`

Hồ sơ người dùng mở rộng, liên kết với hệ thống authentication sẽ được triển khai sau.

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `email` | `text` | Email người dùng |
| `full_name` | `text` | Nullable |
| `created_at` | `timestamp` | Thời điểm tạo hồ sơ |

## Bảng `reports`

Lưu metadata của báo cáo tài chính đã tải lên trong tương lai.

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Người sở hữu báo cáo |
| `file_name` | `text` | Tên file gốc |
| `file_path` | `text` | Đường dẫn file trong storage |
| `file_type` | `text` | Loại file, ví dụ PDF |
| `file_size` | `bigint` | Dung lượng file |
| `company_name` | `text` | Nullable |
| `reporting_period` | `text` | Nullable |
| `report_type` | `text` | Nullable |
| `status` | `text` | Trạng thái xử lý |
| `created_at` | `timestamp` | Thời điểm tạo |
| `updated_at` | `timestamp` | Thời điểm cập nhật gần nhất |

Trạng thái dự kiến:

- `uploaded`
- `extracting`
- `extraction_failed`
- `ready_for_review`
- `reviewed`
- `analyzing`
- `analysis_failed`
- `analyzed`
- `exported`

## Bảng `extracted_statements`

Lưu dữ liệu báo cáo đã được trích xuất để người dùng kiểm tra và chỉnh sửa trước khi phân tích.

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `statement_type` | `text` | Loại báo cáo tài chính |
| `period` | `text` | Nullable |
| `currency` | `text` | Nullable |
| `unit` | `text` | Nullable |
| `data` | `jsonb` | Dữ liệu đã trích xuất |
| `warnings` | `jsonb` | Nullable, cảnh báo trong quá trình trích xuất |
| `confidence` | `numeric` | Nullable, mức tin cậy trích xuất |
| `created_at` | `timestamp` | Thời điểm tạo |

## Bảng `financial_metrics`

Lưu các chỉ số tài chính được tính từ dữ liệu đã được kiểm tra.

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `period` | `text` | Nullable |
| `metrics` | `jsonb` | Kết quả tính toán bằng công thức cố định |
| `missing_inputs` | `jsonb` | Nullable, các đầu vào bị thiếu |
| `created_at` | `timestamp` | Thời điểm tạo |

## Bảng `anomalies`

Lưu các điểm bất thường được phát hiện từ dữ liệu và chỉ số đã tính.

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `type` | `text` | Nhóm bất thường |
| `severity` | `text` | `low`, `medium`, `high` |
| `description` | `text` | Mô tả khách quan |
| `evidence` | `jsonb` | Bằng chứng dữ liệu |
| `confidence` | `text` | `low`, `medium`, `high` |
| `suggested_follow_up` | `text` | Nullable |
| `created_at` | `timestamp` | Thời điểm tạo |

## Bảng `ai_insights`

Lưu insight AI sau khi dữ liệu đã được xác nhận và phân tích nền tảng đã hoàn tất.

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `executive_summary` | `text` | Tóm tắt điều hành |
| `positive_points` | `jsonb` | Các điểm tích cực có bằng chứng |
| `risk_points` | `jsonb` | Các rủi ro có bằng chứng |
| `anomalies_explained` | `jsonb` | Giải thích điểm bất thường |
| `follow_up_questions` | `jsonb` | Câu hỏi cần làm rõ |
| `limitations` | `jsonb` | Giới hạn phân tích |
| `created_at` | `timestamp` | Thời điểm tạo |

## Bảng `report_exports`

Lưu metadata của file xuất báo cáo ở các task sau.

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `export_type` | `text` | Loại file xuất, ví dụ PDF |
| `file_path` | `text` | Nullable |
| `created_at` | `timestamp` | Thời điểm tạo |
