-- DEMO ONLY. Run on a disposable development database, never production.
INSERT INTO users(id,email,display_name)
SELECT ('10000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       'customer'||i||'@example.test','Demo Customer '||i
FROM generate_series(1,30) AS i
ON CONFLICT (id) DO NOTHING;
INSERT INTO users(id,email,display_name)
SELECT ('20000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       'provider'||i||'@example.test','Demo Provider '||i
FROM generate_series(1,30) AS i
ON CONFLICT (id) DO NOTHING;
INSERT INTO providers(id,user_id)
SELECT ('30000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       ('20000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid
FROM generate_series(1,30) AS i
ON CONFLICT (id) DO NOTHING;
INSERT INTO provider_categories(provider_id,category_code,status,approved_at)
SELECT ('30000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       (ARRAY['repairs','cleaning','maintenance','outdoor','moving_delivery','personal_assistance'])[((i-1)%6)+1],
       CASE WHEN i%5=0 THEN 'pending' ELSE 'approved' END,
       CASE WHEN i%5=0 THEN NULL ELSE now() END
FROM generate_series(1,30) AS i
ON CONFLICT DO NOTHING;
INSERT INTO provider_categories(provider_id,category_code,status,approved_at)
SELECT ('30000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       (ARRAY['repairs','cleaning','maintenance','outdoor','moving_delivery','personal_assistance'])[(i%6)+1],
       'pending',NULL
FROM generate_series(1,30) AS i
ON CONFLICT DO NOTHING;
INSERT INTO availability(provider_id,starts_at,ends_at)
SELECT ('30000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       now()+interval '1 day',now()+interval '31 days'
FROM generate_series(1,30) AS i
WHERE NOT EXISTS (SELECT 1 FROM availability a WHERE a.provider_id=('30000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid);
