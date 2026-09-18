-- Restore researched non-DOH herbs to the public library with evidence labels
-- that distinguish human studies from traditional/preclinical evidence.

UPDATE "Herb" SET
  category = 'Wound Care Research',
  "medicinalUses" = 'A Philippine pilot study in 12 patients found that a standardized 4% Hibiscus rosa-sinensis leaf-extract ointment, used alongside compression stockings, showed potential for venous leg ulcer closure. This small adjunct study does not establish effectiveness for general wound treatment.',
  "preparationMethod" = 'The human study used a standardized 4% leaf-extract ointment together with medical compression therapy. It does not provide a safe home-preparation method.',
  dosage = 'Research protocol only: the standardized ointment was applied twice daily for up to 12 weeks under dermatology care. This is not a self-treatment dosage.',
  warnings = 'Open or chronic wounds require professional assessment. Do not place homemade plant extracts on ulcers, infected wounds, or broken skin, and do not replace compression or prescribed wound care.',
  "imageUrl" = '/images/herbs/gumamela.jpg', "imageCreator" = 'Judgefloro',
  "imageSourceUrl" = 'https://commons.wikimedia.org/wiki/File:739Close-ups_Hibiscus_rosa-sinensis_Philippines_12.jpg',
  "imageLicense" = 'CC0 1.0', "imageLicenseUrl" = 'https://creativecommons.org/publicdomain/zero/1.0/',
  "imageModification" = 'Wikimedia 1280px derivative; responsively cropped by the interface.',
  "isDohApproved" = false, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'EVIDENCE_SUPPORTED_PHILIPPINE_USE', provenance = 'BUILT_IN', "reviewedAt" = NOW()
WHERE "localName" = 'Gumamela';

UPDATE "Herb" SET
  category = 'Antifungal / Oral Health Research',
  "medicinalUses" = 'Small human studies have evaluated standardized Cymbopogon citratus essential-oil formulations for pityriasis versicolor and oral-health outcomes. Results are preliminary and do not establish ordinary tanglad tea or homemade oil as treatment.',
  "preparationMethod" = 'Clinical research used standardized topical or mouth-rinse formulations with measured essential-oil concentrations. The studies do not support a reproducible home preparation.',
  dosage = 'No general medicinal dosage is established. Study-specific formulations and schedules must not be converted into homemade dosing.',
  warnings = 'Concentrated essential oil may irritate skin and mucosa and should not be swallowed or applied undiluted. Seek professional care for fungal infection, oral disease, pregnancy, allergy, or persistent symptoms.',
  "imageUrl" = '/images/herbs/tanglad.jpg', "imageCreator" = 'Vreni Gem O. Caasi',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/273882180',
  "imageLicense" = 'CC BY 4.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/4.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.',
  "isDohApproved" = false, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'EVIDENCE_SUPPORTED_PHILIPPINE_USE', provenance = 'BUILT_IN', "reviewedAt" = NOW()
WHERE "localName" = 'Tanglad';

UPDATE "Herb" SET
  category = 'Traditional Use / Preclinical',
  "medicinalUses" = 'Reviews document traditional uses and laboratory or animal findings for Heliotropium indicum, but human clinical studies are still needed to establish effectiveness and a safe therapeutic dose.',
  "preparationMethod" = 'No clinically validated preparation is available. The library does not recommend preparing or consuming this plant.',
  dosage = 'No safe, clinically established human dosage is available.',
  warnings = 'Do not ingest Indian Heliotrope. It contains pyrrolizidine alkaloids associated with liver injury and possible carcinogenic risk. Laboratory or animal activity is not proof of safe human treatment.',
  "imageUrl" = '/images/herbs/indian-heliotrope.jpg', "imageCreator" = 'Greg III Espera',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/73475779',
  "imageLicense" = 'CC BY 4.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/4.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.',
  "isDohApproved" = false, "isVerified" = true, "publicationStatus" = 'PUBLISHED',
  "evidenceClass" = 'DOCUMENTED_TRADITIONAL_USE', provenance = 'BUILT_IN', "reviewedAt" = NOW()
WHERE "localName" = 'Indian Heliotrope';

DELETE FROM "HerbSource" WHERE "herbId" IN (SELECT id FROM "Herb" WHERE "localName" IN ('Gumamela', 'Tanglad', 'Indian Heliotrope'));

INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "publishedAt", "accessedAt")
SELECT id, '4% Hibiscus rosa-sinensis leaf extract ointment for venous leg ulcers: pilot study', 'Wounds', 'https://pubmed.ncbi.nlm.nih.gov/31298659/', 'Bruan MJM, Tianco EA. 2019;31(9):236-241.', ARRAY['humanEvidence', 'medicinalUses', 'preparationMethod', 'dosage', 'limitations'], '2019', NOW() FROM "Herb" WHERE "localName" = 'Gumamela';

INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "publishedAt", "accessedAt")
SELECT id, 'Topical Cymbopogon citratus essential oil for pityriasis versicolor: phase I and II pilot study', 'Anais Brasileiros de Dermatologia', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3754369/', NULL, ARRAY['humanEvidence', 'medicinalUses', 'limitations'], '2013', NOW() FROM "Herb" WHERE "localName" = 'Tanglad';

INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "publishedAt", "accessedAt")
SELECT id, 'Clinical applications of lemongrass essential oil: scoping review', 'Pharmaceuticals', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10892616/', NULL, ARRAY['humanEvidence', 'medicinalUses', 'limitations'], '2024', NOW() FROM "Herb" WHERE "localName" = 'Tanglad';

INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "publishedAt", "accessedAt")
SELECT id, 'Heliotropium indicum: bioactive compounds, preclinical activity, and toxicological profile', 'Evidence-Based Complementary and Alternative Medicine', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8187075/', NULL, ARRAY['traditionalUse', 'preclinicalEvidence', 'warnings', 'limitations'], '2021', NOW() FROM "Herb" WHERE "localName" = 'Indian Heliotrope';

INSERT INTO "HerbSource" ("herbId", title, publisher, url, citation, supports, "publishedAt", "accessedAt")
SELECT id, 'Natural toxins in food: pyrrolizidine alkaloids', 'World Health Organization', 'https://www.who.int/news-room/fact-sheets/detail/natural-toxins-in-food', NULL, ARRAY['warnings'], '2023', NOW() FROM "Herb" WHERE "localName" = 'Indian Heliotrope';
