-- Exact species/source guards preserve clinical content and unrelated references.
-- Identity receipts and unresolved review queue: content/herbs/verified-source-links-2026-10-15.json.
-- Historical PITAHC references and already precise URLs remain unchanged.
WITH verified_sources (scientific_name, source_url) AS (VALUES
  ('Acalypha hispida', 'https://www.stuartxchange.org/Chenile'),
  ('Albizia lebbekoides', 'https://www.stuartxchange.org/Kariskis.html'),
  ('Aleurites moluccanus', 'https://www.stuartxchange.org/Lumbang.html'),
  ('Alpinia elegans', 'https://www.stuartxchange.org/Tagbak'),
  ('Alpinia haenkei', 'https://www.stuartxchange.org/Bagumbung'),
  ('Alstonia macrophylla', 'https://www.stuartxchange.org/Batino.html'),
  ('Alstonia spectabilis', 'https://www.stuartxchange.org/KuyauKuyau'),
  ('Annona glabra', 'https://www.stuartxchange.org/PondApple'),
  ('Antidesma ghaesembilla', 'https://www.stuartxchange.org/Binayuyo'),
  ('Artocarpus altilis', 'https://www.stuartxchange.org/Rimas.html'),
  ('Artocarpus odoratissimus', 'https://www.stuartxchange.org/Marang.html'),
  ('Asystasia gangetica', 'https://www.stuartxchange.org/Asistasia'),
  ('Avicennia marina', 'https://www.stuartxchange.org/BungalonPuti'),
  ('Bauhinia acuminata', 'https://www.stuartxchange.org/Bambang.html'),
  ('Bauhinia purpurea', 'https://www.stuartxchange.org/ButterflyTree.html'),
  ('Boehmeria nivea', 'https://www.stuartxchange.org/Ramie'),
  ('Bombax ceiba', 'https://www.stuartxchange.org/Buboi-gubat'),
  ('Canarium ovatum', 'https://www.stuartxchange.org/Pili.html'),
  ('Cassia fistula', 'https://www.stuartxchange.org/KanyaPistula'),
  ('Cassia sophera', 'https://www.stuartxchange.org/Andadasi'),
  ('Celosia argentea', 'https://www.stuartxchange.org/Kindayohan'),
  ('Citrus hystrix', 'https://www.stuartxchange.org/Kabuyaw'),
  ('Corchorus olitorius', 'https://www.stuartxchange.org/Pasau.html'),
  ('Crateva religiosa', 'https://www.stuartxchange.org/Salingbobog.html'),
  ('Cynometra ramiflora', 'https://www.stuartxchange.org/Oringen'),
  ('Cyrtosperma merkusii', 'https://www.stuartxchange.org/Palauan'),
  ('Derris elliptica', 'https://www.stuartxchange.org/Tubli'),
  ('Dipterocarpus grandiflorus', 'https://www.stuartxchange.org/Apitong.html'),
  ('Donax canniformis', 'https://www.stuartxchange.org/Bamban.html'),
  ('Dracontomelon dao', 'https://www.stuartxchange.org/Dao'),
  ('Dysphania ambrosioides', 'https://www.stuartxchange.org/Alpasotis.html'),
  ('Elephantopus scaber', 'https://www.stuartxchange.org/DilaDila.html'),
  ('Elephantopus tomentosus', 'https://www.stuartxchange.org/Malatabako.html'),
  ('Eleusine indica', 'https://www.stuartxchange.org/Paragis.html'),
  ('Emilia sonchifolia', 'https://www.stuartxchange.org/Tagulinaw'),
  ('Erythrina variegata', 'https://www.stuartxchange.org/Karapdap'),
  ('Euphorbia pulcherrima', 'https://www.stuartxchange.org/Poinsettia'),
  ('Euphorbia thymifolia', 'https://www.stuartxchange.org/Makikitot'),
  ('Euphorbia tirucalli', 'https://www.stuartxchange.org/Bali-bali'),
  ('Excoecaria agallocha', 'https://www.stuartxchange.org/Buta-buta'),
  ('Ficus benjamina', 'https://www.stuartxchange.org/Balete.html'),
  ('Ficus septica', 'https://www.stuartxchange.org/Hauili.html'),
  ('Ficus ulmifolia', 'https://www.stuartxchange.org/Is-is'),
  ('Garuga floribunda', 'https://www.stuartxchange.org/Bogo.html'),
  ('Gnetum gnemon', 'https://www.stuartxchange.org/Bago'),
  ('Gomphrena celosioides', 'https://www.stuartxchange.org/BotonsilyongGapang.html'),
  ('Helianthus annuus', 'https://www.stuartxchange.org/Mirasol.html'),
  ('Heritiera littoralis', 'https://www.stuartxchange.org/Dungon-late.html'),
  ('Hibiscus syriacus', 'https://www.stuartxchange.org/GumamelangAsul.html'),
  ('Intsia bijuga', 'https://www.stuartxchange.org/Ipil'),
  ('Laportea meyeniana', 'https://www.stuartxchange.org/Lipa.html'),
  ('Lunasia amara', 'https://www.stuartxchange.org/Lunas2'),
  ('Macaranga tanarius', 'https://www.stuartxchange.org/Binunga.html'),
  ('Mangifera altissima', 'https://www.stuartxchange.org/Paho'),
  ('Mikania cordata', 'https://www.stuartxchange.org/Bikas.html'),
  ('Musa acuminata', 'https://stuartxchange.org/Lakatan'),
  ('Musa textilis', 'https://www.stuartxchange.org/Abaca'),
  ('Nauclea orientalis', 'https://www.stuartxchange.org/Bangkal.html'),
  ('Pachyrhizus erosus', 'https://www.stuartxchange.org/Sinkamas.html'),
  ('Pangium edule', 'https://www.stuartxchange.org/Pangi.html'),
  ('Persea americana', 'https://www.stuartxchange.org/Abukado.html'),
  ('Phyllanthus acidus', 'https://www.stuartxchange.org/Iba.html'),
  ('Pinus kesiya', 'https://www.stuartxchange.org/BaguioPine'),
  ('Pithecellobium dulce', 'https://www.stuartxchange.org/Kamatsile.html'),
  ('Pittosporum pentandrum', 'https://www.stuartxchange.org/Mamalis.html'),
  ('Premna odorata', 'https://www.stuartxchange.org/Alagaw'),
  ('Pseudarthria viscida', 'https://stuartxchange.org/StickyDesmodium'),
  ('Pueraria phaseoloides', 'https://www.stuartxchange.org/SingkamasAso'),
  ('Rauvolfia serpentina', 'https://www.stuartxchange.org/Serpentina'),
  ('Rhizophora mucronata', 'https://stuartxchange.org/Bakauan-babae.html'),
  ('Ricinus communis', 'https://www.stuartxchange.org/TanganTangan'),
  ('Rourea minor', 'https://www.stuartxchange.org/Kamagsa.html'),
  ('Sida acuta', 'https://www.stuartxchange.org/Ualisualisan'),
  ('Spondias pinnata', 'https://www.stuartxchange.org/Libas.html'),
  ('Spondias purpurea', 'https://www.stuartxchange.org/Sineguelas'),
  ('Streblus asper', 'https://www.stuartxchange.org/Kalios.html'),
  ('Tabernaemontana divaricata', 'https://www.stuartxchange.org/Pandakaking-tsina.html'),
  ('Tabernaemontana pandacaqui', 'https://www.stuartxchange.org/PandakakiPuti.html'),
  ('Terminalia microcarpa', 'https://www.stuartxchange.org/Kalumpit.html'),
  ('Vitex parviflora', 'https://www.stuartxchange.org/Molave'),
  ('Vitex trifolia', 'https://www.stuartxchange.org/Lagunding-dagat.html'),
  ('Voacanga globosa', 'https://www.stuartxchange.org/BayagUsa'),
  ('Ziziphus talanai', 'https://www.stuartxchange.org/Balakat')
)
UPDATE "HerbSource" AS source
SET url = verified.source_url
FROM "Herb" AS herb, verified_sources AS verified
WHERE source."herbId" = herb.id
  AND herb."scientificName" = verified.scientific_name
  AND source.title = 'StuartXchange Philippine Medicinal Plants (' || verified.scientific_name || ')'
  AND source.publisher = 'StuartXchange / Philippine Ethnobotanical Compendium'
  AND source.url IN ('https://www.stuartxchange.org', 'https://www.stuartxchange.org/', 'https://stuartxchange.org', 'https://stuartxchange.org/');

