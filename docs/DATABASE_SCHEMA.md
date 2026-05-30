# Database schema dự kiến

Tài liệu này mô tả schema dự kiến cho Financial Report Intelligence. Đây là thiết kế nền tảng, chưa phải toàn bộ migration cuối cùng.

## Nguyên tắc dữ liệu

- Không bịa số liệu tài chính.
- Không lưu insight AI như dữ liệu thật nếu chưa có bằng chứng và mức độ tin cậy.
- Các phép tính tài chính ở các task sau phải được tính bằng công thức cố định trong code.
- Người dùng phải kiểm tra dữ liệu đã trích xuất trước khi phân tích.
- Raw extraction lưu text gốc từ PDF có text layer hoặc text OCR từ ảnh/PDF scan, chưa phân tích nội dung.
- Structured extraction chỉ chuyển raw text thành JSON có cấu trúc, không tính toán, không nhận định và không tạo dữ liệu bị thiếu.

## `profiles`

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `email` | `text` | Email người dùng |
| `full_name` | `text` | Nullable |
| `created_at` | `timestamp` | Thời điểm tạo |

## `reports`

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Người sở hữu báo cáo |
| `file_name` | `text` | Tên file gốc |
| `file_path` | `text` | Đường dẫn file trong Storage |
| `file_type` | `text` | Loại file |
| `file_size` | `bigint` | Dung lượng file |
| `company_name` | `text` | Nullable |
| `reporting_period` | `text` | Nullable |
| `report_type` | `text` | Nullable |
| `status` | `text` | Trạng thái xử lý |
| `created_at` | `timestamp` | Thời điểm tạo |
| `updated_at` | `timestamp` | Thời điểm cập nhật |

Trạng thái dự kiến:

- `uploaded`
- `extracting`
- `extracting_structured_data`
- `extraction_failed`
- `unsupported_file_type`
- `no_text_layer`
- `ready_for_review`
- `reviewed`
- `analyzing`
- `analysis_failed`
- `analyzed`
- `exported`

## `raw_extractions`

Lưu text thô được trích xuất từ PDF có text layer hoặc OCR từ ảnh/PDF scan. Bảng này không lưu kết quả phân tích tài chính, không chuẩn hóa bảng số liệu và không chứa insight AI.

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `user_id` | `uuid` | Liên kết tới `auth.users.id` |
| `raw_text` | `text` | Text thô trích xuất từ PDF |
| `page_count` | `integer` | Nullable |
| `extraction_method` | `text` | Ví dụ `pdf_text_layer`, `openai_vision_ocr` |
| `status` | `text` | Trạng thái trích xuất |
| `error_message` | `text` | Nullable |
| `created_at` | `timestamp` | Thời điểm tạo |
| `updated_at` | `timestamp` | Thời điểm cập nhật |

Trạng thái dự kiến:

- `pending`
- `extracting`
- `completed`
- `failed`
- `unsupported_file_type`
- `no_text_layer`

## `extracted_statements`

Lưu dữ liệu tài chính có cấu trúc được trích xuất từ `raw_extractions.raw_text`. Bảng này chưa phải dữ liệu đã được người dùng kiểm tra và không chứa phân tích tài chính.

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `user_id` | `uuid` | Liên kết tới `auth.users.id` |
| `statement_type` | `text` | Loại dữ liệu trích xuất |
| `period` | `text` | Nullable |
| `currency` | `text` | Nullable |
| `unit` | `text` | Nullable |
| `data` | `jsonb` | JSON structured extraction theo schema cố định |
| `warnings` | `jsonb` | Nullable |
| `confidence` | `numeric` | Nullable |
| `created_at` | `timestamp` | Thời điểm tạo |
| `updated_at` | `timestamp` | Thời điểm cập nhật |

## `financial_metrics`

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `period` | `text` | Nullable |
| `metrics` | `jsonb` | Kết quả tính bằng công thức cố định |
| `missing_inputs` | `jsonb` | Nullable |
| `created_at` | `timestamp` | Thời điểm tạo |

## `anomalies`

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

## `ai_insights`

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `executive_summary` | `text` | Tóm tắt điều hành |
| `positive_points` | `jsonb` | Điểm tích cực có bằng chứng |
| `risk_points` | `jsonb` | Rủi ro có bằng chứng |
| `anomalies_explained` | `jsonb` | Giải thích bất thường |
| `follow_up_questions` | `jsonb` | Câu hỏi cần làm rõ |
| `limitations` | `jsonb` | Giới hạn phân tích |
| `created_at` | `timestamp` | Thời điểm tạo |

## `report_exports`

| Cột | Kiểu dữ liệu | Ghi chú |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `report_id` | `uuid` | Liên kết tới `reports.id` |
| `export_type` | `text` | Loại file xuất, ví dụ PDF |
| `file_path` | `text` | Nullable |
| `created_at` | `timestamp` | Thời điểm tạo |
