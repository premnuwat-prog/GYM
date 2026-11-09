-- GYM MVP schema — UUID keys, TIMESTAMPTZ, ownership-based RLS
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  height_cm numeric check (height_cm between 100 and 250), date_of_birth date,
  training_level text not null default 'intermediate', activity_level text not null default 'moderate',
  primary_goal text not null default 'Upper Body Hypertrophy', workout_days_per_week int not null default 2 check (workout_days_per_week between 1 and 7),
  session_duration_minutes int not null default 60 check (session_duration_minutes between 15 and 240),
  preferred_weight_unit text not null default 'kg', preferred_length_unit text not null default 'cm',
  program_start_date date not null default current_date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(), name_en text not null, name_th text not null,
  primary_muscle text not null, secondary_muscles text[] not null default '{}', equipment text not null,
  movement_type text not null, difficulty text not null, instructions text not null,
  image_url text, video_url text, weight_tracking_type text not null default 'total', default_rest_seconds int not null check(default_rest_seconds between 15 and 600),
  is_global boolean not null default true, created_by uuid references auth.users(id) on delete cascade
);
create table if not exists public.workout_programs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, duration_weeks int not null default 12 check(duration_weeks between 1 and 104), start_date date not null, status text not null default 'active', created_at timestamptz not null default now()
);
create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(), program_id uuid not null references public.workout_programs(id) on delete cascade,
  day_number int not null, name text not null, sort_order int not null
);
create table if not exists public.workout_day_exercises (
  id uuid primary key default gen_random_uuid(), workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id), sort_order int not null, target_sets int not null check(target_sets between 1 and 20),
  target_reps_min int not null check(target_reps_min > 0), target_reps_max int not null check(target_reps_max >= target_reps_min),
  rest_seconds int not null check(rest_seconds between 15 and 600), target_rir int, superset_group text
);
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  workout_day_id uuid references public.workout_days(id) on delete set null, workout_name_snapshot text not null,
  started_at timestamptz not null, finished_at timestamptz, status text not null check(status in ('active','completed','cancelled')),
  notes text, duration_minutes int, total_volume numeric not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null, sort_order int not null, exercise_name_snapshot text not null,
  weight_tracking_type_snapshot text not null
);
create table if not exists public.workout_sets (
  id uuid primary key, session_exercise_id uuid not null references public.workout_session_exercises(id) on delete cascade,
  set_number int not null check(set_number > 0), weight_kg numeric not null default 0 check(weight_kg >= 0), reps int not null check(reps >= 0),
  rir int check(rir between 0 and 10), completed_at timestamptz, is_warmup boolean not null default false,
  technique_ok boolean, pain_reported boolean not null default false
);
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  measured_at timestamptz not null default now(), weight_kg numeric check(weight_kg > 0), waist_cm numeric check(waist_cm > 0),
  chest_cm numeric, arm_cm numeric, shoulder_cm numeric, hip_cm numeric, body_fat_percent numeric check(body_fat_percent between 0 and 100)
);
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null, view_type text not null check(view_type in ('front','side','back')), taken_at timestamptz not null default now()
);
create table if not exists public.nutrition_targets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  effective_from date not null, calories int not null check(calories > 0), protein_g numeric not null check(protein_g >= 0), carbs_g numeric not null check(carbs_g >= 0), fat_g numeric not null check(fat_g >= 0)
);
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade, name text not null,
  serving_description text not null, serving_grams numeric, calories numeric not null check(calories >= 0), protein_g numeric not null check(protein_g >= 0),
  carbs_g numeric not null check(carbs_g >= 0), fat_g numeric not null check(fat_g >= 0), source text not null, is_verified boolean not null default false
);
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null, logged_at timestamptz not null default now(), meal_type text not null,
  quantity numeric not null default 1 check(quantity > 0), food_name_snapshot text not null, calories_snapshot numeric not null check(calories_snapshot >= 0),
  protein_snapshot numeric not null check(protein_snapshot >= 0), carbs_snapshot numeric not null check(carbs_snapshot >= 0), fat_snapshot numeric not null check(fat_snapshot >= 0)
);
create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null, energy_score int check(energy_score between 1 and 5), recovery_score int check(recovery_score between 1 and 5),
  sleep_score int check(sleep_score between 1 and 5), satisfaction_score int check(satisfaction_score between 1 and 5), notes text, created_at timestamptz not null default now(), unique(user_id,week_start_date)
);
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade, timezone text not null default 'Asia/Bangkok',
  notification_preferences jsonb not null default '{}', theme text not null default 'dark', updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security; alter table public.exercises enable row level security;
