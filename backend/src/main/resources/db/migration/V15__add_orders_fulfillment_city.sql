alter table orders
    add column if not exists fulfillment_city varchar(20);

update orders o
set fulfillment_city = case
    when upper(coalesce(ui.city, u.city, '')) like '%GENC%'
        or upper(coalesce(ui.city, u.city, '')) like '%GANJ%'
        then 'GANCA'
    else 'BAKI'
end
from app_users u
left join user_info ui on ui.user_id = u.id
where o.user_id = u.id
  and o.fulfillment_city is null;

update orders
set fulfillment_city = 'BAKI'
where fulfillment_city is null;

alter table orders
    alter column fulfillment_city set not null;
