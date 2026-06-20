create table if not exists public.judan_leaderboard (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(trim(display_name)) between 1 and 16),
  score smallint not null check (score between 0 and 200),
  rank text not null check (
    rank in ('柔断十段', '九段', '七段', '五段', '三段', '初段', '一級', '三級', '五級', '見習い')
  ),
  created_at timestamptz not null default now()
);

comment on table public.judan_leaderboard is
  '柔断の公開ランキング。表示名・スコア・段位のみを保存し、写真や映像は保存しない。';

create index if not exists judan_leaderboard_score_idx
  on public.judan_leaderboard (score desc, created_at asc);

alter table public.judan_leaderboard enable row level security;

-- ランキングは全員が閲覧可能。登録はサーバーAPIだけがservice_roleで行う。
revoke all on table public.judan_leaderboard from anon, authenticated;
grant select on table public.judan_leaderboard to anon, authenticated;
grant select, insert on table public.judan_leaderboard to service_role;

drop policy if exists "judan leaderboard is publicly readable"
  on public.judan_leaderboard;
create policy "judan leaderboard is publicly readable"
  on public.judan_leaderboard
  for select
  to anon, authenticated
  using (true);
