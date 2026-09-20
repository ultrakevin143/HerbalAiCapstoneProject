import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { generateEmbedding } from "../src/services/ai/core/gemini-service.js";

dotenv.config();

const DOH_HERBS = [
  {
    localName: "Lagundi",
    cebuanoName: "Dangla / Lagundi",
    scientificName: "Vitex negundo",
    sourceScientificName: "Vitex negundo",
    category: "Respiratory",
    medicinalUses: "Clinical evidence in the Philippine setting supports Lagundi's antitussive (cough-relieving) use.",
    preparationMethod: "Boil crushed fresh Lagundi leaves in 2 cups of water until only half of the water remains. Keep the pot uncovered once it starts boiling.",
    dosage: "Recorded preparation amounts of crushed leaves are 1½ tablespoons for ages 2–6, 3 tablespoons for ages 7–12, and 6 tablespoons for ages 13 and above.",
    regionFound: "Distributed throughout the Philippines.",
    warnings: "Consult a health professional for diagnosis and advice, especially for young children or if a cough persists or worsens.",
    imageUrl: "/images/herbs/lagundi.jpg",
    imageCreator: "Greg III Espera",
    imageSourceUrl: "https://www.inaturalist.org/observations/10163763",
    imageLicense: "CC BY 4.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    imageModification: "No source-file edits; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Sambong",
    cebuanoName: "Alibhon / Gabuen",
    scientificName: "Blumea balsamifera",
    sourceScientificName: "Blumea balsamifera",
    category: "Renal / Diuretic",
    medicinalUses: "Clinical evidence in the Philippine setting supports diuretic and antiuricemic activity. Kidney-stone dissolution remains supported only by preclinical evidence.",
    preparationMethod: "Boil minced, freshly picked Sambong leaves in 2 glasses of water until only half remains, keeping the pot uncovered once boiling. Cool, strain, and divide into 3 portions.",
    dosage: "Recorded leaf amounts are 3 tablespoons for ages 7–12 and 6 tablespoons for ages 13 and above. The prepared decoction is divided into 3 portions taken during the day.",
    regionFound: "Distributed throughout the Philippines.",
    warnings: "Visit a health center for diagnosis and treatment guidance for suspected kidney stones. Follow professional advice about fluid intake, especially if medically fluid-restricted.",
    imageUrl: "/images/herbs/sambong.jpg",
    imageCreator: "Vreni Gem O. Caasi",
    imageSourceUrl: "https://www.inaturalist.org/observations/43861367",
    imageLicense: "CC BY 4.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    imageModification: "No source-file edits; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Ampalaya",
    cebuanoName: "Paliya",
    scientificName: "Momordica charantia",
    sourceScientificName: "Momordica charantia",
    category: "Metabolic / Endocrine",
    medicinalUses: "Clinical evidence has evaluated Ampalaya for blood-sugar control and metabolic syndrome. Its use should remain under professional guidance.",
    preparationMethod: "Under health-professional guidance, Ampalaya leaves may be eaten as salad or with meals. A recorded decoction uses 2 cups of sprouts boiled in 2 glasses of water until half remains, then strained.",
    dosage: "Recorded guidance uses 1 cup of leaves twice daily, or ⅓ of the prepared decoction 3 times daily, 30 minutes before meals, only when advised by a health professional.",
    regionFound: "Distributed throughout the Philippines.",
    warnings: "Diabetes requires diagnosis and monitoring by a health professional. Do not replace or change prescribed diabetes treatment without medical advice.",
    imageUrl: "/images/herbs/ampalaya.jpg",
    imageCreator: "Greg III Espera",
    imageSourceUrl: "https://www.inaturalist.org/observations/106965525",
    imageLicense: "CC BY 4.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    imageModification: "No source-file edits; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Bawang",
    cebuanoName: "Ahos",
    scientificName: "Allium sativum",
    sourceScientificName: "Allium sativum",
    category: "Cardiovascular",
    medicinalUses: "Clinical studies have evaluated garlic for hyperlipidemia, hypertension, and arteriosclerosis.",
    preparationMethod: "Consult a health center for diagnosis and advice. A health professional may recommend garlic soaked in vinegar, sterilized, grilled, or fried in a little oil and taken with meals.",
    dosage: "Recorded guidance states that a health professional may advise 2–3 garlic bulbs with breakfast, lunch, and dinner.",
    regionFound: "Extensively grown in Batanes, Batangas, Nueva Ecija, Ilocos Norte, Mindoro, and Cotabato.",
    warnings: "Reported side effects include vomiting, heartburn, diarrhea, allergies, contact dermatitis, or asthma. Dog and snake bites require immediate wound washing and urgent medical care, not garlic treatment.",
    imageUrl: "/images/herbs/bawang.jpg",
    imageCreator: "Jeremy Keith",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Garlic_bulb.jpg",
    imageLicense: "CC BY 2.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    imageModification: "Wikimedia 1280px derivative; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Bayabas",
    cebuanoName: "Bayabas",
    scientificName: "Psidium guajava",
    sourceScientificName: "Psidium guajava",
    category: "Antiseptic / Oral Health",
    medicinalUses: "Clinical evidence includes gingivitis and acute diarrhea. Traditional use includes a topical wash for wounds or scabies and a gargle for swollen gums.",
    preparationMethod: "For wounds or scabies, boil 1–2 handfuls of leafy tops in a small pot of water, cool to lukewarm, and use as a wash. For swollen gums, boil 1 handful, cool, and use as a gargle.",
    dosage: "Recorded guidance uses the lukewarm wash or gargle twice daily while symptoms improve.",
    regionFound: "Distributed throughout the Philippines.",
    warnings: "Consult a health professional if symptoms persist or if fever, spreading redness, or other signs of infection occur. Never apply hot liquid to skin or gums.",
    imageUrl: "/images/herbs/bayabas.jpg",
    imageCreator: "Greg III Espera",
    imageSourceUrl: "https://www.inaturalist.org/observations/68443241",
    imageLicense: "CC BY 4.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    imageModification: "No source-file edits; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Yerba Buena",
    cebuanoName: "Hilbas / Herba Buena",
    scientificName: "Mentha × villosa",
    sourceScientificName: "Mentha cordifolia",
    category: "Analgesic / Pain Relief",
    medicinalUses: "Clinical evidence in the Philippine setting supports analgesic use. Recorded traditional applications include toothache relief and topical use for headache.",
    preparationMethod: "For toothache, boil ground fresh leaves in 2 glasses of water until half remains, cool, strain, and divide into 2 portions. For headache, fresh leaves are traditionally crushed and the extract massaged onto the forehead and top of the head.",
    dosage: "Recorded leaf amounts are 3 tablespoons for ages 7–12 and 6 tablespoons for ages 13 and above. Take 1 portion, with the second portion after 3–4 hours only if pain persists.",
    regionFound: "Distributed throughout the Philippines.",
    warnings: "Persistent toothache or headache requires assessment at a health center. Safety information for pregnancy, medicines, and younger children is not provided in the cited directory guidance.",
    imageUrl: "/images/herbs/yerba-buena.png",
    imageCreator: "N. L. Britton and A. Brown",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Mentha_%C3%97_villosa_drawing_1.png",
    imageLicense: "Public domain",
    imageLicenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
    imageModification: "Wikimedia 1280px derivative; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Tsaang Gubat",
    cebuanoName: "Kagidkid / Putputai",
    scientificName: "Ehretia microphylla",
    sourceScientificName: "Carmona retusa",
    category: "Gastrointestinal",
    medicinalUses: "Clinical evidence in the Philippine setting includes caries-preventive and antispasmodic activity. Traditional preparation guidance addresses stomach pain.",
    preparationMethod: "Boil chopped fresh Tsaang Gubat leaves in 1 glass of water until half remains, keeping the pot uncovered once boiling. Cool and strain.",
    dosage: "Recorded leaf amounts are 1½ tablespoons for ages 7–12 and 3 tablespoons for ages 13 and above. This preparation is not recommended for children below 7.",
    regionFound: "Distributed throughout the Philippines.",
    warnings: "Consult a health professional if stomach pain persists or is severe, or if other concerning symptoms occur.",
    imageUrl: "/images/herbs/tsaang-gubat.jpg",
    imageCreator: "Greg III Espera",
    imageSourceUrl: "https://www.inaturalist.org/observations/73912989",
    imageLicense: "CC BY 4.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    imageModification: "No source-file edits; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Akapulko",
    cebuanoName: "Katanda / Palochina",
    scientificName: "Senna alata",
    sourceScientificName: "Senna alata",
    category: "Antifungal / Dermatological",
    medicinalUses: "Clinical evidence supports antifungal and antiscabies activity, including topical use for ringworm and other fungal skin infections.",
    preparationMethod: "Grind enough fresh Akapulko leaves to obtain extract and apply it to the affected skin. A cooled leaf decoction is a recorded alternative wash if the fresh extract causes irritation.",
    dosage: "Recorded guidance applies the extract or cooled wash to the affected area twice daily for up to 3 weeks.",
    regionFound: "Distributed throughout the Philippines.",
    warnings: "For external use. Stop use if an allergic or severe skin reaction occurs, and seek professional advice if the condition persists, spreads, or is uncertain.",
    imageUrl: "/images/herbs/akapulko.jpg",
    imageCreator: "Matej Otruba",
    imageSourceUrl: "https://www.inaturalist.org/observations/333323524",
    imageLicense: "CC0 1.0",
    imageLicenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    imageModification: "No source-file edits; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Niyog-niyogan",
    cebuanoName: "Balitadham / Tartaraok",
    scientificName: "Combretum indicum",
    sourceScientificName: "Quisqualis indica",
    category: "Anti-helminthic",
    medicinalUses: "Clinical evidence supports anthelmintic activity, with recorded seed-use guidance for intestinal worms.",
    preparationMethod: "Take seeds from the plant's withered fruit, chew them thoroughly, and follow with one-half to 1 glass of water.",
    dosage: "Recorded seed counts are 4–5 seeds for ages 4–6, 6–7 seeds for ages 7–12, and 8–10 seeds for ages 13 and above. The same amount may be repeated after 1 week if no worms pass.",
    regionFound: "Widely distributed throughout the Philippines.",
    warnings: "Do not exceed the listed seed count. Overconsumption may cause nausea, hiccups, stomach pain, or diarrhea. Consult a health professional for diagnosis and treatment of suspected intestinal worms.",
    imageUrl: "/images/herbs/niyog-niyogan.jpg",
    imageCreator: "Greg III Espera",
    imageSourceUrl: "https://www.inaturalist.org/observations/11377445",
    imageLicense: "CC BY 4.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    imageModification: "No source-file edits; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Ulasimang Bato",
    cebuanoName: "Sinaw-sinaw / Pansit-pansitan",
    scientificName: "Peperomia pellucida",
    sourceScientificName: "Peperomia pellucida",
    category: "Metabolic / Uric Acid",
    medicinalUses: "Clinical evidence includes anti-gout use, while antihyperuricemic activity remains supported by preclinical evidence.",
    preparationMethod: "The leafy tops may be eaten as salad. A recorded decoction boils 1½ glasses (3 cups) of the plant in 2 glasses of water until half remains, then strains it.",
    dosage: "When advised by a health professional, recorded guidance uses 1 cup of leafy tops 3 times daily, or ⅓ glass of the prepared decoction 3 times daily after meals.",
    regionFound: "Distributed throughout the Philippines.",
    warnings: "Consult a health professional for diagnosis and treatment of gout or elevated uric acid. Do not replace prescribed treatment with this preparation without medical advice.",
    imageUrl: "/images/herbs/ulasimang-bato.jpg",
    imageCreator: "Beah Vega",
    imageSourceUrl: "https://www.inaturalist.org/observations/75729243",
    imageLicense: "CC BY 4.0",
    imageLicenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    imageModification: "No source-file edits; responsively cropped by the interface.",
    isDohApproved: true,
    isVerified: true,
  },
];

