
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, company)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'company');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- loans
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  borrower_name text not null,
  loan_product text not null default 'DSCR',
  property_address text,
  loan_amount numeric,
  property_value numeric,
  status text not null default 'intake',
  recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.loans enable row level security;
create policy "own loans all" on public.loans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  doc_type text,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  status text not null default 'uploaded',
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;
create policy "own docs all" on public.documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- extractions
create table public.extractions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text,
  fields jsonb not null default '{}'::jsonb,
  confidence numeric,
  raw_text text,
  created_at timestamptz not null default now()
);
alter table public.extractions enable row level security;
create policy "own extractions all" on public.extractions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- calculations
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  calc_type text not null,
  inputs jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  formula text,
  created_at timestamptz not null default now()
);
alter table public.calculations enable row level security;
create policy "own calcs all" on public.calculations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- packages
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary jsonb not null default '{}'::jsonb,
  deficiencies jsonb not null default '[]'::jsonb,
  recommendation text,
  created_at timestamptz not null default now()
);
alter table public.packages enable row level security;
create policy "own packages all" on public.packages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- storage bucket
insert into storage.buckets (id, name, public) values ('loan-documents', 'loan-documents', false)
on conflict (id) do nothing;

create policy "own files read" on storage.objects for select
  using (bucket_id = 'loan-documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own files insert" on storage.objects for insert
  with check (bucket_id = 'loan-documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own files delete" on storage.objects for delete
  using (bucket_id = 'loan-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create index on public.loans(user_id, created_at desc);
create index on public.documents(loan_id);
create index on public.extractions(loan_id);
create index on public.calculations(loan_id);
create index on public.packages(loan_id);
