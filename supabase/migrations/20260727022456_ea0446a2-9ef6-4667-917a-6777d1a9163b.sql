UPDATE public.synnex_products
SET image_url = '/__l5e/assets-v1/8d07a8b6-247a-4be7-a60f-c87c0b1053e0/longi-645w.jpg'
WHERE image_url LIKE '%solar-placeholders/longi-645w.jpg';

UPDATE public.synnex_products
SET image_url = '/__l5e/assets-v1/ff890a9f-b62d-42f9-ab14-59471c09fae3/longi-650w.jpg'
WHERE image_url LIKE '%solar-placeholders/longi-650w.jpg';

UPDATE public.synnex_products
SET image_url = '/__l5e/assets-v1/a3d73d5d-df6f-49bb-8cd9-1553cd80092f/tapo-a201.jpg'
WHERE image_url LIKE '%solar-placeholders/tapo-a201.jpg';

UPDATE public.synnex_products
SET image_url = '/__l5e/assets-v1/ae3c1a04-836c-4dba-a4c0-277ab6e6e19d/vigi-sp6020.jpg'
WHERE image_url LIKE '%solar-placeholders/vigi-sp6020.jpg';

UPDATE public.synnex_products
SET image_url = '/__l5e/assets-v1/beb762c6-f4f5-421e-8a44-50bf9e86d344/vigi-sp9030.jpg'
WHERE image_url LIKE '%solar-placeholders/vigi-sp9030.jpg';

-- Also rewrite any references inside image_gallery arrays
UPDATE public.synnex_products
SET image_gallery = (
  SELECT jsonb_agg(
    CASE
      WHEN value::text LIKE '%solar-placeholders/longi-645w.jpg' THEN '/__l5e/assets-v1/8d07a8b6-247a-4be7-a60f-c87c0b1053e0/longi-645w.jpg'
      WHEN value::text LIKE '%solar-placeholders/longi-650w.jpg' THEN '/__l5e/assets-v1/ff890a9f-b62d-42f9-ab14-59471c09fae3/longi-650w.jpg'
      WHEN value::text LIKE '%solar-placeholders/tapo-a201.jpg' THEN '/__l5e/assets-v1/a3d73d5d-df6f-49bb-8cd9-1553cd80092f/tapo-a201.jpg'
      WHEN value::text LIKE '%solar-placeholders/vigi-sp6020.jpg' THEN '/__l5e/assets-v1/ae3c1a04-836c-4dba-a4c0-277ab6e6e19d/vigi-sp6020.jpg'
      WHEN value::text LIKE '%solar-placeholders/vigi-sp9030.jpg' THEN '/__l5e/assets-v1/beb762c6-f4f5-421e-8a44-50bf9e86d344/vigi-sp9030.jpg'
      ELSE value::text
    END
  )
  FROM jsonb_array_elements(image_gallery)
  WHERE image_gallery IS NOT NULL
)
WHERE image_gallery IS NOT NULL AND EXISTS (
  SELECT 1 FROM jsonb_array_elements(image_gallery) AS g
  WHERE g::text LIKE '%solar-placeholders%'
);