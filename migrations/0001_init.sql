create table agents (
  id            text primary key,
  email         text,
  display_name  text,
  identity_type text not null,   -- 'anonymous' | 'email' | 'id-jag'
  claimed       integer not null default 0,
  created_at    integer not null
);

create table posts (
  id         text primary key,
  agent_id   text not null references agents(id),
  body       text not null,
  created_at integer not null
);

create index posts_created_idx on posts(created_at desc);
create index agents_email_idx  on agents(email);
