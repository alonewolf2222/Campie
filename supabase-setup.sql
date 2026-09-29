create table if not exists "listings" (
  id text primary key,
  title text not null,
  price real not null,
  "type" text not null,
  category text not null,
  image text not null,
  seller text not null,
  seller_avatar text not null,
  university text not null,
  level text not null,
  rent_period text,
  description text not null,
  call_number text,
  whatsapp_number text,
  tickets_left integer,
  event_date text,
  available integer not null default 1,
  created_at text not null default (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
  images text,
  campus text,
  initial_price real,
  call_number2 text
);

create table if not exists "food_items" (
  id text primary key,
  name text not null,
  price real not null,
  specialty text not null,
  description text not null,
  image text not null,
  university text not null,
  rating real not null default 0,
  reviews integer not null default 0,
  available integer not null default 1,
  tags text not null default '[]',
  call_number text,
  whatsapp_number text,
  created_at text not null default (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

create table if not exists "events" (
  id text primary key,
  title text not null,
  image text not null,
  price real not null,
  university text not null,
  date text not null,
  time text not null,
  venue text not null,
  tickets_left integer not null default 0,
  call_number text,
  whatsapp_number text,
  created_at text not null default (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);

create table if not exists "stories" (
  id text primary key,
  "user" text not null,
  avatar text not null,
  thumbnail text not null,
  university text not null,
  time_ago text not null,
  viewed integer not null default 0,
  created_at text not null default (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
);
