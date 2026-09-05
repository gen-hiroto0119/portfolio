-- Owner membership is provisioned separately by a trusted database operator.
-- A signed-in user cannot add themselves, even if public signup is enabled.
create table public.cms_owners (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.blog_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.cms_owners(user_id),
  slug text not null unique check (length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) between 1 and 180),
  description text not null default '' check (length(description) <= 500),
  date date not null default current_date,
  category text not null default 'tech' check (category in ('tech', 'photo', 'daily')),
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  body_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
    check ((jsonb_typeof(body_json) = 'object' and body_json->>'type' = 'doc' and jsonb_typeof(body_json->'content') = 'array') is true)
    check (octet_length(body_json::text) <= 2097152),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_drafts_owner_updated_idx on public.blog_drafts(owner_id, updated_at desc);

create table public.blog_publications (
  post_id uuid primary key references public.blog_drafts(id) on delete cascade,
  owner_id uuid not null references public.cms_owners(user_id),
  slug text not null unique,
  title text not null,
  description text not null,
  date date not null,
  category text not null,
  tags text[] not null,
  body_json jsonb not null,
  source_revision integer not null,
  published_at timestamptz not null default now()
);
create index blog_publications_date_idx on public.blog_publications(date desc, published_at desc);
create index blog_publications_owner_idx on public.blog_publications(owner_id);

