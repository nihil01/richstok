alter table products
    add column if not exists sku varchar(120);

update products
set sku = upper(replace(slug, '-', '_'))
where sku is null or trim(sku) = '';

alter table products
    alter column sku set not null;

create unique index if not exists ux_products_sku_lower on products (lower(sku));

alter table products
    add column if not exists category varchar(120);

update products
set category = 'General'
where category is null or trim(category) = '';

alter table products
    alter column category set not null;

alter table products
    add column if not exists oem_number varchar(140);
