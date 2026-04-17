alter table order_items
    add column if not exists returned_quantity integer;

update order_items
set returned_quantity = coalesce(returned_quantity, 0);

alter table order_items
    alter column returned_quantity set default 0;

alter table order_items
    alter column returned_quantity set not null;

alter table order_items
    add column if not exists return_reason text;
