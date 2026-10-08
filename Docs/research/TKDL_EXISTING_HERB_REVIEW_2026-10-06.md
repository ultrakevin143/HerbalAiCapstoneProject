# TKDL review of existing live herbs — 6 October 2026

Status: source research only; no database write, publication, embedding update, image upload, application edit, commit or push.

## What was actually inspected

- The requested [TKDL Digital Herbarium](https://www.tkdl.ph/library/herbarium) and its Premna odorata specimen detail were inspected. The herbarium primarily supplies botanical descriptions, photographs and collection provenance.
- The linked [Medicinal Plants in Traditional Healing index](https://www.tkdl.ph/library/medicinalplants) displayed 1,650 rows with its own All page-size option. Only index fields relevant to matching the current public catalog were extracted. This is not a count of unique species and is not a review of every underlying medicinal record.
- All 38 current public scientific names were compared against rendered scientific-name cells. There were 33 direct genus/species text matches, spanning 176 index rows. Authors and named varieties/cultivars still require review; a text match is not botanical clearance.
- One linked detail for each of those 33 species was opened. Regional-name headers and the public Medicinal Uses tab were inspected. Two additional detail pages were read separately for the Yerba Buena synonym lead and the Saluyot taxon mismatch: 35 medicinal detail pages altogether.
- No preparation instructions, ingredient quantities, water ratios, cooking times or administration schedules were observed in those inspected public Medicinal Uses tabs. They expose reported indications and collection information, not a complete preparation guide. This does not establish that every other TKDL record, restricted section or underlying research report lacks preparation information.
- The [About page](https://www.tkdl.ph/library/aboutus) and the public Siquijor Phase III research abstract were read. The abstract lists PCHRD as a physical full-text location; an accessible downloadable full report was not obtained. Its research detail is reached through search and row selection at [Research](https://www.tkdl.ph/library/researches).
- Public Herbal-Ai catalog and full-list GET responses were read without authentication: `/api/herbs/catalog` and `/api/herbs?limit=100` at `https://herbalaicapstoneproject-staging.up.railway.app`. Both contained 38 public records. No fresh private Neon query was run in this review.

## Findings for the current system

| Check | Observed result |
| --- | --- |
| Public herbs | 38 |
| Blank public `preparationMethod` fields | 0 |
| Blank public `cebuanoName` fields | 24 |
| Directly matched TKDL species | 33/38 |
| Matched herbs with blank public regional-name field | 21 |
| Directly matched medicinal detail pages inspected | 33 |
| Additional held identity-lead details inspected | 2 |
| New preparation methods verified from these TKDL public pages | 0 |
| New herbs or field changes published by this review | 0 |

Nonblank preparation fields do not mean every species has an established household medicinal recipe. Existing records intentionally distinguish official guidance, food preparation, reported traditional practice, clinical formulations and unresolved human treatment methods. For example, the current Malunggay field identifies a study's capsules rather than equating them with cooked leaves. Do not replace an accurate limitation with guessed steps.

## Source-linked regional-name candidates

These are selected Philippine-name facts from the individual linked pages, not a licensed bulk copy of the herbarium. English marketing names, anatomical descriptions, photos, informant identities, precise collection addresses and coordinates are excluded. Retain the source's language abbreviations verbatim until independently resolved; `Bis.` must not automatically become a confirmed Cebuano translation. A name without a language label stays unlabelled. Some rows repeat names already present and are provenance checks, not new aliases.

| Existing herb | Stored scientific name | Selected names as labelled by TKDL | Individual source |
| --- | --- | --- | --- |
| Akapulko | Senna alata | Asunting (Bis.); Sunting (C. Bis.); Andadisi (Ilk.); Kasitas (Bik., Bis.); Pakayomkom-kastila (Pamp.) | [Asunting](https://www.tkdl.ph/library/medicinalplants/12-senna-alata-(l.)-roxb.-asunting-(bis.)) |
| Ampalaya | Momordica charantia | Poliya; Puliya nu Ba'ahon; Ampalaya / ampalaya wild (Bis.) — first two labels unspecified in the header | [Poliya](https://www.tkdl.ph/library/medicinalplants/614-momordica-charantia-l.-poliya,-puliya-nu-ba'ahon) |
| Aratiles | Muntingia calabura | Mansanitas (Bis.); Aratiles (Tag.) | [Mansanitas](https://www.tkdl.ph/library/medicinalplants/270-muntingia-calabura-l.-mansanitas-(bis.)) |
| Atsuete | Bixa orellana | Atsuetes (Bis.); Asuete / Asuite (Tag.); Achiti (Ilk.); Sotis (C. Bis.) | [Atsuetes](https://www.tkdl.ph/library/medicinalplants/15-bixa-orellana-linn.-atsuetes-(bis.)) |
| Bawang | Allium sativum | Bawang (Tag.); this selected page does not verify the existing Ahos alias | [Bawang](https://www.tkdl.ph/library/medicinalplants/711-allium-sativum-l.-bawang-(tag.)) |
| Bayabas | Psidium guajava | Bayabas (Bis.); Tayabas / Guayabas (Tag.) | [Bayabas](https://www.tkdl.ph/library/medicinalplants/23-psidium-guajava-l.-bayabas-(bis.)) |
| Damong Maria | Artemisia vulgaris | Hilbas (Bis.); Damong maria / Santa maria (Tag.) | [Hilbas](https://www.tkdl.ph/library/medicinalplants/239-artemisia-vulgaris-l.-hilbas-(bis.)) |
| Gabi | Colocasia esculenta | Bega nga tapol (Bis.) — variety-specific wording; hold a generic alias update | [Bega nga tapol](https://www.tkdl.ph/library/medicinalplants/24-colocasia-esculenta-bega-nga-tapol-(bis.)) |
| Gumamela | Hibiscus rosa-sinensis | Gumamela / Antulang (Bis.); do not silently rewrite existing Antolanga spelling | [Gumamela](https://www.tkdl.ph/library/medicinalplants/51-hibiscus-rosa-sinensis-gumamela-(bis.)) |
| Indian Heliotrope | Heliotropium indicum | Elepante (Bis.); Trompa ng elepante (Tag.) | [Elepante](https://www.tkdl.ph/library/medicinalplants/223-heliotropium-indicum-l.-elepante-(bis.)) |
| Kalingag | Cinnamomum mercadoi | Kaningag (Bis.); Kalingag (Tag.) | [Kaningag](https://www.tkdl.ph/library/medicinalplants/1430-cinnamomum-mercadoi-s.-vidal-kaningag-(bis.)) |
| Kamote | Ipomoea batatas | Kamote (Bis.) | [Kamote](https://www.tkdl.ph/library/medicinalplants/1459-ipomoea-batatas-(l.)lam.-kamote-(bis.)) |
| Katakataka | Kalanchoe pinnata | Katakataka; Luplupak — language unspecified in the header | [Katakataka / Luplupak](https://www.tkdl.ph/library/medicinalplants/1687-kalanchoe-pinnata-(lam.)-pers.-katakataka;-luplupak) |
| Lagundi | Vitex negundo | Lagundi (Tag., Bis.); Dangla (Ilk.) | [Lagundi](https://www.tkdl.ph/library/medicinalplants/68-vitex-negundo-linn.-lagundi-(bis.)) |
| Langka | Artocarpus heterophyllus | Nangka (Bis.); langka (Tag.) | [Nangka](https://www.tkdl.ph/library/medicinalplants/402-artocarpus-heterophyllus-nangka-(bis.)) |
| Luya | Zingiber officinale | Luy-ang tapol (Bis.) — preserve possible variety/colour specificity | [Luy-ang tapol](https://www.tkdl.ph/library/medicinalplants/263-zingiber-officinale-rosc.-luy-ang-tapol-(bis.)) |
| Luyang dilaw | Curcuma longa | Dulaw nga limbahun (Bis.); Dilaw / Luyang-dilaw (Tag.); Angay (Pamp.); Kulyaw (Ilk.) | [Dulaw nga limbahun](https://www.tkdl.ph/library/medicinalplants/43-curcuma-longa-linn.-dulaw-nga-limbahun-(bis.)) |
| Makabuhay | Tinospora crispa | Panyawan (Bis.); Makabuhay (Tag., Ilk.) | [Panyawan](https://www.tkdl.ph/library/medicinalplants/91-tinospora-crispa-panyawan-(bis.)) |
| Malunggay | Moringa oleifera | Kalamonggay (Bis.); Malunggay / Kamalungai (Tag.); Komkompilan (Ilk.); Kalunggay (Bik.); Malunggue (Pamp.) | [Kalamonggay](https://www.tkdl.ph/library/medicinalplants/59-moringa-oleifera-lam.-kalamonggay-(bis.)) |
| Mangosteen | Garcinia mangostana | Mangosten (Bis.); Mangostan (Tag., S. L. Bis.); Manggis (Sulu) | [Mangosten](https://www.tkdl.ph/library/medicinalplants/76-garcinia-mangostana-l.-mangosten-(bis.)) |
| Mayana | Coleus scutellarioides | Mayanang pula / mayana (Bis.); Malaina (Tag.) — retain colour-specific wording | [Mayanang pula](https://www.tkdl.ph/library/medicinalplants/401-coleus-scutellarioides-(l.)-benth-mayanang-pula-(bis.)) |
| Okra | Abelmoschus esculentus | Okra (Bis.) | [Okra](https://www.tkdl.ph/library/medicinalplants/277-abelmoschus-esculentus-(l.)-moench.-okra-(bis.)) |
| Oregano | Coleus amboinicus | Oregano (Bis.); source identifies a Variegatus form, not every oregano species | [Oregano](https://www.tkdl.ph/library/medicinalplants/87-coleus-amboinicus-%22variegatus%22-oregano-(bis.)) |
| Pandan | Pandanus amaryllifolius | Pandan (Bis.) | [Pandan](https://www.tkdl.ph/library/medicinalplants/639-pandanus-amaryllifolius-roxb.-pandan) |
| Sabila | Aloe vera | Aloe bera (Bis.); Sabila-pinya (Tag.); Dilang buaya (Bik.) | [Aloe bera](https://www.tkdl.ph/library/medicinalplants/6-aloe-vera-(l.)-burm.f.-aloe-bera-(bis.)) |
| Sambong | Blumea balsamifera | Dalapot (Bis.); Alyabon (Pamp.); Gabon (Zamb.); Labulan (Sub.); Sambun (Sul.); Sob-sob (Ilk.) | [Dalapot](https://www.tkdl.ph/library/medicinalplants/39-blumea-balsamifera-(linn.)-dc.-dalapot-(bis.)) |
| Sibuyas | Allium cepa | Sibuyas (Tag.) | [Sibuyas](https://www.tkdl.ph/library/medicinalplants/712-allium-cepa-l.-sibuyas(tag.)) |
| Suha | Citrus maxima | Buongon (Bis.) | [Buongon](https://www.tkdl.ph/library/medicinalplants/215-citrus-maxima-(burm.)-merr.-buongon-(bis.)) |
| Takip-kohol | Centella asiatica | Yahong-yahong (Bis.); Takip-kohol / Taingan-daga (Tag.) | [Yahong-yahong](https://www.tkdl.ph/library/medicinalplants/304-centella-asiatica-(l.)-urban-yahong-yahong-(bis.)) |
| Tanglad | Cymbopogon citratus | Tanglad (Bis.); Salai (Tag.) | [Tanglad](https://www.tkdl.ph/library/medicinalplants/113-cymbopogon-citratus-(dc.)-stapf.-tanglad-(bis.)) |
| Tsaang Gubat | Ehretia microphylla | Alangit / Alangitngit (Bis.); Tsaang-gubat (Tag.); Buyok-buyok (Sul.); Icha-nga-atap (Ilk.) | [Alangitngit](https://www.tkdl.ph/library/medicinalplants/4-ehretia-microphylla-lam.-alangitngit-(bis.)) |
| Ulasimang Bato | Peperomia pellucida | Sinaw-sinaw (Bis.); Pansit-pansitan / olasiman-ihalas (Tag., as labelled by this source) | [Sinaw-sinaw](https://www.tkdl.ph/library/medicinalplants/424-peperomia-pellucida-sinaw-sinaw-(bis.)) |
| Ylang-ylang | Cananga odorata | Langilan (Bis.) | [Langilan](https://www.tkdl.ph/library/medicinalplants/498-cananga-odorata-(lam.)-hook.f.-%26-thomson-langilan) |

The research institutions vary: most selected records identify Siquijor State College; others identify Caraga State University, Benguet State University, Pampanga State Agricultural University or Kinasang'an Foundation Inc. A hosting institution or reported indication is not clinical validation of a household treatment.

## Held identity and language issues

1. **Hilbas ambiguity:** the current Yerba Buena `cebuanoName` contains Hilbas, while TKDL explicitly labels Hilbas as Artemisia vulgaris. This is a shared-name/disambiguation risk, not proof that a regional name can never apply to another plant. Do not move recipes, images or medicinal indications between those taxa based on this word. Resolve species in search and Dr. Ai before returning preparations.
2. **Saluyot mismatch:** the stored taxon is Corchorus aestuans; the inspected [TKDL Saluyot record](https://www.tkdl.ph/library/medicinalplants/1438-corchorus-olitorius-l.-saluyot-(bis.)) identifies Corchorus olitorius. Do not use that record's uses or preparation evidence for the stored herb. Kew treats [Corchorus aestuans](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A320794-2) as an accepted species. Leave the current food-only, exact-species limitation intact.
3. **Yerba Buena synonym lead:** TKDL's [Herba Buena](https://www.tkdl.ph/library/medicinalplants/608-mentha-x-cordifolia-opiz-ex-fresen.-herba-buena) uses Mentha x cordifolia with an author string different from Kew's. [Kew's Mentha × cordifolia page](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A60476613-2) resolves its name to Mentha × villosa. This is a promising reviewed-synonym lead, not a 34th direct text match. Preserve both source-used and accepted names, and check the author discrepancy before adopting it. Mentha spicata, Mentha x piperita and unidentified Mentha sp. are not automatically interchangeable.
4. **Other unmatched scientific names:** Annona reticulata, Diospyros blancoi and Combretum indicum had no direct match in the rendered index. This is a scoped negative result, not proof those plants do not occur in TKDL or the Philippines. Unidentified plants or a shared common name must not be substituted.
5. **Single-field limitation:** the current backend schema has a `cebuanoName` string but no structured language-tagged regional-name field. Existing strings already mix labels, for example Dangla in Lagundi and English text in Kalingag/Tanglad. Do not load Tagalog, Ilocano, Bikol or unlabelled names into that field while presenting all as Cebuano. A reviewed multi-language representation should retain name, source language label, source URL and accepted taxon.
6. **Cultivar and spelling limits:** Bega nga tapol, Luy-ang tapol, Mayanang pula and the Oregano Variegatus form require careful scoping. Antulang and existing Antolanga are separate spellings to verify, not an automatic correction. Do not turn broad `Bis.` labels into city/province-specific usage claims without evidence.

## Why no new TKDL preparation was added

The inspected public records provide traditional indications but not the missing steps. Turning an indication into a recipe would require inventing plant parts, quantities, route or timing. Claims involving serious diseases in those reports must remain attributed historical/traditional observations, not become treatment instructions or efficacy guarantees.

Existing Bayabas, Lagundi, Sambong and Tsaang Gubat preparation fields already cite the [PITAHC Directory of Herbs](https://pitahc.gov.ph/herbs-directory/). The live source links and stored fields were checked; the directory's individual current instructions were not independently re-extracted in this TKDL review. Keep those preparations and their source/population limits rather than overwriting them with unrelated TKDL indications.

TKDL's About page explains differentiated access and knowledge-owner consent, especially for further scientific studies. No blanket image or full-dataset redistribution permission was established. This review keeps short attributed name facts and links; it does not mirror photographs, full reports, healer details, exact collection locations or restricted knowledge. Further reuse should respect the specific access and knowledge-owner requirements rather than assume that public visibility is an unrestricted license.

## Where the requested 50 new herbs are

The requested expansion has not been published. The existing local [fifty-herb audit](HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.md) records 10 held full-content drafts, 40 candidates without equivalent complete drafts, 37 selected uploaded cover images and 13 missing selected covers. It records zero completed reviewed import manifests and zero candidates cleared for publication. Those are earlier documented checkpoints, not fresh Cloudinary or private-database verification in this turn.

The fresh public catalog still contains 38 records. The earlier preparation update to 20 existing herbs is not the publication of the separate 50-herb expansion. Uploaded media or local research files alone cannot make those candidates appear in the public Library. No previously held candidate was silently inserted here.

## Proposed bounded next batch

1. Review the selected regional-name facts against each existing stable herb ID, retaining sources and language labels. Prioritise the 21 directly matched records with blank regional-name fields; some have only an existing preferred name rather than a new alias. Hold cultivar, spelling, shared-name and taxonomy ambiguities.
2. Decide how language-tagged names will be stored and displayed without labelling every language Cebuano. Test regional-name search, scientific-name lookup and ambiguous-name clarification in Dr. Ai. Update approved embeddings only after actual content changes, not from held drafts.
3. For any genuinely missing medicinal preparation, obtain the exact source's preparation section or an official monograph. Retain plant part, route, population, amounts, duration, warnings and evidence level only when stated. If the source lacks them, retain that limitation rather than complete the field artificially.
4. Keep the new-herb expansion separate. Finish and review a small fully sourced, identity-confirmed, image-cleared batch before an idempotent import. Recheck all current Herb and SuggestedHerb states for duplicates immediately before any future write; this public-only review is not that release gate.
5. Before publication, create a reviewed field-level diff and recovery snapshot, verify sources and exact target, apply only approved IDs, then compare persistence/public fields and test retrieval. No execution of this write plan is authorised by the existence of this research report alone.

## Validation and boundaries

Public requests and browser inspection were read-only. All 33 selected medicinal tabs were checked for explicit preparation fields and their use descriptions were inspected for preparation actions; none provided a usable preparation method in this review. The Katakataka tab did not expose a populated medicinal-use excerpt during the check. Its absence was not turned into a fabricated use or recipe.

The report excludes account information and credentials. No live AI questions were submitted, no quota or outage was induced, and no entire-library preparation completeness or full taxonomic uniqueness claim is made. Existing unrelated changes and the deployed release remain untouched.
