alter table products
    add column if not exists baku_count integer;

alter table products
    add column if not exists ganja_count integer;

update products
set baku_count = case
    when baku_count is not null then baku_count
    when upper(coalesce(warehouse_city, '')) in ('GANCA', 'GANJA') then 0
    else coalesce(stock_quantity, 0)
end,
    ganja_count = case
    when ganja_count is not null then ganja_count
    when upper(coalesce(warehouse_city, '')) in ('GANCA', 'GANJA') then coalesce(stock_quantity, 0)
    else 0
end;

update products
set baku_count = coalesce(baku_count, 0),
    ganja_count = coalesce(ganja_count, 0);

update products
set stock_quantity = coalesce(baku_count, 0) + coalesce(ganja_count, 0);

alter table products
    alter column baku_count set default 0;

alter table products
    alter column ganja_count set default 0;

alter table products
    alter column baku_count set not null;

alter table products
    alter column ganja_count set not null;
