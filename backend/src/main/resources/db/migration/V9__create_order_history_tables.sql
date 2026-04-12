create table if not exists orders
(
    id                 bigserial primary key,
    invoice_number     varchar(64)   not null unique,
    user_id            bigint        not null,
    customer_full_name varchar(120)  not null,
    customer_email     varchar(180)  not null,
    customer_phone     varchar(40)   not null,
    address_line1      varchar(220)  not null,
    address_line2      varchar(220),
    city               varchar(120)  not null,
    postal_code        varchar(40),
    country            varchar(120)  not null,
    comment            varchar(500),
    total_amount       numeric(14,2) not null,
    item_count         integer       not null,
    currency_code      varchar(3)    not null default 'AZN',
    status             varchar(20)   not null,
    created_at         timestamptz   not null,
    updated_at         timestamptz   not null
);

create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_status on orders(status);

create table if not exists order_items
(
    id               bigserial primary key,
    order_id         bigint         not null references orders(id) on delete cascade,
    product_id       bigint,
    product_name     varchar(180)   not null,
    product_sku      varchar(120)   not null,
    product_brand    varchar(120),
    product_category varchar(120),
    product_oem      varchar(140),
    product_model    varchar(60),
    unit_price       numeric(12, 2) not null,
    quantity         integer        not null,
    line_total       numeric(14, 2) not null,
    image_url        text,
    stock_state      varchar(20),
    created_at       timestamptz    not null
);

create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_order_items_product_id on order_items(product_id);
