-- ============================================================
-- ResultHub — Complete Supabase SQL Setup Script
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. CLASSES TABLE
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- 2. SUBJECTS TABLE (class-based subjects)
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  max_marks integer not null default 100,
  created_at timestamptz default now(),
  unique(class_id, name)
);

-- 3. STUDENTS TABLE
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  register_number text not null unique,
  created_at timestamptz default now()
);

-- Index register_number for fast lookups
create index if not exists idx_students_register_number on public.students(register_number);

-- 4. MARKS TABLE
create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  marks_obtained integer not null default 0,
  created_at timestamptz default now(),
  unique(student_id, subject_id)
);

-- 5. RESULT SUMMARY TABLE (pre-calculated for fast reads)
create table if not exists public.result_summary (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade unique,
  total integer not null default 0,
  max_total integer not null default 0,
  percentage numeric(5,2) not null default 0,
  grade text not null default 'F',
  status text not null default 'Fail' check (status in ('Pass', 'Fail')),
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.marks enable row level security;
alter table public.result_summary enable row level security;

-- ── PUBLIC POLICIES (anyone can read student results) ──

-- Anyone can read classes
create policy "Public read classes"
  on public.classes for select
  using (true);

-- Anyone can read subjects
create policy "Public read subjects"
  on public.subjects for select
  using (true);

-- Anyone can read students (needed for result lookup by register_number)
create policy "Public read students"
  on public.students for select
  using (true);

-- Anyone can read marks
create policy "Public read marks"
  on public.marks for select
  using (true);

-- Anyone can read result_summary
create policy "Public read result_summary"
  on public.result_summary for select
  using (true);

-- ── ADMIN POLICIES (full CRUD for admin email) ──

-- Admin: Full access to classes
create policy "Admin full access classes"
  on public.classes for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');

-- Admin: Full access to subjects
create policy "Admin full access subjects"
  on public.subjects for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');

-- Admin: Full access to students
create policy "Admin full access students"
  on public.students for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');

-- Admin: Full access to marks
create policy "Admin full access marks"
  on public.marks for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');

-- Admin: Full access to result_summary
create policy "Admin full access result_summary"
  on public.result_summary for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');
