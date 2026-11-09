-- Per-week training frequency targets owned by each user.
create table if not exists public.weekly_training_targets (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  target_days int not null check(target_days between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start_date)
);

alter table public.weekly_training_targets enable row level security;

create policy "weekly target owner"
on public.weekly_training_targets
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
