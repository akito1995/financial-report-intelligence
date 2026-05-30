-- SQL setup cho Task 3.x: raw text extraction, OCR và structured extraction.
-- Chạy trong Supabase Dashboard > SQL Editor.

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

alter table public.raw_extractions enable row level security;

drop policy if exists "Nguoi dung xem text tho cua chinh minh"
on public.raw_extractions;

create policy "Nguoi dung xem text tho cua chinh minh"
on public.raw_extractions
for select
using (auth.uid() = user_id);

drop policy if exists "Nguoi dung tao text tho cua chinh minh"
on public.raw_extractions;

create policy "Nguoi dung tao text tho cua chinh minh"
on public.raw_extractions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Nguoi dung cap nhat text tho cua chinh minh"
on public.raw_extractions;

create policy "Nguoi dung cap nhat text tho cua chinh minh"
on public.raw_extractions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Nguoi dung xoa text tho cua chinh minh"
on public.raw_extractions;

create policy "Nguoi dung xoa text tho cua chinh minh"
on public.raw_extractions
for delete
using (auth.uid() = user_id);

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

alter table public.extracted_statements enable row level security;

drop policy if exists "Nguoi dung xem du lieu trich xuat cua chinh minh"
on public.extracted_statements;

create policy "Nguoi dung xem du lieu trich xuat cua chinh minh"
on public.extracted_statements
for select
using (auth.uid() = user_id);

drop policy if exists "Nguoi dung tao du lieu trich xuat cua chinh minh"
on public.extracted_statements;

create policy "Nguoi dung tao du lieu trich xuat cua chinh minh"
on public.extracted_statements
for insert
with check (auth.uid() = user_id);

drop policy if exists "Nguoi dung cap nhat du lieu trich xuat cua chinh minh"
on public.extracted_statements;

create policy "Nguoi dung cap nhat du lieu trich xuat cua chinh minh"
on public.extracted_statements
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Nguoi dung xoa du lieu trich xuat cua chinh minh"
on public.extracted_statements;

create policy "Nguoi dung xoa du lieu trich xuat cua chinh minh"
on public.extracted_statements
for delete
using (auth.uid() = user_id);
