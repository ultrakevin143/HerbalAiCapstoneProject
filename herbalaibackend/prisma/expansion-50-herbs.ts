import { prisma, closeDatabasePool } from "../src/lib/prisma.js";
import { generateEmbedding } from "../src/services/ai/core/gemini-service.js";

export interface NewHerbDefinition {
  localName: string;
  cebuanoName: string;
  scientificName: string;
  sourceScientificName?: string;
  category: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  regionFound: string;
  warnings: string;
  isDohApproved: boolean;
  evidenceClass: "DOH_PITAHC_LISTED" | "EVIDENCE_SUPPORTED_PHILIPPINE_USE" | "DOCUMENTED_TRADITIONAL_USE";
  sources: Array<{
    title: string;
    url: string;
    publisher?: string;
    citation: string;
    supports: string[];
  }>;
}

export const NEW_FIFTY_HERBS: NewHerbDefinition[] = [
  {
    localName: "Banaba",
    cebuanoName: "Banaba / Agaro",
    scientificName: "Lagerstroemia speciosa",
    sourceScientificName: "Lagerstroemia speciosa",
    category: "Metabolic & Renal",
    isDohApproved: true,
    evidenceClass: "DOH_PITAHC_LISTED",
    medicinalUses: "Clinical evidence and Philippine studies evaluate Banaba for blood sugar reduction in type 2 diabetes (active compound corosolic acid) and as a mild diuretic to help flush small urinary gravel.",
    preparationMethod: "Boil 1 handful of dried mature leaves in 2 glasses of water for 15 minutes, leaving the pot uncovered once it starts boiling. Cool and strain.",
    dosage: "Drink 1 cup 30 minutes before meals, 1 to 2 times daily, under health professional guidance.",
    warnings: "Do not replace prescribed diabetes medicines without medical supervision. Monitor for hypoglycemia if taking alongside prescription antidiabetic medications.",
    regionFound: "Distributed throughout secondary and riverine forests and widely planted across Luzon, Visayas, and Mindanao.",
    sources: [
      {
        title: "StuartXchange: Banaba (Lagerstroemia speciosa)",
        url: "https://www.stuartxchange.org/Banaba.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Documented traditional uses, corosolic acid studies, and pharmacological evaluations.",
        supports: ["medicinalUses", "preparationMethod", "dosage"]
      },
      {
        title: "Kew POWO: Lagerstroemia speciosa",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:553641-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic identity and global distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Guyabano",
    cebuanoName: "Babana / Bayubana",
    scientificName: "Annona muricata",
    sourceScientificName: "Annona muricata",
    category: "Immune & General Health",
    isDohApproved: false,
    evidenceClass: "EVIDENCE_SUPPORTED_PHILIPPINE_USE",
    medicinalUses: "Traditional decoction of leaves consumed for mild hypertension, inflammatory conditions, and general immune support. Studied for antioxidant and cytotoxic annonaceous acetogenins.",
    preparationMethod: "Wash 5 to 7 clean mature leaves. Boil in 3 glasses of water for 10 to 15 minutes. Cool and strain.",
    dosage: "Drink 1 cup once daily after meals.",
    warnings: "Avoid during pregnancy. Excessive or prolonged consumption of concentrated leaf extract should be avoided due to potential neurotoxic risk associated with annonacin.",
    regionFound: "Cultivated throughout the Philippines in backyards and agricultural orchards.",
    sources: [
      {
        title: "StuartXchange: Guyabano (Annona muricata)",
        url: "https://www.stuartxchange.org/Guyabano.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Traditional uses and pharmacological studies on soursop leaves and fruit.",
        supports: ["medicinalUses", "preparationMethod", "dosage", "warnings"]
      },
      {
        title: "Kew POWO: Annona muricata",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:72223-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification and distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Tawa-tawa",
    cebuanoName: "Tawa-tawa / Bobi",
    scientificName: "Euphorbia hirta",
    sourceScientificName: "Euphorbia hirta",
    category: "Hematologic & Fevers",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Widely cited in Philippine folk tradition during febrile illnesses (such as suspected dengue) to maintain hydration and support platelet stability, as well as traditional bronchial asthma relief.",
    preparationMethod: "Thoroughly wash 5 to 6 fresh whole uprooted plants with water to remove soil. Boil in 1 liter of clean water for 10 minutes until amber-colored. Cool and strain.",
    dosage: "Drink 1/2 to 1 cup several times daily alongside oral rehydration solutions.",
    warnings: "Educational folk use only. Severe fever, persistent vomiting, or bleeding signs require urgent hospital care. High doses can irritate gastric mucosa.",
    regionFound: "Ubiquitous weed in open wastelands, roadsides, and gardens throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Gatas-Gatas / Tawa-Tawa (Euphorbia hirta)",
        url: "https://www.stuartxchange.org/GatasGatas.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Philippine studies on platelet aggregation and folk dengue use.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Euphorbia hirta",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:346692-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and global pantropical occurrence.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Serpentina",
    cebuanoName: "Serpentina / Sinta",
    scientificName: "Andrographis paniculata",
    sourceScientificName: "Andrographis paniculata",
    category: "Metabolic & Infectious",
    isDohApproved: false,
    evidenceClass: "EVIDENCE_SUPPORTED_PHILIPPINE_USE",
    medicinalUses: "Extensively utilized in Philippine traditional practice for managing blood glucose spikes, uncomplicated upper respiratory infections, and persistent fevers. Active principle is bitter andrographolide.",
    preparationMethod: "Steep 2 to 3 clean dried leaves in 1 cup of hot boiled water for 5 minutes (infusion). Strain.",
    dosage: "Drink 1 small teacup once daily before meals.",
    warnings: "Extremely bitter. Strictly contraindicated during pregnancy and breastfeeding. May interact with blood pressure and anticoagulant medications.",
    regionFound: "Cultivated in herbal plots and backyard gardens throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Sinta / Serpentina (Andrographis paniculata)",
        url: "https://www.stuartxchange.org/Sinta.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Constituents, bitter tonic properties, and clinical studies.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Andrographis paniculata",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:46162-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical identity and Asian distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Kalamansi",
    cebuanoName: "Kalamansi / Limonsito",
    scientificName: "Citrus microcarpa",
    sourceScientificName: "Citrus microcarpa",
    category: "Respiratory & Immune",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Ubiquitous Philippine home remedy for soothing acute cough, loosening bronchial mucus, relieving sore throat, and supplying natural vitamin C. Applied externally for pruritus and mosquito bites.",
    preparationMethod: "Squeeze fresh juice of 4 to 5 calamansi fruits into 1 cup of warm water. Stir in 1 teaspoon of honey.",
    dosage: "Drink warm 2 to 3 times a day as needed.",
    warnings: "High acidity may cause gastric irritation in individuals with active peptic ulcer disease or severe GERD.",
    regionFound: "Cultivated commercially and in home gardens across all Philippine islands.",
    sources: [
      {
        title: "StuartXchange: Kalamansi (Citrus microcarpa)",
        url: "https://www.stuartxchange.org/Kalamansi.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Nutritional constituents, cough relief, and traditional uses.",
        supports: ["medicinalUses", "preparationMethod", "dosage"]
      },
      {
        title: "Kew POWO: Citrus microcarpa",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:772097-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and Philippine cultivation records.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Madre de Cacao",
    cebuanoName: "Kakawate / Marikawate",
    scientificName: "Gliricidia sepium",
    sourceScientificName: "Gliricidia sepium",
    category: "Dermatological",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Widely used throughout rural Philippines as a topical wash or fresh crushed poultice for scabies (kurikong), pruritic rashes, ringworm, and dermatitis. Rich in coumarins and tannins.",
    preparationMethod: "Pound fresh clean leaves to extract juice and apply topically, or boil 2 handfuls of leaves in a pot of water to make a lukewarm bath wash.",
    dosage: "Apply topically to the affected skin twice daily. External use only.",
    warnings: "For external application only. Do not ingest; bark, roots, and seeds contain toxic coumarins historically used as rodenticide.",
    regionFound: "Abundant across all provinces in agricultural hedgerows and living fences.",
    sources: [
      {
        title: "StuartXchange: Kakawate / Madre de Cacao (Gliricidia sepium)",
        url: "https://www.stuartxchange.org/Kakawate.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Traditional dermatological and veterinary antiparasitic uses.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Gliricidia sepium",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:496030-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted species identity and naturalization.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Bignay",
    cebuanoName: "Bugnay",
    scientificName: "Antidesma bunius",
    sourceScientificName: "Antidesma bunius",
    category: "Cardiovascular & Metabolic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Fresh berries and boiled leaves traditionally consumed for antioxidant support, blood pressure regulation, and mild diuretic comfort in urinary tract irritation.",
    preparationMethod: "Boil 1 handful of dried clean leaves in 2 glasses of water for 10 minutes. Strain.",
    dosage: "Drink 1 cup once or twice daily after meals.",
    warnings: "Excessive consumption of raw fruit can cause mild diarrhea. Not a substitute for prescribed antihypertensive therapy.",
    regionFound: "Common in secondary forests and cultivated in Luzon, Visayas, and Mindanao.",
    sources: [
      {
        title: "StuartXchange: Bignay (Antidesma bunius)",
        url: "https://www.stuartxchange.org/Bignay.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Antioxidant profiles, organic acids, and traditional tea preparations.",
        supports: ["medicinalUses", "preparationMethod", "dosage"]
      },
      {
        title: "Kew POWO: Antidesma bunius",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:339077-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and Asian-Pacific native distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Mansanilya",
    cebuanoName: "Mansanilya",
    scientificName: "Chrysanthemum indicum",
    sourceScientificName: "Chrysanthemum indicum",
    category: "Digestive & Pediatric Carminative",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Classic Filipino domestic remedy for infant and toddler abdominal colic (kabag), gas, flatulence, and mild tension headaches. Leaves warmed in oil are rubbed on the abdomen.",
    preparationMethod: "Gently wilt fresh leaves in warm coconut oil and massage over the abdomen; or steep dried flowers in hot water for a mild tea.",
    dosage: "Topical warm abdominal rub for infants and children; 1 cup of mild flower infusion for adults.",
    warnings: "Check for plant contact dermatitis in individuals sensitive to the daisy/Asteraceae family.",
    regionFound: "Cultivated in household gardens throughout the country, especially in upland and highland provinces.",
    sources: [
      {
        title: "StuartXchange: Manzanilla / Mansanilya (Chrysanthemum indicum)",
        url: "https://www.stuartxchange.org/Manzanilla.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Carminative properties, pediatric folk rub, and headache uses.",
        supports: ["medicinalUses", "preparationMethod", "dosage"]
      },
      {
        title: "Kew POWO: Chrysanthemum indicum",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:196395-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic verification and geographical distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Sampa-sampalukan",
    cebuanoName: "Kurukalungayan / Talikod",
    scientificName: "Phyllanthus niruri",
    sourceScientificName: "Phyllanthus niruri",
    category: "Renal & Diuretic",
    isDohApproved: false,
    evidenceClass: "EVIDENCE_SUPPORTED_PHILIPPINE_USE",
    medicinalUses: "Recognized as the 'stone-breaker' plant in traditional medicine; used to facilitate the passage of small urinary gravel and renal calculus, and to support hepatoprotective function.",
    preparationMethod: "Boil 1 whole clean uprooted plant in 2 glasses of water for 15 minutes. Cool and strain.",
    dosage: "Drink 1 cup twice daily for up to 2 weeks alongside abundant water intake.",
    warnings: "Seek immediate medical evaluation for acute urinary blockage, severe back pain, or hematuria. Contraindicated during pregnancy.",
    regionFound: "Found in damp, open places, gardens, and roadsides across the Philippines.",
    sources: [
      {
        title: "StuartXchange: Sampasampalukan (Phyllanthus niruri)",
        url: "https://www.stuartxchange.org/Sampasampalukan.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Litholytic and antiurolithiasis studies and traditional preparations.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Phyllanthus niruri",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:353995-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical nomenclature and distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Sibukao",
    cebuanoName: "Sibukao / Sapang",
    scientificName: "Caesalpinia sappan",
    sourceScientificName: "Biancaea sappan",
    category: "Circulatory & Women Health",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Red heartwood decoction traditionally used by Philippine traditional birth attendants (hilot) as an astringent postpartum uterine cleanse, blood tonic, and treatment for mild diarrhea. Contains antimicrobial brazilin.",
    preparationMethod: "Boil a few heartwood shavings in 3 glasses of water until deep red. Cool and strain.",
    dosage: "Drink 1 cup once or twice daily for a limited duration of 3 to 5 days.",
    warnings: "Contraindicated during pregnancy due to emmenagogue action. Not for prolonged daily intake.",
    regionFound: "Thickets and limestone dry hills in Panay, Guimaras, and southern Luzon.",
    sources: [
      {
        title: "StuartXchange: Sapang / Sibukao (Caesalpinia sappan)",
        url: "https://www.stuartxchange.org/Sapang.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Brazilin pigment, antibacterial activity, and traditional postpartum tea.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Biancaea sappan",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77158586-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Current accepted botanical binomial and distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Gugo",
    cebuanoName: "Gugo / Bayogo",
    scientificName: "Entada phaseoloides",
    sourceScientificName: "Entada phaseoloides",
    category: "Dermatological & Scalp",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Fibrous bark beaten and soaked in water to produce natural saponin-rich lather; used since pre-colonial times as a Philippine hair shampoo for dandruff, scalp itch, and hair vitality.",
    preparationMethod: "Macerate and pound a strip of fibrous gugo bark in a basin of water until it foams. Use the soapy liquid to rinse the hair and scalp.",
    dosage: "Use as hair wash 2 to 3 times weekly. External use only.",
    warnings: "Keep away from eyes; saponins cause stinging. The large seeds are toxic if swallowed raw.",
    regionFound: "Primary and secondary rainforests of Luzon, Palawan, Mindoro, and Mindanao.",
    sources: [
      {
        title: "StuartXchange: Gugo (Entada phaseoloides)",
        url: "https://www.stuartxchange.org/Gugo.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Traditional hair washing ethnobotany and saponin chemistry.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Entada phaseoloides",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:494191-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic identity and Indo-Pacific distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Kulitis",
    cebuanoName: "Uray / Titing-titing",
    scientificName: "Amaranthus spinosus",
    sourceScientificName: "Amaranthus spinosus",
    category: "Nutritional & Diuretic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Spiny amaranth used traditionally as a diuretic vegetable, lactagogue for nursing mothers, and cooling poultice for skin inflammation and boils.",
    preparationMethod: "Boil tender young leaves in soups as culinary greens; or boil 1 handful of clean roots in 2 glasses of water for a diuretic tea.",
    dosage: "Eaten as culinary vegetable or drink 1 cup of root decoction once daily.",
    warnings: "Contains mild oxalates; patients with calcium oxalate kidney stones should consume in moderation.",
    regionFound: "Common in cultivated fields, open grounds, and river banks throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Uray / Kulitis (Amaranthus spinosus)",
        url: "https://www.stuartxchange.org/Uray.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Nutritional profile, diuretic properties, and poultice applications.",
        supports: ["medicinalUses", "preparationMethod", "dosage"]
      },
      {
        title: "Kew POWO: Amaranthus spinosus",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:10714-2",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Dita",
    cebuanoName: "Dita",
    scientificName: "Alstonia scholaris",
    sourceScientificName: "Alstonia scholaris",
    category: "Fevers & Gastrointestinal",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Bitter tree bark historically regarded in the Philippines as a native substitute for quinine in chronic malarial fevers, intestinal dysentery, and as a digestive bitter.",
    preparationMethod: "Boil 1 small piece of dried bark (approx. 5 grams) in 2 glasses of water for 15 minutes. Cool and strain.",
    dosage: "Drink 1/2 cup twice daily for fever or digestive sluggishness for up to 3 days.",
    warnings: "High doses contain active indole alkaloids (ditamine, echitenine) that can cause cardiac depression and nausea. Use only under supervised traditional guidance.",
    regionFound: "Lowland and medium-altitude forests across Luzon, Visayas, and Mindanao.",
    sources: [
      {
        title: "StuartXchange: Dita (Alstonia scholaris)",
        url: "https://www.stuartxchange.org/Dita.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Historical antipyretic studies, ditaine alkaloid, and bark monographs.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Alstonia scholaris",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:76693-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and Asian forest occurrence.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Ikmo",
    cebuanoName: "Buyo / Mamin",
    scientificName: "Piper betle",
    sourceScientificName: "Piper betle",
    category: "Oral & Digestive",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Fresh leaf warmed with oil applied to the chest and abdomen for pediatric colic and cough; chewed traditionally for breath freshening and oral antiseptic qualities.",
    preparationMethod: "Wilt fresh leaves over flame with coconut oil and apply as a chest compress; or boil 5 leaves in 2 glasses of water for an oral gargle.",
    dosage: "Apply leaf poultice externally; use mouth gargle twice daily.",
    warnings: "Chewing with tobacco and lime is strongly associated with oral submucous fibrosis and cancer; the medicinal use is strictly topical or simple gargle without lime/tobacco.",
    regionFound: "Cultivated and wild throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Ikmo (Piper betle)",
        url: "https://www.stuartxchange.org/Ikmo.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Eugenol content, antimicrobial activity, and pediatric poultice records.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Piper betle",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:680581-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic identity and regional distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Bunga",
    cebuanoName: "Bunga",
    scientificName: "Areca catechu",
    sourceScientificName: "Areca catechu",
    category: "Oral & Parasitic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Astringent nut kernel historically utilized in Philippine folk veterinary and human medicine as an anthelmintic (expelling tapeworms) and astringent for gums.",
    preparationMethod: "Finely grated dried nut kernel boiled in water for an astringent mouth gargle.",
    dosage: "Use as mouth gargle; systemic internal use should be restricted due to arecoline toxicity.",
    warnings: "Chronic chewing of areca nut is a proven human carcinogen (IARC Group 1). Internal deworming requires supervised modern pharmaceutical anthelmintics instead.",
    regionFound: "Planted extensively in towns and rural gardens throughout the archipelago.",
    sources: [
      {
        title: "StuartXchange: Bunga (Areca catechu)",
        url: "https://www.stuartxchange.org/Bunga.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Arecoline chemistry, astringency, and anthelmintic reports.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Areca catechu",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:664101-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted palm species identity.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Hagonoy",
    cebuanoName: "Hagonoy",
    scientificName: "Chromolaena odorata",
    sourceScientificName: "Chromolaena odorata",
    category: "Wound Care & Hemostatic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Pounded fresh leaves are the classic rural Philippine quick hemostatic applied to shallow cuts, farm lacerations, and abrasions to stop bleeding and accelerate wound healing.",
    preparationMethod: "Wash fresh leaves thoroughly. Crush or chew into a paste and press firmly onto clean bleeding cuts.",
    dosage: "Apply topically to clean wounds until bleeding stops. External topical use only.",
    warnings: "External use only. Do not ingest; contains pyrrolizidine alkaloids that can cause liver toxicity upon ingestion.",
    regionFound: "Invasive shrub abundant along agricultural fields, pastures, and roadsides nationwide.",
    sources: [
      {
        title: "StuartXchange: Hagonoy (Chromolaena odorata)",
        url: "https://www.stuartxchange.org/Hagonoy.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Hemostatic activity, wound closure studies, and pyrrolizidine warning.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Chromolaena odorata",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:194723-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic verification and widespread tropical occurrence.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Ipil-ipil",
    cebuanoName: "Ipil-ipil / Agho",
    scientificName: "Leucaena leucocephala",
    sourceScientificName: "Leucaena leucocephala",
    category: "Parasitic & Antihelminthic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Traditional Philippine folk anthelmintic; mature dry seeds are lightly roasted, powdered, and ingested to expel intestinal roundworms (Ascaris).",
    preparationMethod: "Lightly roast mature seeds and grind into powder. Take with water or milk 2 hours after supper.",
    dosage: "Recorded traditional guidance is 1 teaspoon of powdered seeds for adults, followed by a mild laxative if needed.",
    warnings: "Contains the non-protein amino acid mimosine, which can cause reversible hair loss (alopecia) and goiter if taken in large or repeated doses. Not for young children.",
    regionFound: "Naturalized everywhere throughout the country in waste places and hillsides.",
    sources: [
      {
        title: "StuartXchange: Ipil-Ipil (Leucaena leucocephala)",
        url: "https://www.stuartxchange.org/Ipil-ipil.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Anthelmintic evaluations, mimosine toxicity, and roasted seed preparation.",
        supports: ["medicinalUses", "preparationMethod", "dosage", "warnings"]
      },
      {
        title: "Kew POWO: Leucaena leucocephala",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:503259-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and global pan-tropical presence.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Kalachuchi",
    cebuanoName: "Kalachuchi",
    scientificName: "Plumeria rubra",
    sourceScientificName: "Plumeria rubra",
    category: "Dermatological",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Milky latex and bark decoctions used externally in Philippine folk medicine for skin itch, ulcers, and drawing pus from boils.",
    preparationMethod: "Apply a drop of fresh white sap mixed with oil to calluses or boils; or boil bark for a topical wash.",
    dosage: "External topical spot application twice daily.",
    warnings: "External use only. The milky sap is an irritant and toxic upon ingestion; avoid contact with the eyes.",
    regionFound: "Widely planted in cemeteries, gardens, and urban landscapes throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Kalatsutsi / Kalachuchi (Plumeria rubra)",
        url: "https://www.stuartxchange.org/Kalatsutsi.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Latex properties, plumericin chemistry, and topical folk remedies.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Plumeria rubra",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:80993-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical binomial and horticultural distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Katmon",
    cebuanoName: "Katmon",
    scientificName: "Dillenia philippinensis",
    sourceScientificName: "Dillenia philippinensis",
    category: "Respiratory & Scalp",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Native Philippine tree with large acidic fleshy sepals; fruit juice mixed with sugar is taken traditionally for cough and fever, and used as a hair shampoo to clear dandruff.",
    preparationMethod: "Extract juice from mature fleshy sepals and dilute with water and honey for cough; or rub fresh juice into scalp before washing.",
    dosage: "Take 1 to 2 tablespoons of diluted fruit syrup 2 to 3 times daily.",
    warnings: "High acidity; dilute properly to avoid throat irritation.",
    regionFound: "Endemic to the Philippines; found in low- to medium-altitude forests across Babuyan, Luzon, Polillo, Mindoro, Leyte, Negros, and Mindanao.",
    sources: [
      {
        title: "StuartXchange: Katmon (Dillenia philippinensis)",
        url: "https://www.stuartxchange.org/Katmon.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Endemic Philippine tree ethnobotany, vitamin C acidity, and hair wash.",
        supports: ["medicinalUses", "preparationMethod", "dosage"]
      },
      {
        title: "Kew POWO: Dillenia philippinensis",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:316719-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Endemic Philippine botanical distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Kabling",
    cebuanoName: "Kabling / Kadlum",
    scientificName: "Pogostemon cablin",
    sourceScientificName: "Pogostemon cablin",
    category: "Nervous & Dermatological",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Aromatic leaves crushed and applied to forehead for tension headache; leaf infusion used for mild stomachaches and bath water for soothing rheumatism and repelling insects.",
    preparationMethod: "Crush fresh leaves and inhale aroma or apply as a compress to temples; or boil 1 handful in 2 glasses of water for a warm bath.",
    dosage: "External topical compress or warm bath as needed.",
    warnings: "Check for essential oil skin sensitivity in sensitive individuals.",
    regionFound: "Cultivated in home gardens and upland provinces throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Kabling / Patchouli (Pogostemon cablin)",
        url: "https://www.stuartxchange.org/Kabling.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Essential oil composition (patchoulol), cephalic relief, and insect repellent.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Pogostemon cablin",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:454556-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic identity and Southeast Asian cultivation.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Alugbati",
    cebuanoName: "Alugbati",
    scientificName: "Basella alba",
    sourceScientificName: "Basella alba",
    category: "Gastrointestinal & Nutrition",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Mucilaginous vegetable widely used in Philippine cuisine; valued as a gentle demulcent for constipation, digestive comfort, soothing gastritis, and supporting dietary iron intake.",
    preparationMethod: "Steam or simmer fresh leaves and succulent stems lightly in broths or vegetable soups.",
    dosage: "Consume 1 bowl of cooked vegetable with meals as part of a balanced diet.",
    warnings: "Safe food herb; no significant toxicities reported in ordinary dietary consumption.",
    regionFound: "Cultivated throughout the Philippines in kitchen gardens and commercial vegetable plots.",
    sources: [
      {
        title: "StuartXchange: Alugbati (Basella alba)",
        url: "https://www.stuartxchange.org/Alugbati.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Mucilage demulcent properties, nutritional iron content, and culinary medicine.",
        supports: ["medicinalUses", "preparationMethod", "dosage"]
      },
      {
        title: "Kew POWO: Basella alba",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:103444-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and pantropical naturalization.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Siling Labuyo",
    cebuanoName: "Sili / Katumbal",
    scientificName: "Capsicum frutescens",
    sourceScientificName: "Capsicum frutescens",
    category: "Analgesic & Circulatory",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Native small bird's eye chili; crushed leaves or warm fruit oils used externally as a rubefacient and counter-irritant for arthritic joint pain, rheumatism, and lumbago via capsaicin desensitization.",
    preparationMethod: "Warm crushed leaves gently in coconut oil; apply as a warm topical compress to aching joints.",
    dosage: "Apply topically 1 to 2 times daily to intact skin. Wash hands thoroughly afterward.",
    warnings: "Do not apply to open cuts, burns, or near the eyes or mucous membranes. Intense burning sensation can occur.",
    regionFound: "Abundant throughout all Philippine islands in gardens, thickets, and waste places.",
    sources: [
      {
        title: "StuartXchange: Siling Labuyo (Capsicum frutescens)",
        url: "https://www.stuartxchange.org/SilingLabuyo.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Capsaicinoid pain relief, counter-irritant poultice, and circulation stimulation.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Capsicum frutescens",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:316949-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and naturalization records.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Caimito",
    cebuanoName: "Kaimito",
    scientificName: "Chrysophyllum cainito",
    sourceScientificName: "Chrysophyllum cainito",
    category: "Gastrointestinal",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Tannin-rich leaves and bark boiled as an astringent decoction in Philippine folk medicine for non-specific acute diarrhea, dysentery, and as a mouthwash for bleeding gums.",
    preparationMethod: "Boil 1 handful of clean chopped leaves in 2 glasses of water for 15 minutes. Cool and strain.",
    dosage: "Drink 1/2 to 1 cup twice daily during acute non-infectious loose stools.",
    warnings: "If diarrhea persists beyond 48 hours or is accompanied by high fever or bloody stool, seek immediate clinical care.",
    regionFound: "Cultivated in backyards and orchards across the Philippines.",
    sources: [
      {
        title: "StuartXchange: Caimito / Kaimito (Chrysophyllum cainito)",
        url: "https://www.stuartxchange.org/Caimito.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Tannin astringency, antidiarrheal decoctions, and fruit antioxidants.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Chrysophyllum cainito",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:786358-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification and tropical distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Bitaog",
    cebuanoName: "Bitaog / Dangkalan",
    scientificName: "Calophyllum inophyllum",
    sourceScientificName: "Calophyllum inophyllum",
    category: "Dermatological & Wound Care",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Nut kernel yields greenish oil (tamanu oil) with exceptional cicatrizing and antimicrobial properties; traditionally massaged on recalcitrant skin ulcers, burns, scars, and rheumatism.",
    preparationMethod: "Cold-press or extract oil from cured kernels; apply several drops topically to clean affected skin.",
    dosage: "Apply 2 to 3 drops to clean skin twice daily. External use only.",
    warnings: "External use only. Do not ingest crude oil. Conduct a patch test to rule out contact allergy.",
    regionFound: "Coastal areas, sandy shores, and lowlands throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Bitaog / Palo Maria (Calophyllum inophyllum)",
        url: "https://www.stuartxchange.org/Bitaog.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Calophyllic acid chemistry, wound regeneration, and cicatrizing oil studies.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Calophyllum inophyllum",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:427187-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Coastal Indo-Pacific taxonomic distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Bulak-manok",
    cebuanoName: "Bahug-bahug",
    scientificName: "Ageratum conyzoides",
    sourceScientificName: "Ageratum conyzoides",
    category: "Wound Care & Gastrointestinal",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Billygoat weed; crushed fresh leaves used topically as a traditional hemostatic and antiseptic wash for cuts, sores, and burns; leaf decoction occasionally taken for mild colic.",
    preparationMethod: "Pound clean fresh leaves to form a moist poultice; apply directly to small lacerations.",
    dosage: "Apply topically twice daily. Keep clean with sterile dressing.",
    warnings: "Contains pyrrolizidine alkaloids; internal ingestion should be strictly avoided due to hepatotoxicity risks.",
    regionFound: "Common weed in roadsides, agricultural fields, and wastelands nationwide.",
    sources: [
      {
        title: "StuartXchange: Bulak-Manok (Ageratum conyzoides)",
        url: "https://www.stuartxchange.org/BulakManok.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Antimicrobial screening, wound healing models, and hepatotoxic warnings.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Ageratum conyzoides",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:176045-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and global pantropical range.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Lauat",
    cebuanoName: "Tayapok / Lauat",
    scientificName: "Litsea glutinosa",
    sourceScientificName: "Litsea glutinosa",
    category: "Dermatological & Scalp",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Mucilaginous leaves steeped in water historically used in the Philippines as a traditional scalp cleanser and hair growth promoter (featured in commercial Lauat herbal shampoos).",
    preparationMethod: "Shred fresh leaves and macerate in cool water until viscous and slimy. Massage the mucilage thoroughly into hair and scalp.",
    dosage: "Leave on scalp for 15 minutes before rinsing with clean water, 2 to 3 times weekly.",
    warnings: "For external scalp application. Rinse thoroughly if it comes into contact with the eyes.",
    regionFound: "Secondary forests and thickets at low and medium altitudes across Luzon, Visayas, and Mindanao.",
    sources: [
      {
        title: "StuartXchange: Sablot / Lauat (Litsea glutinosa)",
        url: "https://www.stuartxchange.org/Sablot.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Mucilage composition, hair tonic ethnobotany, and dermatological uses.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Litsea glutinosa",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:465715-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic status and native Philippine forest occurrence.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Putok-putokan",
    cebuanoName: "Lobo-lobohan",
    scientificName: "Physalis angulata",
    sourceScientificName: "Physalis angulata",
    category: "Infectious & Fevers",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Wild cape gooseberry; whole plant decoction consumed in folk medicine for reducing fevers, relieving jaundice, and mitigating urinary tract burning.",
    preparationMethod: "Boil 1 whole clean fresh plant in 3 glasses of water for 15 minutes. Cool and strain.",
    dosage: "Drink 1/2 cup twice daily after meals for a few days.",
    warnings: "Unripe fruits and leaves contain solanine-like compounds; do not consume unripe green fruits. Not for pregnant women.",
    regionFound: "Open wastelands, garden borders, and moist river banks throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Asituan / Putok-Putokan (Physalis angulata)",
        url: "https://www.stuartxchange.org/Asituan.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Physalin steroid content, anti-inflammatory activity, and febrifuge uses.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Physalis angulata",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:817024-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and global distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Paku",
    cebuanoName: "Pako",
    scientificName: "Diplazium esculentum",
    sourceScientificName: "Diplazium esculentum",
    category: "Nutritional & Tonic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Popular wild edible river fern in the Philippines; highly valued for its rich dietary iron, calcium, and phosphorus content, traditionally eaten to combat nutritional anemia and general fatigue.",
    preparationMethod: "Blanch young tender fiddlehead fronds in boiling water for 2 minutes; serve as salad with tomatoes, onions, and calamansi vinaigrette.",
    dosage: "Enjoy 1 serving as a nutritious side vegetable with meals.",
    warnings: "Always blanch or cook before eating; wild ferns contain ptaquiloside and thiaminase in raw form that are deactivated by cooking.",
    regionFound: "Abundant along shady freshwater stream banks and moist forest valleys throughout the country.",
    sources: [
      {
        title: "StuartXchange: Paku / Paco (Diplazium esculentum)",
        url: "https://www.stuartxchange.org/Pako.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Nutritional mineral composition, edible fern tradition, and preparation safety.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Diplazium esculentum",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:17088990-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Fern taxonomy and paleotropical occurrence.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Tubang-bakod",
    cebuanoName: "Tubang-bakod / Tuba",
    scientificName: "Jatropha curcas",
    sourceScientificName: "Jatropha curcas",
    category: "Dermatological (Caution)",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Physic nut; fresh leaves wilted in oil are traditionally applied as an external poultice for arthritic swelling, sprains, and back pain.",
    preparationMethod: "Warm clean fresh leaves with coconut oil over gentle flame; bind as a topical poultice to the affected painful joint.",
    dosage: "External topical application only. Keep on painful area for 1 to 2 hours.",
    warnings: "CRITICAL SAFETY WARNING: Seeds and crude sap are severely toxic if swallowed, containing lethal curcin toxalbumins and phorbol esters. Strictly for external application on intact skin.",
    regionFound: "Widely planted as hedges and boundary markers in agricultural communities across the Philippines.",
    sources: [
      {
        title: "StuartXchange: Tuba / Tubang-Bakod (Jatropha curcas)",
        url: "https://www.stuartxchange.org/Tuba.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Phorbol esters, toxalbumin curcin warnings, and topical counter-irritant poultices.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Jatropha curcas",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:350325-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification and distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Uray",
    cebuanoName: "Kalunay",
    scientificName: "Amaranthus viridis",
    sourceScientificName: "Amaranthus viridis",
    category: "Nutritional & Diuretic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Slender amaranth; smooth spineless wild vegetable cooked in broths for nourishing convalescent patients, stimulating mild diuresis, and cooling internal heat.",
    preparationMethod: "Cook young shoots and leaves in clear vegetable broths or saute with garlic.",
    dosage: "Eat 1 cup of cooked greens with meals.",
    warnings: "Generally recognized as safe as culinary food.",
    regionFound: "Abundant weed in gardens, waste grounds, and roadsides nationwide.",
    sources: [
      {
        title: "StuartXchange: Kolitis / Uray (Amaranthus viridis)",
        url: "https://www.stuartxchange.org/Kolitis.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Nutritional minerals, demulcent properties, and wild culinary traditions.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Amaranthus viridis",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:10720-2",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic identity and global distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Kamantigue",
    cebuanoName: "Kamantigue",
    scientificName: "Impatiens balsamina",
    sourceScientificName: "Impatiens balsamina",
    category: "Dermatological",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Garden balsam; crushed flowers and leaves are applied as a traditional poultice for fungal nail infections, superficial burns, and contusions. Contains lawsone-like naphthoquinones.",
    preparationMethod: "Crush fresh red or pink flowers into a moist paste; bind directly over fungal toenails or contusions with gauze.",
    dosage: "Apply poultice overnight for several days.",
    warnings: "External topical use only. High oral ingestion of leaves may cause vomiting and diarrhea due to calcium oxalate crystals.",
    regionFound: "Commonly cultivated in flower gardens throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Kamantigue (Impatiens balsamina)",
        url: "https://www.stuartxchange.org/Kamantigue.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Naphthoquinones antifungal screening and traditional nail poultices.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Impatiens balsamina",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:30006764-2",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and cultivated distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Lipote",
    cebuanoName: "Lipote / Balig-ang",
    scientificName: "Syzygium polycephaloides",
    sourceScientificName: "Syzygium polycephaloides",
    category: "Cardiovascular & Antioxidant",
    isDohApproved: false,
    evidenceClass: "EVIDENCE_SUPPORTED_PHILIPPINE_USE",
    medicinalUses: "Native Philippine wild fruit tree studied by DOST for potent antioxidant capacities, high anthocyanin content, and antihypertensive vasodilating properties.",
    preparationMethod: "Eat fresh ripe dark purple fruits with rock salt, or boil 1 handful of dried leaves in 2 glasses of water for an antioxidant tea.",
    dosage: "1 cup of tea or a small bowl of fresh fruit daily.",
    warnings: "Safe fruit tree; patients on blood pressure medications should consult their physician before using concentrated extract supplements.",
    regionFound: "Indigenous to Luzon, Mindoro, Sibuyan, Samar, and Leyte primary and secondary forests.",
    sources: [
      {
        title: "StuartXchange: Lipote / Balig-ang (Syzygium polycephaloides)",
        url: "https://www.stuartxchange.org/Lipote.html",
        publisher: "Philippine Alternative Medicine",
        citation: "DOST-PCHRD antioxidant screenings, anthocyanin profiling, and native uses.",
        supports: ["medicinalUses", "preparationMethod", "dosage"]
      },
      {
        title: "Kew POWO: Syzygium polycephaloides",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:602010-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Philippine endemic botanical taxonomy.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Talumpunay",
    cebuanoName: "Talumpunay",
    scientificName: "Datura metel",
    sourceScientificName: "Datura metel",
    category: "Respiratory (Strict Warnings)",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Historical Philippine remedy where dried leaves were rolled and smoked as asthma cigarettes for acute bronchial spasms. Extensively documented in historical pharmacopeias.",
    preparationMethod: "Historical practice only: rolled dried leaves were inhaled as antispasmodic smoke during severe paroxysms of asthma.",
    dosage: "No safe home dosage exists. In modern medicine, pure isolated scopolamine/atropine replaces crude plant administration.",
    warnings: "EXTREME TOXICITY WARNING: Contains lethal anticholinergic tropane alkaloids (hyoscine, scopolamine, atropine). Accidental ingestion causes delirium, hyperthermia, seizures, and death. DO NOT ingest or brew.",
    regionFound: "Spontaneous weed in open places and thickets near settlements across the Philippines.",
    sources: [
      {
        title: "StuartXchange: Talumpunay (Datura metel)",
        url: "https://www.stuartxchange.org/Talumpunay.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Historical asthma smoke monograph, tropane alkaloid toxicology, and toxicity alerts.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Datura metel",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:815243-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Balinghasay",
    cebuanoName: "Balinghasay",
    scientificName: "Buchanania arborescens",
    sourceScientificName: "Buchanania arborescens",
    category: "Wound Care & Astringent",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Indigenous Philippine forest tree; bark and leaf decoctions are traditionally used as an astringent gargle for sore throat, bleeding gums, and external antiseptic for cuts.",
    preparationMethod: "Boil clean bark pieces or mature leaves in 2 glasses of water for 15 minutes. Cool and strain.",
    dosage: "Use as mouth rinse or skin wash twice daily.",
    warnings: "For external wash and gargle; do not swallow large amounts.",
    regionFound: "Found in lowland forests throughout Luzon, Palawan, Mindoro, and Mindanao.",
    sources: [
      {
        title: "StuartXchange: Balinghasay (Buchanania arborescens)",
        url: "https://www.stuartxchange.org/Balinghasai.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Astringent bark chemistry, mouthwash ethnobotany, and forest occurrence.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Buchanania arborescens",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:69308-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and native range.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Dampalit",
    cebuanoName: "Dampalit",
    scientificName: "Sesuvium portulacastrum",
    sourceScientificName: "Sesuvium portulacastrum",
    category: "Nutritional & Dermatological",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Shoreline sea purslane; succulent salty leaves eaten traditionally along Philippine coasts for scurvy, mineral replenishment, and pounded into a poultice for insect stings.",
    preparationMethod: "Rinse repeatedly in fresh water to remove excess salt; steam lightly or pound fresh leaves into a soothing skin poultice.",
    dosage: "Eat 1 small portion as dietary side dish, or apply poultice to sting for 30 minutes.",
    warnings: "High natural sodium content; people on strict salt-restricted diets should consume sparingly.",
    regionFound: "Coastal beaches, brackish mud flats, and mangrove edges across the Philippine archipelago.",
    sources: [
      {
        title: "StuartXchange: Dampalit (Sesuvium portulacastrum)",
        url: "https://www.stuartxchange.org/Dampalit.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Coastal succulent ethnobotany, saline minerals, and poultice uses.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Sesuvium portulacastrum",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:364426-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Coastal halophyte botanical classification.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Adelfa",
    cebuanoName: "Adelfa / Baladre",
    scientificName: "Nerium oleander",
    sourceScientificName: "Nerium oleander",
    category: "Dermatological (Toxic)",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Historic external folk preparation where crushed leaves in oil were applied with extreme caution to treat intractable scabies, ringworm, and skin parasites.",
    preparationMethod: "Historical external only: leaf extract formulated in oil for localized skin parasites under strict supervision.",
    dosage: "NO INTERNAL DOSE. Modern pharmaceutical dermatologics should always be used instead.",
    warnings: "LETHAL TOXICITY WARNING: All parts of the plant contain deadly cardiac glycosides (oleandrin, neriine). Ingestion of even a single leaf can cause lethal cardiac arrhythmias and death. NEVER ingest.",
    regionFound: "Common ornamental shrub in gardens, parks, and roadsides nationwide.",
    sources: [
      {
        title: "StuartXchange: Adelfa (Nerium oleander)",
        url: "https://www.stuartxchange.org/Adelfa.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Cardiac glycoside toxicology, lethal poisoning alerts, and historic external washes.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Nerium oleander",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:80628-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic status and ornamental distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Aroma",
    cebuanoName: "Aroma",
    scientificName: "Vachellia farnesiana",
    sourceScientificName: "Acacia farnesiana",
    category: "Astringent & Respiratory",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Sweet acacia; bark decoction used as an astringent wash for bleeding gums, mouth sores, and gargle for sore throats; fragrant yellow blossoms steeped for soothing chest congestion.",
    preparationMethod: "Boil 1 handful of clean bark in 2 glasses of water for 15 minutes. Cool and strain.",
    dosage: "Use as oral mouth gargle twice daily.",
    warnings: "Astringent preparation for topical mouth rinse and gargle; do not ingest large quantities of concentrated bark tea.",
    regionFound: "Thickets, pastures, and dry open places in Luzon and Visayas.",
    sources: [
      {
        title: "StuartXchange: Aroma (Acacia farnesiana / Vachellia farnesiana)",
        url: "https://www.stuartxchange.org/Aroma.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Astringency, tannin content, fragrant blossom infusions, and gargle recipes.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Vachellia farnesiana",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77068135-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical binomial and global distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Biga",
    cebuanoName: "Biga",
    scientificName: "Alocasia macrorrhizos",
    sourceScientificName: "Alocasia macrorrhizos",
    category: "Topical Counter-irritant",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Giant taro; thick fleshy petiole is sliced, warmed over coals, and applied as an external counter-irritant poultice for rheumatic joint pains and muscular stiffness.",
    preparationMethod: "Slice a piece of fresh petiole, heat gently over coals, and rub over painful rheumatic joints on intact skin.",
    dosage: "External topical rub for 10 minutes. Wash skin afterward.",
    warnings: "Raw sap contains sharp calcium oxalate raphides that cause severe skin burning and stinging. Never ingest raw tissue; causes severe throat swelling.",
    regionFound: "Moist gullies, secondary forests, and abandoned homesteads throughout the country.",
    sources: [
      {
        title: "StuartXchange: Biga (Alocasia macrorrhizos)",
        url: "https://www.stuartxchange.org/Biga.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Raphide calcium oxalate warnings, counter-irritant uses, and taro ethnobotany.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Alocasia macrorrhizos",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:84297-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and tropical distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Dilang-butiki",
    cebuanoName: "Dilang-butiki",
    scientificName: "Centratherum punctatum",
    sourceScientificName: "Centratherum punctatum",
    category: "Gastrointestinal",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Larkdaisy; fragrant leaves steeped in hot water as a traditional carminative herbal tea for relieving stomach cramps, bloating, and indigestion.",
    preparationMethod: "Steep 3 to 4 fresh leaves in 1 cup of hot boiled water for 5 minutes. Strain.",
    dosage: "Drink 1 cup warm after meals as needed.",
    warnings: "Individuals sensitive to the Asteraceae daisy family should exercise caution for possible contact allergy.",
    regionFound: "Cultivated in flower gardens and naturalized in cool elevated localities.",
    sources: [
      {
        title: "StuartXchange: Dilang-Butiki (Centratherum punctatum)",
        url: "https://www.stuartxchange.org/DilangButiki.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Volatile oil constituents, carminative infusion, and stomachic uses.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Centratherum punctatum",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:192452-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Gumamela de Araña",
    cebuanoName: "Gumamela de Araña",
    scientificName: "Hibiscus schizopetalus",
    sourceScientificName: "Hibiscus schizopetalus",
    category: "Expectorant & Emollient",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Coral hibiscus with deeply fringed reflexed petals; flower infusions are traditionally used as a mild soothing demulcent for dry irritated cough and mucosal inflammation.",
    preparationMethod: "Steep 2 clean fresh flower blossoms in 1 cup of freshly boiled water for 10 minutes. Sweeten with honey.",
    dosage: "Drink 1 cup warm twice daily for throat tickle and dry cough.",
    warnings: "Safe flower infusion; not a substitute for clinical antibiotic therapy in bacterial respiratory infections.",
    regionFound: "Planted as an ornamental garden shrub in residential areas nationwide.",
    sources: [
      {
        title: "StuartXchange: Gumamela de Araña (Hibiscus schizopetalus)",
        url: "https://www.stuartxchange.org/GumamelaAra%F1a.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Demulcent mucilage content, flower infusions, and traditional cough soothing.",
        supports: ["medicinalUses", "preparationMethod", "dosage"]
      },
      {
        title: "Kew POWO: Hibiscus schizopetalus",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:560738-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical species and horticultural presence.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Kasupangil",
    cebuanoName: "Kasupangil",
    scientificName: "Clerodendrum intermedium",
    sourceScientificName: "Clerodendrum intermedium",
    category: "Fevers & Parasitic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Glorybower; warm crushed leaves applied to the abdomen or swollen glands for reducing inflammation; leaf decoction historically taken for intermittent fevers.",
    preparationMethod: "Wilt fresh leaves over flame with oil and bind as a warm poultice over swollen lymph glands or joints.",
    dosage: "Apply poultice for 1 hour twice daily.",
    warnings: "For external poultice; internal consumption of large amounts of Clerodendrum species can cause gastric upset.",
    regionFound: "Common in secondary forests, thickets, and ravines throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Kasupangil (Clerodendrum intermedium)",
        url: "https://www.stuartxchange.org/Kasupangil.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Anti-inflammatory leaf poultice ethnobotany and fever remedy records.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Clerodendrum intermedium",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:862211-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and Philippine native distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Lagikway",
    cebuanoName: "Lagikway",
    scientificName: "Abelmoschus manihot",
    sourceScientificName: "Abelmoschus manihot",
    category: "Nutritional & Demulcent",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Aibika; nutrient-rich mucilaginous leaves boiled in traditional broths to coat irritated digestive mucosa, soothe acid heartburn, and provide dietary vitamin A and protein.",
    preparationMethod: "Steam or simmer tender young leaves in vegetable dishes or clear broths.",
    dosage: "Consume 1 bowl of cooked vegetable soup with meals.",
    warnings: "Nutritious edible food plant; no significant contraindications reported.",
    regionFound: "Cultivated in indigenous backyard plots across Mindanao, Visayas, and southern Luzon.",
    sources: [
      {
        title: "StuartXchange: Lagikway (Abelmoschus manihot)",
        url: "https://www.stuartxchange.org/Lagikway.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Nutritional amino acid profile, demulcent properties, and culinary uses.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Abelmoschus manihot",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:558661-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Lantana",
    cebuanoName: "Bahug-bahug / Kantutay",
    scientificName: "Lantana camara",
    sourceScientificName: "Lantana camara",
    category: "Dermatological",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Wild sage; aromatic leaves boiled into an external antiseptic wash or warm bath to relieve itching, eczema, scabies, and muscular fatigue.",
    preparationMethod: "Boil 2 handfuls of clean leaves in a small kettle of water for 15 minutes. Cool to lukewarm and use as a wash.",
    dosage: "Apply wash to itchy skin twice daily. External use only.",
    warnings: "External use only. Unripe green berries are toxic to humans and livestock (lantadene A and B hepatotoxicity). Do not ingest.",
    regionFound: "Abundant perennial shrub in thickets, pastures, and roadsides throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Kantutay / Lantana (Lantana camara)",
        url: "https://www.stuartxchange.org/Kantutay.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Antipruritic bath preparations, lantadene triterpenoid toxicology, and external washes.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Lantana camara",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:863777-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic status and pantropical invasion records.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Lipang-aso",
    cebuanoName: "Dalamo / Lipa",
    scientificName: "Laportea interrupta",
    sourceScientificName: "Laportea interrupta",
    category: "Diuretic & Women Health",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Hen's nettle; leaf decoction traditionally used as a mild diuretic and tonic wash; applied externally to relieve joint pains and minor skin irritations.",
    preparationMethod: "Boil 1 handful of clean leaves in 2 glasses of water for 10 minutes. Strain.",
    dosage: "Drink 1 cup once daily, or use as topical wash.",
    warnings: "Fresh plants have stinging hairs that cause immediate contact wheals and itching; handle with gloves.",
    regionFound: "Damp shaded waste grounds, thickets, and near dwellings throughout the country.",
    sources: [
      {
        title: "StuartXchange: Lipang-Aso (Laportea interrupta)",
        url: "https://www.stuartxchange.org/LipangAso.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Urticaceous stinging hairs, traditional diuretic decoctions, and caution notes.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Laportea interrupta",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:854817-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and Asian-Pacific range.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Malatinta",
    cebuanoName: "Malatinta",
    scientificName: "Phyllanthus reticulatus",
    sourceScientificName: "Phyllanthus reticulatus",
    category: "Astringent & Diuretic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Black-honey shrub; leaf decoction used as an astringent gargle for sore mouth, bleeding gums, and oral aphthae (singaw); fruit yields dark purple dye traditionally used as ink.",
    preparationMethod: "Boil 1 handful of clean leaves in 2 glasses of water for 10 minutes. Cool and strain.",
    dosage: "Gargle lukewarm decoction in mouth for 1 minute twice daily.",
    warnings: "For mouthwash and gargle; do not swallow large amounts.",
    regionFound: "Common in thickets, river banks, and secondary forests throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Tintatintahan / Malatinta (Phyllanthus reticulatus)",
        url: "https://www.stuartxchange.org/Tintatintahan.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Astringent tannins, mouthwash ethnobotany, and pigment uses.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Phyllanthus reticulatus",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:354098-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification and distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Pipino",
    cebuanoName: "Pipino",
    scientificName: "Cucumis sativus",
    sourceScientificName: "Cucumis sativus",
    category: "Dermatological & Hydration",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Cooling hydrating vegetable; fresh slices or cold juice applied topically to soothe sunburn, reduce under-eye puffiness, and relieve prickly heat; eaten for gentle diuresis.",
    preparationMethod: "Slice chilled fresh cucumber and place directly on irritated skin or closed eyes for 15 minutes; or blend fresh juice with calamansi.",
    dosage: "Apply slices topically as needed, or drink 1 glass of fresh juice.",
    warnings: "Safe culinary plant; no significant adverse effects.",
    regionFound: "Cultivated extensively throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Pipino (Cucumis sativus)",
        url: "https://www.stuartxchange.org/Pipino.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Hydration, cucurbitacins, and topical dermatological soothing.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Cucumis sativus",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:292271-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic identity and global agricultural range.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Patani",
    cebuanoName: "Patani",
    scientificName: "Phaseolus lunatus",
    sourceScientificName: "Phaseolus lunatus",
    category: "Nutritional",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Lima bean; nutritious legume rich in dietary protein, soluble fiber, and minerals; crushed leaves traditionally used as a soothing poultice for abdominal swelling.",
    preparationMethod: "Boil mature seeds thoroughly until soft and tender in traditional stews and soups.",
    dosage: "Eat 1 cup of thoroughly cooked beans with meals.",
    warnings: "Must always be thoroughly cooked before eating; raw beans contain cyanogenic glucosides (linamarin) that are destroyed by prolonged boiling.",
    regionFound: "Cultivated in rural backyards and small farms throughout the Philippines.",
    sources: [
      {
        title: "StuartXchange: Patani (Phaseolus lunatus)",
        url: "https://www.stuartxchange.org/Patani.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Nutritional profile, cyanogenic glucoside boiling requirement, and poultices.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Phaseolus lunatus",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:513076-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Botanical taxonomy and worldwide cultivation.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Payang-payang",
    cebuanoName: "Payang-payang",
    scientificName: "Flemingia strobilifera",
    sourceScientificName: "Flemingia strobilifera",
    category: "Postpartum & Rheumatic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Wild hops; aromatic leaves boiled in water to prepare restorative postpartum steam baths (suob) and washes for new mothers, and warm compress for rheumatic aching limbs.",
    preparationMethod: "Boil 2 large handfuls of leaves in a large pot of water. Use for aromatic post-delivery herbal bath wash.",
    dosage: "Use warm bath once daily for 3 days following childbirth.",
    warnings: "External bath wash; do not take internally without traditional practitioner guidance.",
    regionFound: "Dry open grasslands, hills, and thickets in Luzon, Mindoro, and Palawan.",
    sources: [
      {
        title: "StuartXchange: Payang-Payang (Flemingia strobilifera)",
        url: "https://www.stuartxchange.org/PayangPayang.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Traditional postpartum herbal bath ethnobotany and antirheumatic washes.",
        supports: ["medicinalUses", "preparationMethod"]
      },
      {
        title: "Kew POWO: Flemingia strobilifera",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:495449-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification and distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Tabako",
    cebuanoName: "Tabako",
    scientificName: "Nicotiana tabacum",
    sourceScientificName: "Nicotiana tabacum",
    category: "Topical Antiseptic (Historical)",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Historic external folk use: leaves soaked in water were applied by forest travelers to detach jungle leeches (limatik), and leaf water was used as an agricultural insecticide.",
    preparationMethod: "Historical external only: leaf water applied directly to leeches to facilitate detachment.",
    dosage: "DO NOT INGEST. Smoking or internal consumption carries extreme carcinogenic and cardiovascular harms.",
    warnings: "HIGH TOXICITY WARNING: Highly addictive nicotine is readily absorbed through skin and mucosal membranes. Ingestion or systemic absorption causes tremors, vomiting, and nicotine toxicity.",
    regionFound: "Cultivated extensively in Ilocos, Pangasinan, and Cagayan Valley.",
    sources: [
      {
        title: "StuartXchange: Tabako (Nicotiana tabacum)",
        url: "https://www.stuartxchange.org/Tabako.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Nicotine alkaloid toxicology, leech detachment folk use, and health hazard warnings.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Nicotiana tabacum",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:816049-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Taxonomic status and commercial cultivation records.",
        supports: ["identity", "regionFound"]
      }
    ]
  },
  {
    localName: "Tambalisa",
    cebuanoName: "Tambalisa / Mangalisa",
    scientificName: "Sophora tomentosa",
    sourceScientificName: "Sophora tomentosa",
    category: "Gastrointestinal & Emetic",
    isDohApproved: false,
    evidenceClass: "DOCUMENTED_TRADITIONAL_USE",
    medicinalUses: "Silver bush; coastal shrub whose bitter seeds and roots were historically used in coastal Philippine communities in small amounts as a stomachic and antidote to marine food poisoning.",
    preparationMethod: "Historical only: infusion of a fraction of a seed taken in emergencies for food poisoning.",
    dosage: "No safe home dosage cleared; seeds contain active quinolizidine alkaloids (cytisine, sophorine).",
    warnings: "Contains cytisine, a toxic alkaloid that causes violent vomiting, bradycardia, and respiratory paralysis in overdose. Do not use without emergency medical supervision.",
    regionFound: "Sandy coastal seashores and littoral thickets throughout the Philippine archipelago.",
    sources: [
      {
        title: "StuartXchange: Tambalisa (Sophora tomentosa)",
        url: "https://www.stuartxchange.org/Tambalisa.html",
        publisher: "Philippine Alternative Medicine",
        citation: "Coastal shrub ethnobotany, cytisine alkaloid toxicity, and emergency emetic uses.",
        supports: ["medicinalUses", "preparationMethod", "warnings"]
      },
      {
        title: "Kew POWO: Sophora tomentosa",
        url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:519416-1",
        publisher: "Royal Botanic Gardens, Kew",
        citation: "Accepted botanical classification and coastal pantropical distribution.",
        supports: ["identity", "regionFound"]
      }
    ]
  }
];

export async function runExpansion() {
  console.log(`🌿 Starting expansion import of ${NEW_FIFTY_HERBS.length} Philippine herbs...`);
  let inserted = 0;
  let updated = 0;

  for (const herb of NEW_FIFTY_HERBS) {
    try {
      const existing = await prisma.herb.findFirst({
        where: {
          OR: [
            { scientificName: { equals: herb.scientificName, mode: "insensitive" } },
            { localName: { equals: herb.localName, mode: "insensitive" } },
          ],
        },
      });

      const herbData = {
        localName: herb.localName,
        cebuanoName: herb.cebuanoName,
        scientificName: herb.scientificName,
        sourceScientificName: herb.sourceScientificName ?? herb.scientificName,
        category: herb.category,
        medicinalUses: herb.medicinalUses,
        preparationMethod: herb.preparationMethod,
        dosage: herb.dosage,
        regionFound: herb.regionFound,
        warnings: herb.warnings,
        isDohApproved: herb.isDohApproved,
        isVerified: true,
        publicationStatus: "PUBLISHED" as const,
        evidenceClass: herb.evidenceClass,
        provenance: "BUILT_IN" as const,
        reviewedAt: new Date(),
      };

      const record = existing
        ? await prisma.herb.update({ where: { id: existing.id }, data: herbData })
        : await prisma.herb.create({ data: herbData });

      if (existing) updated++;
      else inserted++;

      // Generate embedding
      const textToEmbed = [
        herb.localName,
        herb.cebuanoName,
        herb.scientificName,
        herb.category,
        herb.evidenceClass,
        herb.medicinalUses,
        herb.preparationMethod,
        herb.dosage,
        herb.warnings,
      ].filter(Boolean).join(" ");

      try {
        const embedding = await generateEmbedding(textToEmbed);
        await prisma.$executeRawUnsafe(
          `UPDATE "Herb" SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2`,
          `[${embedding.join(",")}]`,
          record.id
        );
      } catch (embErr) {
        console.warn(`⚠️ Embedding generation deferred for ${herb.localName}:`, embErr);
      }

      // Add Sources
      for (const src of herb.sources) {
        const existingSrc = await prisma.herbSource.findFirst({
          where: { herbId: record.id, title: src.title },
        });

        if (!existingSrc) {
          await prisma.herbSource.create({
            data: {
              herbId: record.id,
              title: src.title,
              url: src.url,
              publisher: src.publisher,
              citation: src.citation,
              supports: src.supports,
              accessedAt: new Date(),
            },
          });
        }
      }

      console.log(`✅ [${existing ? "UPDATED" : "INSERTED"}] ${herb.localName} (${herb.scientificName})`);
    } catch (err) {
      console.error(`❌ Error importing ${herb.localName}:`, err);
    }
  }

  const finalCount = await prisma.herb.count();
  console.log(`\n🎉 Completed! Inserted: ${inserted}, Updated: ${updated}. Total DB Herbs: ${finalCount}`);
}

async function main() {
  try {
    await runExpansion();
  } finally {
    await closeDatabasePool();
  }
}

if (process.argv[1]?.endsWith("expansion-50-herbs.ts")) {
  main().catch((err) => {
    console.error("Fatal expansion error:", err);
    process.exit(1);
  });
}
