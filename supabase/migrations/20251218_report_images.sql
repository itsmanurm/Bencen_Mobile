-- 1. Add photos column to partes_diarios
alter table public.partes_diarios 
add column if not exists photos text[] default '{}';

-- 2. Create Storage Bucket 'report-evidence'
insert into storage.buckets (id, name, public)
values ('report-evidence', 'report-evidence', true)
on conflict (id) do nothing;

-- 3. Storage Policies (Standard Public Read / Authenticated Upload)

-- Allow Public Read
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'report-evidence' );

-- Allow Authenticated Upload
create policy "Authenticated Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'report-evidence' );

-- Allow Authenticated Update (if needed)
create policy "Authenticated Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'report-evidence' );

-- Allow Authenticated Delete
create policy "Authenticated Delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'report-evidence' );
