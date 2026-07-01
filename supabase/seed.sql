-- Minimal seed: default roles + property. Run after 0001_init.sql.
-- Rooms/services/seasons/etc. are seeded from the app's mock data layer
-- (src/lib/data/seed/*) until you're ready to manage them from Admin.

insert into roles (key, label, permissions) values
  ('owner', 'Owner', '{"all": true}'),
  ('manager', 'Manager', '{"bookings": true, "content": true, "settings": true}'),
  ('staff', 'Staff', '{"bookings": true}'),
  ('customer', 'Customer', '{}')
on conflict (key) do nothing;

insert into properties (name, legal_name, address, phone, whatsapp, email, currency)
values ('Baeco Hospitality', 'Baeco Hospitality Enterprise', 'Str. Exemplu nr. 1, România', '+40 700 000 000', '40700000000', 'rezervari@baeco-hospitality.example.com', 'EUR')
on conflict do nothing;
