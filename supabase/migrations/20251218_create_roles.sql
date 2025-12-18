-- 1. Create Roles Table
create table if not exists public.roles (
  id uuid default gen_random_uuid() primary key,
  name text unique not null, 
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Permissions Table
create table if not exists public.role_permissions (
  id uuid default gen_random_uuid() primary key,
  role_id uuid references public.roles(id) on delete cascade not null,
  permission_key text not null, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(role_id, permission_key)
);

-- 3. Enable RLS
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;

-- 4. Policies (DROP first to allow re-running)

-- ROLES
drop policy if exists "Authenticated users can read roles" on public.roles;
create policy "Authenticated users can read roles"
  on public.roles for select to authenticated using (true);

drop policy if exists "Authenticated users can insert roles" on public.roles;
create policy "Authenticated users can insert roles"
  on public.roles for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update roles" on public.roles;
create policy "Authenticated users can update roles"
  on public.roles for update to authenticated using (true);

drop policy if exists "Authenticated users can delete roles" on public.roles;
create policy "Authenticated users can delete roles"
  on public.roles for delete to authenticated using (true);

-- PERMISSIONS
drop policy if exists "Authenticated users can read permissions" on public.role_permissions;
create policy "Authenticated users can read permissions"
  on public.role_permissions for select to authenticated using (true);

drop policy if exists "Authenticated users can insert permissions" on public.role_permissions;
create policy "Authenticated users can insert permissions"
  on public.role_permissions for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update permissions" on public.role_permissions;
create policy "Authenticated users can update permissions"
  on public.role_permissions for update to authenticated using (true);

drop policy if exists "Authenticated users can delete permissions" on public.role_permissions;
create policy "Authenticated users can delete permissions"
  on public.role_permissions for delete to authenticated using (true);

-- 5. Seed Initial Roles
insert into public.roles (name, description)
values 
  ('admin', 'Acceso total al sistema'),
  ('engineer', 'Acceso limitado a obras asignadas')
on conflict (name) do nothing;
