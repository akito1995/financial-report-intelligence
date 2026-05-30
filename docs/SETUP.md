# Hướng dẫn setup dự án

Tài liệu này hướng dẫn chạy local dự án Financial Report Intelligence. Hiện tại ứng dụng đã có đăng nhập Supabase Auth, tải file lên Supabase Storage và tạo bản ghi trong bảng `reports`. Chưa triển khai OCR, đọc nội dung PDF, OpenAI, phân tích tài chính thật hoặc xuất PDF.

## 1. Cài dependencies

Chạy lệnh sau tại thư mục gốc dự án:

```bash
npm install
```

Trên Windows PowerShell, nếu `npm` bị chặn bởi execution policy, có thể dùng:

```bash
npm.cmd install
```

## 2. Chạy local

Khởi động dev server:

```bash
npm run dev
```

Nếu dùng Windows PowerShell và gặp lỗi tương tự, dùng:

```bash
npm.cmd run dev
```

Sau khi chạy thành công, mở:

```text
http://localhost:3000
```

## 3. Biến môi trường cần thiết

Dự án dùng các biến sau:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Để đăng nhập, tải file và ghi bảng `reports` hoạt động, cần điền ít nhất:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Ý nghĩa:

- `NEXT_PUBLIC_SUPABASE_URL`: URL Supabase project, được phép dùng ở browser client.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key Supabase, được phép dùng ở browser client theo chính sách Row Level Security phù hợp.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key cho tác vụ server-side đặc quyền ở task sau. Không dùng ở frontend.
- `OPENAI_API_KEY`: key OpenAI cho các task AI sau. Chưa được sử dụng trong task này.

## 4. Cách tạo Supabase project

1. Đăng nhập Supabase.
2. Tạo project mới.
3. Vào phần cấu hình API của project.
4. Lấy `Project URL` và `anon public key`.
5. Lưu các giá trị này vào `.env.local`.

## 5. Bật Email/Password Auth

1. Trong Supabase project, mở khu vực Authentication.
2. Vào phần Providers.
3. Bật Email provider.
4. Bật đăng nhập bằng email và mật khẩu.
5. Tạo người dùng thử nghiệm trong Supabase Dashboard nếu cần kiểm tra đăng nhập.

Ứng dụng hiện chỉ có form đăng nhập. Chưa có đăng ký tài khoản, forgot password, role-based permission hoặc tạo profile tự động.

## 6. Tạo bucket `financial-reports`

Tạo bucket thủ công trong Supabase Storage:

1. Mở Storage trong Supabase Dashboard.
2. Chọn tạo bucket mới.
3. Đặt tên bucket là `financial-reports`.
4. Nên để bucket ở chế độ private.
5. Không tạo bucket bằng code trong ứng dụng.

File được lưu theo cấu trúc:

```text
{user_id}/{timestamp}-{safe_file_name}
```

## 7. Tạo bảng `reports`

Chạy SQL gợi ý sau trong Supabase SQL Editor nếu bảng `reports` chưa tồn tại:

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

Các trường `company_name`, `reporting_period` và `report_type` để `null` cho đến khi có bước trích xuất và kiểm tra dữ liệu.

## 8. Bật Row Level Security cho `reports`

Chạy SQL gợi ý:

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

Policy delete được chuẩn bị cho task sau nếu có chức năng xóa báo cáo.

## 9. Policy Storage cho bucket `financial-reports`

Nếu bucket private và RLS Storage đang bật, cần policy để người dùng chỉ thao tác trong thư mục theo `user_id` của chính mình:

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

Ứng dụng hiện chỉ dùng thao tác upload file. Các policy select, update và delete giúp chuẩn bị cho các bước quản lý file sau này.

## 10. Cách dùng `.env.example`

Sao chép `.env.example` thành `.env.local` trên máy local:

```bash
copy .env.example .env.local
```

Sau đó điền giá trị thật vào `.env.local`.

Không điền key thật vào `.env.example`.

## 11. Lưu ý bảo mật

- Không commit `.env.local`.
- Không commit secret key vào repository.
- Không hiển thị secret key trên giao diện người dùng.
- Không expose `SUPABASE_SERVICE_ROLE_KEY` ra client.
- Browser client chỉ được dùng `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Query danh sách báo cáo phải lọc theo `user_id` của user hiện tại.
- Bật RLS để user không xem hoặc ghi báo cáo của user khác.
- Không log mật khẩu hoặc thông tin nhạy cảm.

## 12. Phạm vi chưa triển khai

Các phần sau sẽ được triển khai ở những task tiếp theo:

- Đăng ký tài khoản.
- Forgot password.
- Role-based permission.
- Tạo profile tự động.
- OCR hoặc trích xuất PDF.
- Đọc nội dung báo cáo.
- Kết nối OpenAI.
- Phân tích tài chính thật.
- Dashboard có dữ liệu thật.
- Xuất báo cáo PDF.
