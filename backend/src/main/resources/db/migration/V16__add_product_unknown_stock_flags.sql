alter table products
    add column if not exists baku_count_unknown boolean;

alter table products
    add column if not exists ganja_count_unknown boolean;

update products
set baku_count_unknown = coalesce(baku_count_unknown, false),
    ganja_count_unknown = coalesce(ganja_count_unknown, false);

alter table products
    alter column baku_count_unknown set default false;

alter table products
    alter column ganja_count_unknown set default false;

alter table products
    alter column baku_count_unknown set not null;

alter table products
    alter column ganja_count_unknown set not null;
