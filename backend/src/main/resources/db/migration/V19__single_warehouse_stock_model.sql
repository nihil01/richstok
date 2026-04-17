alter table products
    add column if not exists count_unknown boolean;

update products
set count_unknown = false
where count_unknown is null;

alter table products
    alter column count_unknown set default false;

alter table products
    alter column count_unknown set not null;

alter table products
    drop column if exists baku_count;

alter table products
    drop column if exists baku_count_unknown;

alter table products
    drop column if exists ganja_count;

alter table products
    drop column if exists ganja_count_unknown;
