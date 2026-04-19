alter table orders
    add column if not exists customer_language varchar(8);

update orders
set customer_language = coalesce(nullif(trim(customer_language), ''), 'az');

alter table orders
    alter column customer_language set default 'az';

alter table orders
    alter column customer_language set not null;
