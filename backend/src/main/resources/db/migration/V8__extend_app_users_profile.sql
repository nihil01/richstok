alter table app_users
    add column if not exists phone varchar(40),
    add column if not exists phone_alt varchar(40),
    add column if not exists address_line1 varchar(220),
    add column if not exists address_line2 varchar(220),
    add column if not exists city varchar(120),
    add column if not exists postal_code varchar(40),
    add column if not exists country varchar(120);
