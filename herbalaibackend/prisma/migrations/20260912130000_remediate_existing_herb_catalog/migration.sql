-- Correct the existing official herb catalog against the PITAHC directory
-- accessed 2026-09-12. Changed embeddings are cleared and regenerated after
-- this migration so Dr.Ai cannot retrieve stale content.

UPDATE "Herb" SET
  "localName" = 'Lagundi', "scientificName" = 'Vitex negundo', "sourceScientificName" = 'Vitex negundo',
  category = 'Respiratory',
  "medicinalUses" = $copy$PITAHC lists antitussive (cough-relieving) clinical evidence for Lagundi in the Philippine setting.$copy$,
  "preparationMethod" = $copy$Boil crushed fresh Lagundi leaves in 2 cups of water until only half of the water remains. Keep the pot uncovered once it starts boiling.$copy$,
  dosage = $copy$Amount of crushed leaves listed by PITAHC: 1½ tablespoons for ages 2–6, 3 tablespoons for ages 7–12, and 6 tablespoons for ages 13 and above.$copy$,
  "regionFound" = 'Distributed throughout the Philippines.',
  warnings = $copy$Consult a health professional for diagnosis and advice, especially for young children or if a cough persists or worsens.$copy$,
  "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") = lower('Vitex negundo');

UPDATE "Herb" SET
  "localName" = 'Sambong', "scientificName" = 'Blumea balsamifera', "sourceScientificName" = 'Blumea balsamifera',
  category = 'Renal / Diuretic',
  "medicinalUses" = $copy$PITAHC lists clinical diuretic and antiuricemic evidence in the Philippine setting. Kidney-stone dissolution is listed as pre-clinical evidence.$copy$,
  "preparationMethod" = $copy$Boil minced, freshly picked Sambong leaves in 2 glasses of water until only half remains, keeping the pot uncovered once boiling. Cool, strain, and divide into 3 portions.$copy$,
  dosage = $copy$Leaf amount listed by PITAHC: 3 tablespoons for ages 7–12 and 6 tablespoons for ages 13 and above. Drink 1 portion of the prepared decoction 3 times daily.$copy$,
  "regionFound" = 'Distributed throughout the Philippines.',
  warnings = $copy$Visit a health center for diagnosis and treatment guidance for suspected kidney stones. Follow professional advice about fluid intake, especially if medically fluid-restricted.$copy$,
  "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") = lower('Blumea balsamifera');

UPDATE "Herb" SET
  "localName" = 'Ampalaya', "scientificName" = 'Momordica charantia', "sourceScientificName" = 'Momordica charantia',
  category = 'Metabolic / Endocrine',
  "medicinalUses" = $copy$PITAHC lists clinical evidence for antidiabetes and metabolic syndrome. Its preparation guidance is specifically framed as professional advice for helping control blood sugar.$copy$,
  "preparationMethod" = $copy$Under health-professional guidance, PITAHC describes eating Ampalaya leaves as salad or with meals, or boiling 2 cups of sprouts in 2 glasses of water until half remains, then straining the decoction.$copy$,
  dosage = $copy$PITAHC describes 1 cup of leaves twice daily, or ⅓ of the prepared decoction 3 times daily, 30 minutes before meals, when advised by a health professional.$copy$,
  "regionFound" = 'Distributed throughout the Philippines.',
  warnings = $copy$Diabetes requires diagnosis and monitoring by a health professional. Do not replace or change prescribed diabetes treatment without medical advice.$copy$,
  "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") = lower('Momordica charantia');

UPDATE "Herb" SET
  "localName" = 'Bawang', "scientificName" = 'Allium sativum', "sourceScientificName" = 'Allium sativum',
  category = 'Cardiovascular',
  "medicinalUses" = $copy$PITAHC cites clinical evidence for hyperlipidemia, hypertension, and arteriosclerosis.$copy$,
  "preparationMethod" = $copy$Consult a health center for diagnosis and advice. PITAHC notes that a health professional may advise garlic soaked in vinegar, sterilized, grilled, or fried in a little oil and taken with meals.$copy$,
  dosage = $copy$PITAHC states that a health professional may advise 2–3 garlic bulbs, 3 times daily with breakfast, lunch, and dinner.$copy$,
  "regionFound" = 'Extensively grown in Batanes, Batangas, Nueva Ecija, Ilocos Norte, Mindoro, and Cotabato.',
  warnings = $copy$Reported side effects include vomiting, heartburn, diarrhea, allergies, contact dermatitis, or asthma. Dog and snake bites require immediate wound washing and urgent medical care, not garlic treatment.$copy$,
  "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") = lower('Allium sativum');

