alter table products
    add column if not exists stock_state varchar(20);

update products
set stock_state = case
    when stock_quantity <= 0 then 'OUT_OF_STOCK'
    when stock_quantity <= 5 then 'LOW_STOCK'
    else 'IN_STOCK'
end
where stock_state is null or trim(stock_state) = '';

alter table products
    alter column stock_state set not null;
