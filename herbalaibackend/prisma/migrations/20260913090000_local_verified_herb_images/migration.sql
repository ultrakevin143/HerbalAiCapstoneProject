-- Replace unverified remote image links with locally served, taxon-matched
-- assets and retain the creator, source, license, and display treatment.

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/lagundi.jpg', "imageCreator" = 'Greg III Espera',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/10163763',
  "imageLicense" = 'CC BY 4.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/4.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.'
WHERE "localName" = 'Lagundi' AND provenance = 'BUILT_IN';

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/sambong.jpg', "imageCreator" = 'Vreni Gem O. Caasi',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/43861367',
  "imageLicense" = 'CC BY 4.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/4.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.'
WHERE "localName" = 'Sambong' AND provenance = 'BUILT_IN';

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/ampalaya.jpg', "imageCreator" = 'Greg III Espera',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/106965525',
  "imageLicense" = 'CC BY 4.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/4.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.'
WHERE "localName" = 'Ampalaya' AND provenance = 'BUILT_IN';

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/bawang.jpg', "imageCreator" = 'Jeremy Keith',
  "imageSourceUrl" = 'https://commons.wikimedia.org/wiki/File:Garlic_bulb.jpg',
  "imageLicense" = 'CC BY 2.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/2.0/',
  "imageModification" = 'Wikimedia 1280px derivative; responsively cropped by the interface.'
WHERE "localName" = 'Bawang' AND provenance = 'BUILT_IN';

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/bayabas.jpg', "imageCreator" = 'Greg III Espera',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/68443241',
  "imageLicense" = 'CC BY 4.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/4.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.'
WHERE "localName" = 'Bayabas' AND provenance = 'BUILT_IN';

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/yerba-buena.png', "imageCreator" = 'N. L. Britton and A. Brown',
  "imageSourceUrl" = 'https://commons.wikimedia.org/wiki/File:Mentha_%C3%97_villosa_drawing_1.png',
  "imageLicense" = 'Public domain', "imageLicenseUrl" = 'https://creativecommons.org/publicdomain/mark/1.0/',
  "imageModification" = 'Wikimedia 1280px derivative; responsively cropped by the interface.'
WHERE "localName" = 'Yerba Buena' AND provenance = 'BUILT_IN';

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/tsaang-gubat.jpg', "imageCreator" = 'Greg III Espera',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/73912989',
  "imageLicense" = 'CC BY 4.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/4.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.'
WHERE "localName" = 'Tsaang Gubat' AND provenance = 'BUILT_IN';

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/akapulko.jpg', "imageCreator" = 'Matej Otruba',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/333323524',
  "imageLicense" = 'CC0 1.0', "imageLicenseUrl" = 'https://creativecommons.org/publicdomain/zero/1.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.'
WHERE "localName" = 'Akapulko' AND provenance = 'BUILT_IN';

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/niyog-niyogan.jpg', "imageCreator" = 'Greg III Espera',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/11377445',
  "imageLicense" = 'CC BY 4.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/4.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.'
WHERE "localName" = 'Niyog-niyogan' AND provenance = 'BUILT_IN';

UPDATE "Herb" SET
  "imageUrl" = '/images/herbs/ulasimang-bato.jpg', "imageCreator" = 'Beah Vega',
  "imageSourceUrl" = 'https://www.inaturalist.org/observations/75729243',
  "imageLicense" = 'CC BY 4.0', "imageLicenseUrl" = 'https://creativecommons.org/licenses/by/4.0/',
  "imageModification" = 'No source-file edits; responsively cropped by the interface.'
WHERE "localName" = 'Ulasimang Bato' AND provenance = 'BUILT_IN';