UPDATE "Herb" SET
  "localName" = 'Bayabas', "scientificName" = 'Psidium guajava', "sourceScientificName" = 'Psidium guajava',
  category = 'Antiseptic / Oral Health',
  "medicinalUses" = $copy$PITAHC cites clinical evidence including gingivitis and acute diarrhea, and documents traditional topical washing for wounds or scabies and gargling for swollen gums.$copy$,
  "preparationMethod" = $copy$For wounds or scabies, boil 1–2 handfuls of leafy tops in a small pot of water, cool to lukewarm, and use as a wash. For swollen gums, boil 1 handful, cool, and use as a gargle.$copy$,
  dosage = $copy$PITAHC describes using the lukewarm wash or gargle twice daily while symptoms improve.$copy$,
  "regionFound" = 'Distributed throughout the Philippines.',
  warnings = $copy$Consult a health professional if symptoms persist or if fever, spreading redness, or other signs of infection occur. Never apply hot liquid to skin or gums.$copy$,
  "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") = lower('Psidium guajava');

UPDATE "Herb" SET
  "localName" = 'Tsaang Gubat', "scientificName" = 'Ehretia microphylla', "sourceScientificName" = 'Carmona retusa',
  category = 'Gastrointestinal',
  "medicinalUses" = $copy$PITAHC cites caries-preventive and antispasmodic clinical evidence in the Philippine setting and provides preparation guidance for stomach pain.$copy$,
  "preparationMethod" = $copy$Boil chopped fresh Tsaang Gubat leaves in 1 glass of water until half remains, keeping the pot uncovered once boiling. Cool and strain.$copy$,
  dosage = $copy$Leaf amount listed by PITAHC: 1½ tablespoons for ages 7–12 and 3 tablespoons for ages 13 and above. The directory does not recommend this preparation for children below 7.$copy$,
  "regionFound" = 'Distributed throughout the Philippines.',
  warnings = $copy$Consult a health professional if stomach pain persists or is severe, or if other concerning symptoms occur.$copy$,
  "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") IN (lower('Ehretia microphylla'), lower('Carmona retusa'));

UPDATE "Herb" SET
  "localName" = 'Akapulko', "scientificName" = 'Senna alata', "sourceScientificName" = 'Senna alata',
  category = 'Antifungal / Dermatological',
  "medicinalUses" = $copy$PITAHC lists clinical antifungal and antiscabies evidence and provides topical guidance for ringworm and other fungal skin infections.$copy$,
  "preparationMethod" = $copy$Grind enough fresh Akapulko leaves to obtain extract and apply it to the affected skin. PITAHC also describes a cooled leaf decoction as an alternative wash if the fresh extract causes allergy.$copy$,
  dosage = $copy$Apply the extract or cooled wash to the affected area twice daily for up to 3 weeks, following PITAHC guidance.$copy$,
  "regionFound" = 'Distributed throughout the Philippines.',
  warnings = $copy$For external use. Stop use if an allergic or severe skin reaction occurs, and seek professional advice if the condition persists, spreads, or is uncertain.$copy$,
  "imageUrl" = NULL,
  "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") = lower('Senna alata');

UPDATE "Herb" SET
  "localName" = 'Niyog-niyogan', "scientificName" = 'Combretum indicum', "sourceScientificName" = 'Quisqualis indica',
  category = 'Anti-helminthic',
  "medicinalUses" = $copy$PITAHC lists clinical anthelmintic evidence and provides seed-use guidance for intestinal worms.$copy$,
  "preparationMethod" = $copy$Take seeds from the plant's withered fruit, chew them thoroughly, and follow with one-half to 1 glass of water, as described by PITAHC.$copy$,
  dosage = $copy$Seed count listed by PITAHC: 4–5 seeds for ages 4–6, 6–7 seeds for ages 7–12, and 8–10 seeds for ages 13 and above. The directory says the same dose may be repeated after 1 week if no worms pass.$copy$,
  "regionFound" = 'Widely distributed throughout the Philippines.',
  warnings = $copy$Do not exceed the listed seed count. Overconsumption may cause nausea, hiccups, stomach pain, or diarrhea. Consult a health professional for diagnosis and treatment of suspected intestinal worms.$copy$,
  "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") IN (lower('Combretum indicum'), lower('Quisqualis indica'));

UPDATE "Herb" SET
  "localName" = 'Ulasimang Bato', "scientificName" = 'Peperomia pellucida', "sourceScientificName" = 'Peperomia pellucida',
  category = 'Metabolic / Uric Acid',
  "medicinalUses" = $copy$PITAHC lists anti-gout among clinical evidence and antihyperuricemic activity among pre-clinical evidence.$copy$,
  "preparationMethod" = $copy$PITAHC describes eating uncompressed leafy tops as salad, or boiling 1½ glasses (3 cups) of the plant in 2 glasses of water until half remains and then straining.$copy$,
  dosage = $copy$When advised by a health professional, PITAHC describes 1 cup of leafy tops 3 times daily, or ⅓ glass of the prepared decoction 3 times daily after meals.$copy$,
  "regionFound" = 'Distributed throughout the Philippines.',
  warnings = $copy$Consult a health professional for diagnosis and treatment of gout or elevated uric acid. Do not replace prescribed treatment with this preparation without medical advice.$copy$,
  "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") = lower('Peperomia pellucida');

