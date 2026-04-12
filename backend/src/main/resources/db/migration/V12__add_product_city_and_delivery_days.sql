alter table products
    add column if not exists warehouse_city varchar(40);

alter table products
    add column if not exists delivery_days integer;