alter table public.workout_programs enable row level security; alter table public.workout_days enable row level security;
alter table public.workout_day_exercises enable row level security; alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security; alter table public.workout_sets enable row level security;
alter table public.body_measurements enable row level security; alter table public.progress_photos enable row level security;
alter table public.nutrition_targets enable row level security; alter table public.foods enable row level security;
alter table public.food_logs enable row level security; alter table public.weekly_checkins enable row level security; alter table public.user_settings enable row level security;

create policy "profile owner" on public.profiles for all using (id=auth.uid()) with check (id=auth.uid());
create policy "read global or own exercises" on public.exercises for select using (is_global or created_by=auth.uid());
create policy "manage own exercises" on public.exercises for all using (created_by=auth.uid()) with check (created_by=auth.uid() and not is_global);
create policy "program owner" on public.workout_programs for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "day via program owner" on public.workout_days for all using(exists(select 1 from public.workout_programs p where p.id=program_id and p.user_id=auth.uid())) with check(exists(select 1 from public.workout_programs p where p.id=program_id and p.user_id=auth.uid()));
create policy "day exercise via owner" on public.workout_day_exercises for all using(exists(select 1 from public.workout_days d join public.workout_programs p on p.id=d.program_id where d.id=workout_day_id and p.user_id=auth.uid())) with check(exists(select 1 from public.workout_days d join public.workout_programs p on p.id=d.program_id where d.id=workout_day_id and p.user_id=auth.uid()));
create policy "session owner" on public.workout_sessions for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "session exercise via owner" on public.workout_session_exercises for all using(exists(select 1 from public.workout_sessions s where s.id=session_id and s.user_id=auth.uid())) with check(exists(select 1 from public.workout_sessions s where s.id=session_id and s.user_id=auth.uid()));
create policy "set via owner" on public.workout_sets for all using(exists(select 1 from public.workout_session_exercises se join public.workout_sessions s on s.id=se.session_id where se.id=session_exercise_id and s.user_id=auth.uid())) with check(exists(select 1 from public.workout_session_exercises se join public.workout_sessions s on s.id=se.session_id where se.id=session_exercise_id and s.user_id=auth.uid()));
create policy "measurement owner" on public.body_measurements for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "photo owner" on public.progress_photos for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "nutrition target owner" on public.nutrition_targets for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "read global or own foods" on public.foods for select using(user_id is null or user_id=auth.uid());
create policy "manage own foods" on public.foods for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "food log owner" on public.food_logs for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "checkin owner" on public.weekly_checkins for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "settings owner" on public.user_settings for all using(user_id=auth.uid()) with check(user_id=auth.uid());

create index if not exists workout_sessions_user_started on public.workout_sessions(user_id,started_at desc);
create index if not exists body_measurements_user_measured on public.body_measurements(user_id,measured_at);
create index if not exists food_logs_user_logged on public.food_logs(user_id,logged_at);

insert into storage.buckets(id,name,public) values('progress-photos','progress-photos',false) on conflict(id) do update set public=false;
create policy "private progress photo read" on storage.objects for select using(bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "private progress photo insert" on storage.objects for insert with check(bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "private progress photo delete" on storage.objects for delete using(bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text);
