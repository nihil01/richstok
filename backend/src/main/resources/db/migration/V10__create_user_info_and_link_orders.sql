create table if not exists user_info
(
    id            bigserial primary key,
    user_id       bigint       not null unique references app_users (id) on delete cascade,
    phone         varchar(40),
    phone_alt     varchar(40),
    address_line1 varchar(220),
    address_line2 varchar(220),
    city          varchar(120),
    postal_code   varchar(40),
    country       varchar(120),
    created_at    timestamptz  not null,
    updated_at    timestamptz  not null
);

create index if not exists idx_user_info_user_id on user_info (user_id);

insert into user_info (user_id, phone, phone_alt, address_line1, address_line2, city, postal_code, country, created_at, updated_at)
select u.id,
       u.phone,
       u.phone_alt,
       u.address_line1,
       u.address_line2,
       u.city,
       u.postal_code,
       u.country,
       now(),
       now()
from app_users u
left join user_info ui on ui.user_id = u.id
where ui.id is null;

alter table orders
    add column if not exists user_info_id bigint;

create index if not exists idx_orders_user_info_id on orders (user_info_id);

update orders o
set user_info_id = ui.id
from user_info ui
where o.user_info_id is null
  and ui.user_id = o.user_id;

do
$$
    begin
        if not exists (select 1 from pg_constraint where conname = 'fk_orders_user_info') then
            alter table orders
                add constraint fk_orders_user_info
                    foreign key (user_info_id)
                        references user_info (id)
                        on delete set null;
        end if;
    end
$$;
