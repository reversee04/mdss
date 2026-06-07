-- Move MDSS disease records to the hospitalAPI-compatible identity strategy:
-- UUID primary keys plus ICD-10 codes for stable disease upserts.

ALTER TABLE "Disease"
ADD COLUMN IF NOT EXISTS "icd10Code" VARCHAR(10);

ALTER TABLE "Disease"
ALTER COLUMN disease_id SET DEFAULT gen_random_uuid();

WITH focused_diseases(disease_name, icd10_code) AS (
  VALUES
    ('HIV/AIDS', 'B20'),
    ('Malaria', 'B50'),
    ('Tuberculosis', 'A15'),
    ('Cholera', 'A00')
),
canonical_candidates AS (
  SELECT DISTINCT ON (LOWER(d.disease_name))
    d.disease_id,
    f.icd10_code
  FROM "Disease" d
  JOIN focused_diseases f ON LOWER(d.disease_name) = LOWER(f.disease_name)
  WHERE d.disease_id NOT IN ('hiv', 'malaria', 'tb', 'cholera')
    AND d."icd10Code" IS NULL
  ORDER BY LOWER(d.disease_name), d.created_at ASC
)
UPDATE "Disease" d
SET "icd10Code" = canonical_candidates.icd10_code
FROM canonical_candidates
WHERE d.disease_id = canonical_candidates.disease_id;

WITH focused_simple_ids(disease_id, icd10_code) AS (
  VALUES
    ('hiv', 'B20'),
    ('malaria', 'B50'),
    ('tb', 'A15'),
    ('cholera', 'A00')
)
UPDATE "Disease" d
SET "icd10Code" = focused_simple_ids.icd10_code
FROM focused_simple_ids
WHERE d.disease_id = focused_simple_ids.disease_id
  AND d."icd10Code" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Disease" existing
    WHERE existing."icd10Code" = focused_simple_ids.icd10_code
  );

CREATE UNIQUE INDEX IF NOT EXISTS "Disease_icd10Code_key" ON "Disease"("icd10Code");
