-- # Soul Sync - Fully Automated Supabase Schema
-- Optimized for the current Soul Sync Frontend

-- ==========================================
-- 1. TABLES
-- ==========================================

-- Profiles: Holds user-specific metadata
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  avatar_url text,
  gender text check (gender in ('male', 'female', 'other')),
  invite_code text unique,
  partner_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Diary Entries
create table if not exists public.diary_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  partner_id uuid references public.profiles(id), 
  content text,
  photo_url text,
  created_at date default current_date not null,
  privacy_level text check (privacy_level in ('private', 'shared', 'locked')) default 'locked',
  
  -- Ensure only one entry per user per day
  unique (user_id, created_at)
);

-- Access Requests
create table if not exists public.access_requests (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  target_entry_id uuid references public.diary_entries(id) on delete cascade not null,
  status text check (status in ('pending', 'approved', 'denied')) default 'pending',
  created_at timestamp with time zone default now(),
  unique (requester_id, target_entry_id)
);

-- Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'new_entry', 'access_requested', 'access_granted', 'paired'
  content text,
  sender_id uuid references public.profiles(id),
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 2. AUTOMATION
-- ==========================================

-- Function: Auto-create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url, invite_code)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    substr(md5(random()::text), 1, 8)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for Profile Creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 3. SECURITY (RLS)
-- ==========================================

alter table public.profiles enable row level security;
alter table public.diary_entries enable row level security;
alter table public.access_requests enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy "Users can view their own profile and partner" on public.profiles
for select using (auth.uid() = id or auth.uid() = partner_id);

create policy "Users can update their own profile" on public.profiles
for update using (auth.uid() = id);

-- Diary Entries
create policy "Users can manage their own entries" on public.diary_entries
for all using (auth.uid() = user_id);

create policy "Users can see partner's entry metadata" on public.diary_entries
for select using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() and partner_id = diary_entries.user_id
  )
);

-- Content visibility logic (Used by Supabase to filter rows)
-- Note: This requires complex logic if we want to hide 'content' specifically.
-- Usually easier to handle 'select' permissions or just let logic flow.
create policy "Users can view partner content ONLY if approved" on public.diary_entries
for select using (
  exists (
    select 1 from public.access_requests 
    where target_entry_id = diary_entries.id 
    and requester_id = auth.uid() 
    and status = 'approved'
  )
);

-- Access Requests
create policy "Users can see requests for their entries or their own" on public.access_requests
for select using (
  auth.uid() = requester_id or 
  auth.uid() = (select user_id from public.diary_entries where id = target_entry_id)
);

create policy "Users can create requests" on public.access_requests
for insert with check (auth.uid() = requester_id);

create policy "Owners of entry can update request status" on public.access_requests
for update using (auth.uid() = (select user_id from public.diary_entries where id = target_entry_id));

-- Notifications
create policy "Users can see their own notifications" on public.notifications
for select using (auth.uid() = user_id);
