create table blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  content         text not null,
  excerpt         text,
  cover_image_url text,
  published       boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_blog_posts_slug      on blog_posts(slug);
create index idx_blog_posts_published on blog_posts(published);
