alter table orders
    drop column if exists customer_full_name,
    drop column if exists customer_email,
    drop column if exists customer_phone,
    drop column if exists address_line1,
    drop column if exists address_line2,
    drop column if exists city,
    drop column if exists postal_code,
    drop column if exists country;

alter table order_items
    drop column if exists product_name,
    drop column if exists product_sku,
    drop column if exists product_brand,
    drop column if exists product_category,
    drop column if exists product_oem,
    drop column if exists product_model,
    drop column if exists image_url,
    drop column if exists stock_state;

do
$$
    begin
        if not exists (select 1 from pg_constraint where conname = 'fk_order_items_product') then
            alter table order_items
                add constraint fk_order_items_product
                    foreign key (product_id)
                        references products (id)
                        on delete set null;
        end if;
    end
$$;
