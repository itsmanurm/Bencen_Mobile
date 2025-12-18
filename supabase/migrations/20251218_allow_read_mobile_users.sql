-- Enable RLS on mobile_users if not already
alter table public.mobile_users enable row level security;

-- Allow generic read access to mobile_users so users can see who created a report
drop policy if exists "Authenticated users can read mobile_users" on public.mobile_users;
create policy "Authenticated users can read mobile_users"
on public.mobile_users
for select
to authenticated
using (true);
