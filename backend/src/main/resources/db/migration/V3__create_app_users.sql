create table if not exists app_users
(
    id            bigserial primary key,
    email         varchar(180) not null unique,
    password_hash varchar(255) not null,
    full_name     varchar(120) not null,
    role          varchar(20)  not null,
    active        boolean      not null default true,
    created_at    timestamptz  not null,
    updated_at    timestamptz  not null
);