-- Merge the duplicate Clinopodium records before correcting the retained record.
DO $merge$
DECLARE
  canonical_id TEXT;
  duplicate_id TEXT;
BEGIN
  SELECT id INTO canonical_id
  FROM "Herb"
  WHERE lower("scientificName") = lower('Clinopodium douglasii')
  ORDER BY "isDohApproved" DESC, "createdAt" ASC
  LIMIT 1;

  IF canonical_id IS NOT NULL THEN
    FOR duplicate_id IN
      SELECT id FROM "Herb"
      WHERE lower("scientificName") = lower('Clinopodium douglasii') AND id <> canonical_id
    LOOP
      UPDATE "HerbComment" SET "herbId" = canonical_id WHERE "herbId" = duplicate_id;
      UPDATE "HerbSource" SET "herbId" = canonical_id WHERE "herbId" = duplicate_id;
      DELETE FROM "Herb" WHERE id = duplicate_id;
    END LOOP;

    UPDATE "Herb" SET
      "localName" = 'Yerba Buena', "cebuanoName" = 'Hilbas / Herba Buena',
      "scientificName" = 'Mentha × villosa', "sourceScientificName" = 'Mentha cordifolia',
      category = 'Analgesic / Pain Relief',
      "medicinalUses" = $copy$PITAHC lists analgesic clinical evidence in the Philippine setting and provides preparation guidance for toothache and topical use for headache.$copy$,
      "preparationMethod" = $copy$For toothache, boil ground fresh leaves in 2 glasses of water until half remains, cool, strain, and divide into 2 portions. For headache, PITAHC describes crushing fresh leaves and massaging the extract onto the forehead and top of the head.$copy$,
      dosage = $copy$Leaf amount listed by PITAHC: 3 tablespoons for ages 7–12 and 6 tablespoons for ages 13 and above. Drink 1 portion, with the second portion after 3–4 hours only if pain persists.$copy$,
      "regionFound" = 'Distributed throughout the Philippines.',
      warnings = $copy$Persistent toothache or headache requires assessment at a health center. Safety information for pregnancy, medicines, and younger children is not provided in the cited directory guidance.$copy$,
      "imageUrl" = NULL,
      "isDohApproved" = true, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
      "evidenceClass" = 'DOH_PITAHC_LISTED', provenance = 'BUILT_IN', "reviewedAt" = NOW(), embedding = NULL
    WHERE id = canonical_id;
  END IF;
END $merge$;

-- Unsupported records remain preserved for later research but are excluded
-- from both the public Library and Dr.Ai retrieval.
UPDATE "Herb" SET
  "publicationStatus" = 'HOLD', "evidenceClass" = 'UNASSESSED',
  "isDohApproved" = false, "isVerified" = false, "reviewedAt" = NOW(), embedding = NULL
WHERE lower("scientificName") IN (
  lower('Hibiscus rosa-sinensis'), lower('Heliotropium indicum'), lower('Cymbopogon citratus')
);

-- Attach the government directory to all ten official records.
DELETE FROM "HerbSource"
WHERE title = 'PITAHC Directory of Herbs'
  AND "herbId" IN (SELECT id FROM "Herb" WHERE "evidenceClass" = 'DOH_PITAHC_LISTED');

INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "publishedAt", "accessedAt")
SELECT id,
  'PITAHC Directory of Herbs',
  'Philippine Institute of Traditional and Alternative Health Care',
  'https://pitahc.gov.ph/herbs-directory/',
  NULL,
  ARRAY['identity', 'dohListing', 'medicinalUses', 'preparationMethod', 'dosage', 'regionFound'],
  '2026 directory',
  TIMESTAMP '2026-09-12 00:00:00'
FROM "Herb"
WHERE "evidenceClass" = 'DOH_PITAHC_LISTED' AND "publicationStatus" = 'PUBLISHED';

INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "accessedAt")
SELECT id,
  'Plants of the World Online — accepted name and synonym',
  'Royal Botanic Gardens, Kew',
  CASE "localName"
    WHEN 'Yerba Buena' THEN 'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:60476613-2'
    WHEN 'Tsaang Gubat' THEN 'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:113775-1'
    WHEN 'Niyog-niyogan' THEN 'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:170880-1'
  END,
  NULL,
  ARRAY['identity', 'scientificName', 'sourceScientificName'],
  TIMESTAMP '2026-09-12 00:00:00'
FROM "Herb"
WHERE "localName" IN ('Yerba Buena', 'Tsaang Gubat', 'Niyog-niyogan');
