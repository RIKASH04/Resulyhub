-- ============================================================
-- ResultHub — RLS Fix Script
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- This fixes result_summary insert/upsert failures
-- ============================================================

-- Drop old restrictive policies on result_summary
drop policy if exists "Admin full access result_summary" on public.result_summary;
drop policy if exists "Public read result_summary" on public.result_summary;

-- Drop old restrictive policies on marks (also re-create robustly)
drop policy if exists "Admin full access marks" on public.marks;
drop policy if exists "Public read marks" on public.marks;

-- Drop old restrictive policies on students
drop policy if exists "Admin full access students" on public.students;
drop policy if exists "Public read students" on public.students;

-- ── result_summary: fully open for authenticated users + public read ──
create policy "Public read result_summary"
  on public.result_summary for select
  using (true);

create policy "Authenticated insert result_summary"
  on public.result_summary for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated update result_summary"
  on public.result_summary for update
  using (auth.role() = 'authenticated');

create policy "Authenticated delete result_summary"
  on public.result_summary for delete
  using (auth.role() = 'authenticated');

-- ── marks: public read + authenticated write ──
create policy "Public read marks"
  on public.marks for select
  using (true);

create policy "Authenticated insert marks"
  on public.marks for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated update marks"
  on public.marks for update
  using (auth.role() = 'authenticated');

create policy "Authenticated delete marks"
  on public.marks for delete
  using (auth.role() = 'authenticated');

-- ── students: public read + authenticated write ──
create policy "Public read students"
  on public.students for select
  using (true);

create policy "Authenticated insert students"
  on public.students for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated update students"
  on public.students for update
  using (auth.role() = 'authenticated');

create policy "Authenticated delete students"
  on public.students for delete
  using (auth.role() = 'authenticated');
