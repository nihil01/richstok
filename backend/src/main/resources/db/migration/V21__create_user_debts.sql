create table if not exists user_debts
(
    id           bigserial primary key,
    user_id      bigint         not null unique references app_users (id) on delete cascade,
    debt_limit   numeric(14, 2) not null default 0,
    current_debt numeric(14, 2) not null default 0,
    created_at   timestamptz    not null default now(),
    updated_at   timestamptz    not null default now()
);

insert into user_debts (user_id, debt_limit, current_debt)
select users.id, 0, 0
from app_users users
where not exists(
        select 1
        from user_debts debts
        where debts.user_id = users.id
    );

