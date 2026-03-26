-- Golf Charity Subscription Platform - initial schema (PRD)
-- Run this in your Supabase SQL editor or via your migration tool.

create extension if not exists pgcrypto;

-- Profiles (custom auth user table)
create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  charity_id uuid null,
  contribution_percent numeric null,
  created_at timestamptz not null default now()
);

-- Charities
create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text null,
  image_url text null,
  featured boolean not null default false,
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Stableford scores (keep rolling window in app logic)
create table if not exists public.user_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  score_date date not null,
  stableford_score int not null check (stableford_score between 1 and 45),
  created_at timestamptz not null default now(),
  unique (profile_id, score_date)
);

create index if not exists user_scores_profile_date_idx
  on public.user_scores(profile_id, score_date desc);

-- Subscription lifecycle (updated by Stripe webhooks)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  plan_type text not null check (plan_type in ('monthly', 'yearly')),
  status text not null default 'inactive' check (status in ('active', 'inactive', 'canceled')),
  started_at timestamptz not null default now(),
  renewal_date timestamptz null,
  canceled_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_profile_renewal_idx
  on public.subscriptions(profile_id, renewal_date desc);

-- Donations / contributions
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid null references public.profiles(id) on delete set null,
  charity_id uuid null references public.charities(id) on delete set null,
  donation_type text not null check (donation_type in ('subscription_contribution', 'independent')),
  amount numeric not null check (amount >= 0),
  stripe_payment_intent_id text null,
  created_at timestamptz not null default now()
);

create index if not exists donations_charity_created_idx
  on public.donations(charity_id, created_at desc);

-- Monthly draws
create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  month_start date not null,
  logic_mode text not null check (logic_mode in ('random', 'algorithmic')),
  status text not null default 'draft' check (status in ('draft', 'simulated', 'published')),
  prize_pool_total numeric not null default 0,
  jackpot_rollover_5 numeric not null default 0,
  prize_pool_5 numeric not null default 0,
  prize_pool_4 numeric not null default 0,
  prize_pool_3 numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (month_start)
);

create index if not exists draws_month_idx
  on public.draws(month_start);

-- Generated winners (computed when a draw is published)
create table if not exists public.draw_winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  tier smallint not null check (tier in (3, 4, 5)),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  match_numbers jsonb not null default '[]'::jsonb,
  match_score int null,
  requires_proof boolean not null default true,
  prize_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (draw_id, profile_id, tier)
);

create index if not exists draw_winners_draw_tier_idx
  on public.draw_winners(draw_id, tier);

-- Winner proof submissions (admin verifies)
create table if not exists public.winner_submissions (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null references public.draw_winners(id) on delete cascade,
  draw_id uuid not null references public.draws(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  proof_url text null,
  proof_storage_path text null,
  proof_status text not null default 'pending' check (proof_status in ('pending', 'approved', 'rejected')),
  admin_feedback text null,
  created_at timestamptz not null default now(),
  decided_at timestamptz null,
  unique (winner_id)
);

create index if not exists winner_submissions_draw_status_idx
  on public.winner_submissions(draw_id, proof_status);

-- Payout tracking (Pending → Paid → Completed)
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null references public.draw_winners(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'completed')),
  provider_payment_id text null,
  created_at timestamptz not null default now(),
  paid_at timestamptz null,
  completed_at timestamptz null,
  unique (winner_id)
);

-- Seed baseline charities (placeholders)
insert into public.charities (id, name, description, featured)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Community Sports Fund', 'Placeholder charity. Add real content via Admin panel.', true),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Youth Education Initiative', 'Placeholder charity. Add real content via Admin panel.', false),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'Local Disaster Relief', 'Placeholder charity. Add real content via Admin panel.', false)
on conflict (name) do nothing;

