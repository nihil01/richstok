alter table order_items
    add column if not exists customer_note text;