-- A generic homepage does not verify a plant-specific citation. Retain the
-- original citation with an explicit review notice; never substitute a different
-- species based on a shared common name. This does not reclassify medicinal claims.
WITH review_sources (scientific_name) AS (VALUES
  ('Aglaia harmsiana'),
  ('Ailanthus triphysa'),
  ('Calamus merrillii'),
  ('Cubilia cubili'),
  ('Cucurbita moschata'),
  ('Desmos chinensis'),
  ('Dipterocarpus kerrii'),
  ('Glochidion album'),
  ('Heritiera sylvatica'),
  ('Impatiens platypetala'),
  ('Macaranga bicolor'),
  ('Ocimum americanum'),
  ('Oncosperma tigillarium'),
  ('Parashorea malaanonan'),
  ('Piper sarmentosum'),
  ('Radermachera pinnata'),
  ('Symplocos cochinchinensis')
)
UPDATE "HerbSource" AS source
SET url = NULL,
  citation = CASE WHEN POSITION('Plant-specific online reference not verified on 15 October 2026. Original website URL: https://www.stuartxchange.org. The historical citation is retained; source review required.' IN COALESCE(source.citation, '')) > 0 THEN source.citation
    ELSE CONCAT_WS(E'\n', NULLIF(source.citation, ''), 'Plant-specific online reference not verified on 15 October 2026. Original website URL: https://www.stuartxchange.org. The historical citation is retained; source review required.') END
FROM "Herb" AS herb, review_sources AS review
WHERE source."herbId" = herb.id
  AND herb."scientificName" = review.scientific_name
  AND source.title = 'StuartXchange Philippine Medicinal Plants (' || review.scientific_name || ')'
  AND source.publisher = 'StuartXchange / Philippine Ethnobotanical Compendium'
  AND source.url IN ('https://www.stuartxchange.org', 'https://www.stuartxchange.org/', 'https://stuartxchange.org', 'https://stuartxchange.org/');
