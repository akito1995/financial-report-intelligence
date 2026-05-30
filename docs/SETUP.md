# Hướng dẫn setup dự án

Financial Report Intelligence hiện hỗ trợ đăng nhập Supabase Auth, tải file lên Supabase Storage, tạo bản ghi `reports`, trích xuất text thô từ PDF có text layer và chuyển raw text thành dữ liệu tài chính có cấu trúc bằng OpenAI server-side. Ứng dụng chưa OCR ảnh/PDF scan, chưa phân tích tài chính và chưa xuất PDF.

## 1. Cài dependencies

```bash
npm install
```

Trên Windows PowerShell, nếu `npm` bị chặn bởi execution policy:

```bash
npm.cmd install
```

## 2. Chạy local

```bash
npm run dev
```

Mở:

```text
http://localhost:3000
```

## 3. Biến môi trường

Tạo file `.env.local` từ `.env.example` và điền các giá trị thật:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Hiện app cần:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` nếu dùng chức năng trích xuất dữ liệu tài chính có cấu trúc

`SUPABASE_SERVICE_ROLE_KEY` không được dùng ở client. Không commit `.env.local` hoặc key thật lên GitHub.

## 4. Supabase Auth

1. Mở Supabase Dashboard.
2. Vào Authentication.
3. Bật Email provider.
4. Bật đăng nhập bằng email và mật khẩu.
5. Tạo user test nếu cần.

## 5. Storage bucket

Tạo bucket thủ công:

- Tên bucket: `financial-reports`
- Nên để private.
- Không tạo bucket bằng code trong app.

File được lưu theo cấu trúc:

```text
{user_id}/{timestamp}-{safe_file_name}
```

## 6. Bảng `reports`

```sql
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size bigint not null,
  company_name text null,
  reporting_period text null,
  report_type text null,
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_user_id_created_at_idx
  on public.reports (user_id, created_at desc);
```

App hiện dùng thêm các status:

- `unsupported_file_type`
- `no_text_layer`
- `extracting_structured_data`
- `ready_for_review`

## 7. RLS cho `reports`

```sql
alter table public.reports enable row level security;

create policy "Nguoi dung xem bao cao cua chinh minh"
on public.reports
for select
using (auth.uid() = user_id);

create policy "Nguoi dung tao bao cao cua chinh minh"
on public.reports
for insert
with check (auth.uid() = user_id);

create policy "Nguoi dung cap nhat bao cao cua chinh minh"
on public.reports
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Nguoi dung xoa bao cao cua chinh minh"
on public.reports
for delete
using (auth.uid() = user_id);
```

## 8. Bảng `raw_extractions`

Task 3.1 chỉ trích xuất raw text từ PDF có text layer. File ảnh, PDF scan hoặc PDF không có text layer sẽ cần OCR ở task sau.

```sql
create table if not exists public.raw_extractions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_text text not null,
  page_count integer null,
  extraction_method text not null,
  status text not null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists raw_extractions_user_report_created_idx
  on public.raw_extractions (user_id, report_id, created_at desc);
```

## 9. RLS cho `raw_extractions`

```sql
alter table public.raw_extractions enable row level security;

create policy "Nguoi dung xem text tho cua chinh minh"
on public.raw_extractions
for select
using (auth.uid() = user_id);

create policy "Nguoi dung tao text tho cua chinh minh"
on public.raw_extractions
for insert
with check (auth.uid() = user_id);

create policy "Nguoi dung cap nhat text tho cua chinh minh"
on public.raw_extractions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Nguoi dung xoa text tho cua chinh minh"
on public.raw_extractions
for delete
using (auth.uid() = user_id);
```

## 10. Bảng `extracted_statements`

Task 3.2 chỉ chuyển raw text đã trích xuất thành JSON có cấu trúc. Bước này không phân tích tài chính, không tính chỉ số, không phát hiện bất thường và không tự tạo số liệu bị thiếu.

```sql
create table if not exists public.extracted_statements (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  statement_type text not null,
  period text null,
  currency text null,
  unit text null,
  data jsonb not null,
  warnings jsonb null,
  confidence numeric null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists extracted_statements_user_report_created_idx
  on public.extracted_statements (user_id, report_id, created_at desc);
```

## 11. RLS cho `extracted_statements`

```sql
alter table public.extracted_statements enable row level security;

create policy "Nguoi dung xem du lieu trich xuat cua chinh minh"
on public.extracted_statements
for select
using (auth.uid() = user_id);

create policy "Nguoi dung tao du lieu trich xuat cua chinh minh"
on public.extracted_statements
for insert
with check (auth.uid() = user_id);

create policy "Nguoi dung cap nhat du lieu trich xuat cua chinh minh"
on public.extracted_statements
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Nguoi dung xoa du lieu trich xuat cua chinh minh"
on public.extracted_statements
for delete
using (auth.uid() = user_id);
```

## 12. Storage policies

```sql
create policy "Nguoi dung tai file vao thu muc cua minh"
on storage.objects
for insert
with check (
  bucket_id = 'financial-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Nguoi dung xem file trong thu muc cua minh"
on storage.objects
for select
using (
  bucket_id = 'financial-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Nguoi dung cap nhat file trong thu muc cua minh"
on storage.objects
for update
using (
  bucket_id = 'financial-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'financial-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Nguoi dung xoa file trong thu muc cua minh"
on storage.objects
for delete
using (
  bucket_id = 'financial-reports'
  and auth.uid()::text = (storage.foldername(name))[1]
);
```

## 13. OpenAI

Chức năng trích xuất dữ liệu tài chính có cấu trúc dùng OpenAI API ở server-side.

Local:

```env
OPENAI_API_KEY=sk-...
```

Vercel:

1. Mở Project Settings.
2. Vào Environment Variables.
3. Thêm `OPENAI_API_KEY`.
4. Redeploy project sau khi lưu biến môi trường.

Không đặt `OPENAI_API_KEY` trong biến bắt đầu bằng `NEXT_PUBLIC_`. Không commit key thật vào GitHub.

## 14. Vercel

Sau khi deploy Vercel, kiểm tra các biến môi trường đã được set đúng:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

Nếu app hiện chưa dùng service role ở runtime, có thể chưa cần set `SUPABASE_SERVICE_ROLE_KEY` trên Vercel. Sau khi thêm hoặc sửa biến môi trường, redeploy project.

## 15. Lưu ý bảo mật

- Không commit `.env.local`.
- Không commit secret key.
- Không expose `SUPABASE_SERVICE_ROLE_KEY` ra client.
- Không expose `OPENAI_API_KEY` ra client.
- Query report, raw extraction và structured extraction phải lọc theo `user_id`.
- Không log raw text dài ra console.
- Không log response OpenAI đầy đủ nếu quá dài.
- Task 3.2 chỉ gửi `raw_text` đã lưu trong database cho OpenAI, không gửi file gốc.

## 16. Phạm vi chưa triển khai

- OCR ảnh hoặc PDF scan.
- Màn hình review và chỉnh sửa số liệu.
- Phân tích báo cáo tài chính.
- Tính metrics.
- Phát hiện bất thường.
- Tạo insight đánh giá doanh nghiệp.
- Dashboard thật.
- Xuất PDF.
