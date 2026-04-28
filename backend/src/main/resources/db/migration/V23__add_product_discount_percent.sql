alter table products
    add column if not exists discount_percent numeric(5, 2);

update products
set discount_percent = 0
where discount_percent is null;

alter table products
    alter column discount_percent set default 0;

alter table products
    alter column discount_percent set not null;

alter table products
    drop constraint if exists chk_products_discount_percent;

alter table products
    add constraint chk_products_discount_percent check (discount_percent >= 0 and discount_percent <= 100);
