insert into products(name, slug, description, price, stock_quantity, brand, active, created_at, updated_at)
values ('Brake Pads Set', 'brake-pads-set', 'Front brake pads set for sedan models', 89.90, 24, 'Bosch', true, now(),
        now()),
       ('Engine Oil 5W-30', 'engine-oil-5w-30', 'Synthetic engine oil 5W-30, 4 liters', 34.50, 120, 'Castrol', true,
        now(), now()),
       ('Air Filter', 'air-filter', 'Standard air filter for compact cars', 18.75, 58, 'Mann Filter', true, now(),
        now())
on conflict (slug) do nothing;
