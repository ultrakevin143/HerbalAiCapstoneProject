-- Keep PITAHC in the structured source records while removing repetitive
-- publisher-first wording from descriptions shown to library readers.

UPDATE "Herb" SET
  "medicinalUses" = replace(replace("medicinalUses", 'PITAHC lists ', 'Evidence includes '), 'PITAHC cites ', 'Evidence includes '),
  "preparationMethod" = replace(
    replace(
      replace("preparationMethod", 'Under health-professional guidance, PITAHC describes ', 'Under health-professional guidance, '),
      'PITAHC describes ', 'Recorded guidance describes '
    ),
    'PITAHC also describes ', 'Recorded guidance also describes '
  ),
  dosage = replace(
    replace(
      replace(
        replace(dosage, ' listed by PITAHC', ' recorded in the source guidance'),
        'PITAHC describes ', 'Recorded guidance describes '
      ),
      'PITAHC states that ', 'Recorded guidance states that '
    ),
    'following PITAHC guidance', 'following the recorded guidance'
  )
WHERE provenance = 'BUILT_IN' AND "evidenceClass" = 'DOH_PITAHC_LISTED';

UPDATE "Herb" SET
  "preparationMethod" = replace("preparationMethod", 'PITAHC notes that ', 'Recorded guidance notes that '),
  dosage = replace(dosage, 'Seed count recorded in the source guidance:', 'Recorded seed count:')
WHERE provenance = 'BUILT_IN' AND "evidenceClass" = 'DOH_PITAHC_LISTED';

UPDATE "Herb" SET
  "preparationMethod" = replace("preparationMethod", ', as described by PITAHC', ''),
  "medicinalUses" = replace("medicinalUses", 'PITAHC ', '')
WHERE provenance = 'BUILT_IN' AND "evidenceClass" = 'DOH_PITAHC_LISTED';