create table public.media_assets (
  id uuid primary key,
  owner_id uuid not null references public.cms_owners(user_id),
  storage_path text not null unique,
  filename text not null check (length(filename) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/gif', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  width integer check (width between 1 and 50000),
  height integer check (height between 1 and 50000),
  alt text not null default '' check (length(alt) <= 1000),
  created_at timestamptz not null default now(),
  check (storage_path = owner_id::text || '/' || id::text || '.' ||
    case mime_type when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/gif' then 'gif' when 'image/webp' then 'webp' end)
);
create index media_assets_owner_created_idx on public.media_assets(owner_id, created_at desc);

create table public.blog_publication_assets (
  post_id uuid not null references public.blog_publications(post_id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  primary key (post_id, asset_id)
);
create index blog_publication_assets_asset_idx on public.blog_publication_assets(asset_id);

alter table public.cms_owners enable row level security;
alter table public.blog_drafts enable row level security;
alter table public.blog_publications enable row level security;
alter table public.media_assets enable row level security;
alter table public.blog_publication_assets enable row level security;

-- Explicit grants are required on new Supabase projects. Publications and their
-- image references have no client write grants; only the atomic RPCs write them.
revoke all on public.cms_owners, public.blog_drafts, public.blog_publications, public.media_assets, public.blog_publication_assets from anon, authenticated;
grant select on public.cms_owners to authenticated;
grant select, insert, update, delete on public.blog_drafts to authenticated;
grant select, insert, delete on public.media_assets to authenticated;
grant update (alt) on public.media_assets to authenticated;
grant select on public.blog_publications, public.blog_publication_assets to anon, authenticated;
grant select (id, storage_path, mime_type) on public.media_assets to anon;

create policy owners_read_self on public.cms_owners for select to authenticated using (user_id = (select auth.uid()));
create policy drafts_owner on public.blog_drafts for all to authenticated
  using (owner_id = (select auth.uid()) and exists (select 1 from public.cms_owners where user_id = (select auth.uid())))
  with check (owner_id = (select auth.uid()) and exists (select 1 from public.cms_owners where user_id = (select auth.uid())));
create policy publications_read on public.blog_publications for select to anon, authenticated using (true);
create policy publication_assets_read on public.blog_publication_assets for select to anon, authenticated using (true);
create policy media_owner on public.media_assets for all to authenticated
  using (owner_id = (select auth.uid()) and exists (select 1 from public.cms_owners where user_id = (select auth.uid())))
  with check (owner_id = (select auth.uid()) and exists (select 1 from public.cms_owners where user_id = (select auth.uid())));
create policy media_published_read on public.media_assets for select to anon, authenticated
  using (exists (select 1 from public.blog_publication_assets where asset_id = media_assets.id));

create function public.cms_touch_draft() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.id <> old.id or new.owner_id <> old.owner_id or new.created_at <> old.created_at then
    raise exception 'Draft identity is immutable' using errcode = '23514';
  end if;
  if new.revision <> old.revision + 1 then
    raise exception 'CMS_REVISION_CONFLICT' using errcode = '40001';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.cms_touch_draft() from public, anon, authenticated;
create trigger cms_draft_updated before update on public.blog_drafts for each row execute function public.cms_touch_draft();

-- Intentional narrow RLS bypass: clients cannot write either publication table.
-- The verified owner and row ownership checks happen before taking a row lock.
create function public.publish_blog_post(p_post_id uuid, p_expected_revision integer)
returns setof public.blog_publications
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_draft public.blog_drafts%rowtype;
  v_asset_ids uuid[];
begin
  if v_user is null or not exists (select 1 from public.cms_owners where user_id = v_user) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  select * into v_draft from public.blog_drafts where id = p_post_id and owner_id = v_user for update;
  if not found then raise exception 'Draft not found' using errcode = 'P0002'; end if;
  if p_expected_revision is null or p_expected_revision <> v_draft.revision then
    raise exception 'CMS_REVISION_CONFLICT' using errcode = '40001';
  end if;

  with recursive nodes(value) as (
    select v_draft.body_json
    union all
    select child.value from nodes cross join lateral jsonb_array_elements(
      case when jsonb_typeof(nodes.value->'content') = 'array' then nodes.value->'content' else '[]'::jsonb end
    ) as child(value)
  )
  select coalesce(array_agg(distinct (value->'attrs'->>'assetId')::uuid), '{}'::uuid[])
    into v_asset_ids from nodes where value->>'type' = 'image';

  if exists (
    select 1 from unnest(v_asset_ids) as wanted(id)
    left join public.media_assets as asset on asset.id = wanted.id and asset.owner_id = v_user
    where asset.id is null
  ) then raise exception 'CMS_INVALID_ASSET' using errcode = '23514'; end if;

  insert into public.blog_publications (post_id, owner_id, slug, title, description, date, category, tags, body_json, source_revision, published_at)
  values (v_draft.id, v_draft.owner_id, v_draft.slug, v_draft.title, v_draft.description, v_draft.date, v_draft.category, v_draft.tags, v_draft.body_json, v_draft.revision, now())
  on conflict (post_id) do update set
    slug = excluded.slug, title = excluded.title, description = excluded.description, date = excluded.date,
    category = excluded.category, tags = excluded.tags, body_json = excluded.body_json,
    source_revision = excluded.source_revision, published_at = excluded.published_at;
  delete from public.blog_publication_assets where post_id = v_draft.id;
  insert into public.blog_publication_assets (post_id, asset_id) select v_draft.id, id from unnest(v_asset_ids) as wanted(id);
  return query select * from public.blog_publications where post_id = v_draft.id;
end;
$$;
revoke all on function public.publish_blog_post(uuid, integer) from public, anon, authenticated;
grant execute on function public.publish_blog_post(uuid, integer) to authenticated;

create function public.unpublish_blog_post(p_post_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_slug text;
  v_published_slug text;
begin
  if v_user is null or not exists (select 1 from public.cms_owners where user_id = v_user) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  select slug into v_slug from public.blog_drafts where id = p_post_id and owner_id = v_user for update;
  if not found then raise exception 'Draft not found' using errcode = 'P0002'; end if;
  delete from public.blog_publications where post_id = p_post_id returning slug into v_published_slug;
  return coalesce(v_published_slug, v_slug);
end;
$$;
revoke all on function public.unpublish_blog_post(uuid) from public, anon, authenticated;
grant execute on function public.unpublish_blog_post(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', false, 10485760, array['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Owner access also covers a newly uploaded object before metadata registration.
create policy portfolio_media_owner_read on storage.objects for select to authenticated using (
  bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.cms_owners where user_id = (select auth.uid()))
);
create policy portfolio_media_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.cms_owners where user_id = (select auth.uid()))
);
create policy portfolio_media_owner_delete on storage.objects for delete to authenticated using (
  bucket_id = 'portfolio-media' and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.cms_owners where user_id = (select auth.uid()))
  and not exists (select 1 from public.media_assets where storage_path = objects.name)
);
create policy portfolio_media_published_read on storage.objects for select to anon, authenticated using (
  bucket_id = 'portfolio-media' and exists (
    select 1 from public.media_assets join public.blog_publication_assets on asset_id = media_assets.id
    where storage_path = objects.name
  )
);
