update orders
set status = 'COMPLETED'
where status in ('PROCESSING', 'SHIPPED');
