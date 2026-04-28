alter table orders
    add column if not exists recorded_as_debt boolean;

update orders
set recorded_as_debt = false
where recorded_as_debt is null;

alter table orders
    alter column recorded_as_debt set default false;

alter table orders
    alter column recorded_as_debt set not null;
