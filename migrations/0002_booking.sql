-- BT Automazgātava booking engine
-- user_id is TEXT to match Better Auth ids.

create table if not exists profiles (
  user_id text primary key,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  banned boolean not null default false,
  ban_reason text,
  banned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_ban_state_chk check (
    (banned = false and banned_at is null and ban_reason is null)
    or (banned = true and banned_at is not null)
  ),
  constraint profiles_ban_reason_len_chk check (
    ban_reason is null or char_length(ban_reason) between 1 and 300
  ),
  constraint profiles_phone_len_chk check (
    phone is null or char_length(trim(phone)) between 8 and 20
  )
);

create table if not exists vehicle_makes (
  id text primary key default (gen_random_uuid()::text),
  name text not null unique,
  source text not null default 'local',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists vehicle_models (
  id text primary key default (gen_random_uuid()::text),
  make_id text not null references vehicle_makes(id) on delete cascade,
  name text not null,
  category text not null check (category in ('passenger', 'crossover', 'minivan', 'commercial')),
  source text not null default 'local',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (make_id, name)
);

create index if not exists vehicle_models_make_id_idx on vehicle_models(make_id);
create index if not exists vehicle_models_category_idx on vehicle_models(category);

create table if not exists cars (
  id text primary key default (gen_random_uuid()::text),
  user_id text not null,
  make_id text not null references vehicle_makes(id),
  model_id text not null references vehicle_models(id),
  make_name text not null,
  model_name text not null,
  registration_number text not null,
  category text not null check (category in ('passenger', 'crossover', 'minivan', 'commercial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index if not exists cars_user_id_idx on cars(user_id);
create unique index if not exists cars_registration_number_ci_idx
  on cars (lower(registration_number));

create table if not exists bookings (
  id text primary key default (gen_random_uuid()::text),
  user_id text not null,
  car_id text not null,
  booking_date date not null,
  booking_time time not null,
  price_cents integer not null check (price_cents > 0),
  status text not null default 'confirmed' check (
    status in (
      'pending',
      'confirmed',
      'completed',
      'cancelled_customer',
      'cancelled_admin',
      'no_show'
    )
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_car_owner_fk
    foreign key (car_id, user_id) references cars(id, user_id) on delete restrict,
  constraint bookings_notes_length_chk check (notes is null or char_length(notes) <= 1000),
  constraint bookings_booking_time_slot_chk check (
    booking_time >= time '09:00'
    and booking_time < time '21:00'
    and extract(minute from booking_time) = 0
    and extract(second from booking_time) = 0
  )
);

create index if not exists bookings_user_id_idx on bookings(user_id);
create index if not exists bookings_date_time_idx on bookings(booking_date, booking_time);
create index if not exists bookings_car_id_idx on bookings(car_id);

create unique index if not exists bookings_one_active_slot_idx
  on bookings (booking_date, booking_time)
  where status in ('pending', 'confirmed');

create table if not exists blocked_slots (
  id text primary key default (gen_random_uuid()::text),
  booking_date date not null,
  booking_time time,
  reason text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  constraint blocked_slots_reason_length_chk check (
    char_length(trim(reason)) between 1 and 300
  ),
  constraint blocked_slots_booking_time_slot_chk check (
    booking_time is null
    or (
      booking_time >= time '09:00'
      and booking_time < time '21:00'
      and extract(minute from booking_time) = 0
      and extract(second from booking_time) = 0
    )
  )
);

create unique index if not exists blocked_slots_whole_day_idx
  on blocked_slots(booking_date)
  where booking_time is null;

create unique index if not exists blocked_slots_slot_idx
  on blocked_slots(booking_date, booking_time)
  where booking_time is not null;

create table if not exists holidays (
  id text primary key default (gen_random_uuid()::text),
  date date not null unique,
  name text not null,
  active boolean not null default true,
  constraint holidays_name_length_chk check (char_length(trim(name)) between 1 and 150)
);

create table if not exists audit_logs (
  id text primary key default (gen_random_uuid()::text),
  actor_id text,
  action text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_id_idx on audit_logs(actor_id);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings(key, value) values
  ('timezone', '"Europe/Riga"'::jsonb),
  ('opening_time', '"09:00"'::jsonb),
  ('closing_time', '"21:00"'::jsonb),
  ('slot_minutes', '60'::jsonb),
  ('customer_booking_window_days', '30'::jsonb),
  ('max_customer_bookings_in_window', '3'::jsonb),
  ('max_customer_bookings_per_car_in_window', '2'::jsonb)
on conflict (key) do nothing;

insert into holidays (date, name) values
  ('2026-06-23', 'Līgo diena'),
  ('2026-06-24', 'Jāņi'),
  ('2027-06-23', 'Līgo diena'),
  ('2027-06-24', 'Jāņi'),
  ('2028-06-23', 'Līgo diena'),
  ('2028-06-24', 'Jāņi'),
  ('2029-06-23', 'Līgo diena'),
  ('2029-06-24', 'Jāņi'),
  ('2030-06-23', 'Līgo diena'),
  ('2030-06-24', 'Jāņi')
on conflict (date) do nothing;

create or replace function enforce_blocked_slot_scope()
returns trigger
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(hashtext('booking-date:' || new.booking_date::text));

  if new.booking_time is null then
    if exists (
      select 1 from blocked_slots
      where booking_date = new.booking_date
        and booking_time is not null
        and id <> new.id
    ) then
      raise exception 'WHOLE_DAY_BLOCK_CONFLICT'
        using errcode = '23514';
    end if;
  elsif exists (
    select 1 from blocked_slots
    where booking_date = new.booking_date
      and booking_time is null
      and id <> new.id
  ) then
    raise exception 'SLOT_BLOCK_CONFLICT_WITH_WHOLE_DAY'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists blocked_slots_scope_conflict_trg on blocked_slots;
create trigger blocked_slots_scope_conflict_trg
before insert or update of booking_date, booking_time on blocked_slots
for each row
execute function enforce_blocked_slot_scope();
