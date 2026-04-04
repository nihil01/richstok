create table if not exists products
(
    id             bigserial primary key,
    name           varchar(180)   not null,
    slug           varchar(220)   not null unique,
    description    varchar(2000),
    price          numeric(12, 2) not null,
    stock_quantity integer        not null,
    brand          varchar(120),
    active         boolean        not null default true,
    created_at     timestamptz    not null,
    updated_at     timestamptz    not null
);