async function generateVector(text: string): Promise<string | null> {
  try {
    const embedding = await generateEmbedding(text);
    return `[${embedding.join(",")}]`;
  } catch (err) {
    console.warn("Could not generate vector embedding for seed herb:", err);
    return null;
  }
}

async function main() {
  console.log("🌱 Starting Herbal AI database seeding...");

  // 1. Ensure the configured administrator exists. Never ship a fixed password.
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@herbalai.ph";
  const adminPlainPassword = process.env.ADMIN_PASSWORD;
  if (!adminPlainPassword || adminPlainPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must be set to at least 12 characters before running the seed command.");
  }
  const adminPassword = await bcrypt.hash(adminPlainPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "admin", isBanned: false, password: adminPassword, emailVerified: new Date() },
    create: {
      username: "admin_herbalai",
      email: adminEmail,
      name: "Herbal AI Administrator",
      password: adminPassword,
      role: "admin",
      emailVerified: new Date(),
    },
  });
  console.log(`👤 Admin account seeded: ${admin.email} (role: ${admin.role})`);

  // 2. Seed the 10 DOH Scientifically Validated Philippine Herbs
  for (const herbData of DOH_HERBS) {
    const textToEmbed = `${herbData.localName} ${herbData.scientificName} ${herbData.category} ${herbData.medicinalUses} ${herbData.preparationMethod} ${herbData.dosage} ${herbData.warnings}`;
    const embedding = await generateVector(textToEmbed);

    const existing = await prisma.herb.findFirst({
      where: {
        provenance: { in: ["BUILT_IN", "LEGACY_IMPORT"] },
        scientificName: { equals: herbData.scientificName, mode: "insensitive" },
      },
    });

    const governedData = {
      localName: herbData.localName,
      cebuanoName: herbData.cebuanoName,
      scientificName: herbData.scientificName,
      sourceScientificName: herbData.sourceScientificName,
      category: herbData.category,
      medicinalUses: herbData.medicinalUses,
      preparationMethod: herbData.preparationMethod,
      dosage: herbData.dosage,
      regionFound: herbData.regionFound,
      warnings: herbData.warnings,
      imageUrl: herbData.imageUrl,
      imageCreator: herbData.imageCreator,
      imageSourceUrl: herbData.imageSourceUrl,
      imageLicense: herbData.imageLicense,
      imageLicenseUrl: herbData.imageLicenseUrl,
      imageModification: herbData.imageModification,
      isDohApproved: true,
      isVerified: true,
      publicationStatus: "PUBLISHED" as const,
      evidenceClass: "DOH_PITAHC_LISTED" as const,
      provenance: "BUILT_IN" as const,
      reviewedAt: new Date(),
    };

    const seededHerb = existing
      ? await prisma.herb.update({ where: { id: existing.id }, data: governedData })
      : await prisma.herb.create({ data: governedData });

    if (embedding) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Herb" SET embedding = $1::vector WHERE id = $2`,
        embedding,
        seededHerb.id
      );
    }

    await prisma.herbSource.deleteMany({
      where: { herbId: seededHerb.id, title: "PITAHC Directory of Herbs" },
    });
    await prisma.herbSource.create({
      data: {
        herbId: seededHerb.id,
        title: "PITAHC Directory of Herbs",
        publisher: "Philippine Institute of Traditional and Alternative Health Care",
        url: "https://pitahc.gov.ph/herbs-directory/",
        supports: ["identity", "dohListing"],
        accessedAt: new Date(),
      },
    });

    console.log(`🌿 ${existing ? "Updated" : "Inserted"} governed herb: ${herbData.localName} (${herbData.scientificName})`);
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
