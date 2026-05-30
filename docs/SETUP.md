# Hướng dẫn setup dự án

Financial Report Intelligence hiện hỗ trợ đăng nhập Supabase Auth, tải file lên Supabase Storage, tạo bản ghi `reports`, và trích xuất text thô từ PDF có text layer. Ứng dụng chưa OCR ảnh/PDF scan, chưa gọi OpenAI, chưa phân tích tài chính và chưa xuất PDF.

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

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Hiện app cần:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY` và `OPENAI_API_KEY` chưa được dùng trong client. Không commit key thật lên GitHub.

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

Nếu bảng đã tồn tại trước Task 3.1, cập nhật constraint/status theo nhu cầu nội bộ. App hiện dùng thêm các status:

- `unsupported_file_type`
- `no_text_layer`
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

## 10. Storage policies

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

## 11. Vercel

Sau khi deploy Vercel, kiểm tra các biến môi trường Supabase đã được set đúng:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Sau khi thêm hoặc sửa biến môi trường, redeploy project.

## 12. Lưu ý bảo mật

- Không commit `.env.local`.
- Không commit secret key.
- Không expose `SUPABASE_SERVICE_ROLE_KEY` ra client.
- Query report và raw extraction phải lọc theo `user_id`.
- Không log raw text dài ra console.
- Không gửi file hoặc text cho OpenAI trong Task 3.1.

## 13. Phạm vi chưa triển khai

- OCR ảnh hoặc PDF scan.
- Extract bảng tài chính thành JSON.
- Phân tích báo cáo tài chính.
- Tính metrics.
- Phát hiện bất thường.
- Tạo insight AI.
- Dashboard thật.
- Xuất PDF.
