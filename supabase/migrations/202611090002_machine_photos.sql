create table if not exists public.exercise_machines (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_key text not null,
  nickname text not null,
  brand text,
  gym_name text,
  seat_setting text,
  notes text,
  photo_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.exercise_machines enable row level security;
create policy "machine owner" on public.exercise_machines for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists exercise_machines_user_exercise on public.exercise_machines(user_id, exercise_key);

alter table public.workout_session_exercises
  add column if not exists machine_id uuid references public.exercise_machines(id) on delete set null,
  add column if not exists machine_name_snapshot text,
  add column if not exists machine_photo_path_snapshot text;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('machine-photos', 'machine-photos', false, 8388608, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict(id) do update set public=false, file_size_limit=8388608,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','image/heic','image/heif'];

create policy "private machine photo read" on storage.objects for select
  using(bucket_id='machine-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "private machine photo insert" on storage.objects for insert
  with check(bucket_id='machine-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "private machine photo update" on storage.objects for update
  using(bucket_id='machine-photos' and (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id='machine-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "private machine photo delete" on storage.objects for delete
  using(bucket_id='machine-photos' and (storage.foldername(name))[1]=auth.uid()::text);
