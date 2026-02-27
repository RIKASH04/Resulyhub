-- ============================================================
-- Run this in Supabase SQL Editor to update the admin email
-- from rikashrikash04@gmail.com → resulthub001@gmail.com
-- Only run this — do NOT re-run the full schema.sql
-- ============================================================

-- Drop old admin policies
drop policy if exists "Admin full access classes"        on public.classes;
drop policy if exists "Admin full access subjects"       on public.subjects;
drop policy if exists "Admin full access students"       on public.students;
drop policy if exists "Admin full access marks"          on public.marks;
drop policy if exists "Admin full access result_summary" on public.result_summary;

-- Recreate with new admin email: resulthub001@gmail.com

create policy "Admin full access classes"
  on public.classes for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');

create policy "Admin full access subjects"
  on public.subjects for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');

create policy "Admin full access students"
  on public.students for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');

create policy "Admin full access marks"
  on public.marks for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');

create policy "Admin full access result_summary"
  on public.result_summary for all
  using (auth.jwt() ->> 'email' = 'resulthub001@gmail.com')
  with check (auth.jwt() ->> 'email' = 'resulthub001@gmail.com');
