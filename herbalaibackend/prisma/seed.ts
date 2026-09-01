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
    category: "Respiratory",
    medicinalUses: "Scientifically validated by DOH for the relief of cough, flu, fever, colds, bronchial asthma, and pharyngitis.",
    preparationMethod: "1. Wash fresh mature leaves thoroughly.\n2. Boil 4 tablespoons of chopped dried leaves (or 6 tablespoons of fresh leaves) in 2 glasses of water for 15 minutes in a low flame with the pot uncovered.\n3. Let it cool and strain the decoction.",
    dosage: "Adults: 1/2 glass 3 times daily after meals. Children (7-12 yrs): 1/4 glass 3 times daily.",
    regionFound: "Widespread throughout the Philippines in open thickets, backyards, and low altitudes.",
    warnings: "Do not exceed recommended dosage. Not recommended for infants under 1 year. Consult a physician if cough persists over 7 days.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555318/herbal_ai_herbs/lagundi_doh.jpg",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Sambong",
    cebuanoName: "Alibhon / Gabuen",
    scientificName: "Blumea balsamifera",
    category: "Renal / Diuretic",
    medicinalUses: "Diuretic for edema and water retention; clinically proven to assist in dissolving and expelling small kidney stones (anti-urolithiasis).",
    preparationMethod: "1. Wash fresh or dried leaves.\n2. Boil 4 tablespoons of dried leaves (or 6 tablespoons fresh) in 2 glasses of water for 15 minutes with pot uncovered.\n3. Cool and strain.",
    dosage: "Adults: 1 glass 3 times a day. Maintain high daily water intake.",
    regionFound: "Abundant in grasslands, open fields, and mountain clearings across all Philippine islands.",
    warnings: "Not a replacement for surgical intervention in severe or obstructing kidney stones. Consult a doctor if severe back pain or hematuria occurs.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555319/herbal_ai_herbs/sambong_doh.jpg",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Ampalaya",
    cebuanoName: "Paliya",
    scientificName: "Momordica charantia",
    category: "Metabolic / Endocrine",
    medicinalUses: "Supplemental management of Non-Insulin Dependent Diabetes Mellitus (NIDDM) by lowering fasting and post-prandial blood glucose.",
    preparationMethod: "1. Gather fresh young leaves and tops.\n2. Steam 1/2 cup lightly to eat as salad, or boil 1 cup chopped fresh leaves in 2 glasses of water for 15 minutes.\n3. Strain and drink.",
    dosage: "Adults: 1/3 glass of decoction 3 times daily 30 minutes before meals, or 1/2 cup steamed leaves with meals.",
    regionFound: "Cultivated throughout the Philippines in gardens and agricultural lands.",
    warnings: "Do not discontinue prescribed insulin or oral hypoglycemics without medical consultation. Monitor blood glucose to prevent hypoglycemia.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555496/herbal_ai_herbs/ampalaya_doh.jpg",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Bawang",
    cebuanoName: "Ahos",
    scientificName: "Allium sativum",
    category: "Cardiovascular",
    medicinalUses: "Helps lower serum cholesterol (LDL) and triglycerides; supports management of mild hypertension.",
    preparationMethod: "1. Peel 2 cloves of fresh garlic.\n2. Crush or mince and allow to stand for 5 minutes to maximize active allicin release.\n3. Ingest raw with meals or lightly sauteed.",
    dosage: "Adults: 2 cloves twice daily after meals.",
    regionFound: "Cultivated widely in Ilocos, Batangas, and markets across the Philippines.",
    warnings: "Avoid consuming on an empty stomach to prevent gastrointestinal upset. Caution advised for patients taking anticoagulant/blood-thinning drugs.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555497/herbal_ai_herbs/bawang_doh.jpg",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Bayabas",
    cebuanoName: "Bayabas",
    scientificName: "Psidium guajava",
    category: "Antiseptic / Oral Health",
    medicinalUses: "Topical astringent and antiseptic wash for wounds, skin ulcers, and circumcision; effective mouth gargle for toothache and bleeding gums.",
    preparationMethod: "1. Wash 8-10 fresh mature leaves.\n2. Boil in 2 glasses of water for 15 minutes.\n3. Let cool to lukewarm and strain.",
    dosage: "Topical: Wash clean wounds 2 times daily. Oral: Gargle warm decoction 3 times daily after brushing.",
    regionFound: "Found everywhere in the Philippines in lowland and medium-altitude areas.",
    warnings: "For topical washing and oral gargling only. Do not apply scalding hot liquid to fresh wounds.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555141/herbal_ai_herbs/bayabas_doh.jpg",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Yerba Buena",
    cebuanoName: "Hilbas / Herba Buena",
    scientificName: "Clinopodium douglasii",
    category: "Analgesic / Pain Relief",
    medicinalUses: "Natural analgesic for headache, toothache, muscle aches, dysmenorrhea, and arthritic joint pain.",
    preparationMethod: "1. Wash fresh leaves.\n2. Boil 4 tablespoons of dried leaves (or 6 tablespoons fresh) in 2 glasses of water for 15 minutes.\n3. Strain and drink lukewarm.",
    dosage: "Adults: 1/2 glass every 3-4 hours as needed for pain. Crushed fresh leaf can also be placed on aching tooth.",
    regionFound: "Cultivated nationwide in highland home gardens and pots.",
    warnings: "Discontinue if allergic skin rash develops. Persistent severe pain requires immediate physician evaluation.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555499/herbal_ai_herbs/yerba_buena_doh.jpg",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Tsaang Gubat",
    cebuanoName: "Kagidkid / Putputai",
    scientificName: "Carmona retusa",
    category: "Gastrointestinal",
    medicinalUses: "Relief of abdominal cramps, stomachache, mild diarrhea, and indigestion.",
    preparationMethod: "1. Wash fresh leaves.\n2. Boil 2 tablespoons of dried chopped leaves in 2 glasses of water for 15 minutes.\n3. Cool and strain.",
    dosage: "Adults: 1 glass every 4 hours for stomach discomfort. Children (7-12 yrs): 1/2 glass.",
    regionFound: "Common in secondary forests, thickets, and limestone regions across Luzon, Visayas, and Mindanao.",
    warnings: "If diarrhea persists over 24 hours or is accompanied by high fever/blood, seek immediate medical attention.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555500/herbal_ai_herbs/tsaang_gubat_doh.jpg",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Akapulko",
    cebuanoName: "Katanda / Palochina",
    scientificName: "Senna alata",
    category: "Antifungal / Dermatological",
    medicinalUses: "Proven antifungal treatment for ringworm (buni), athlete's foot (alipunga), tinea versicolor (an-an), and scabies.",
    preparationMethod: "1. Wash fresh young leaves.\n2. Crush or pound leaves thoroughly to extract the fresh botanical sap.\n3. Apply directly onto affected clean skin.",
    dosage: "Apply topically twice daily for 2 to 3 weeks until fungal infection is completely resolved.",
    regionFound: "Grows abundantly throughout the Philippines in open areas, riverbanks, and roadsides.",
    warnings: "Strictly for external topical application. Avoid eye contact. Discontinue if severe contact dermatitis occurs.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555501/herbal_ai_herbs/akapulko_doh.jpg",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Niyog-niyogan",
    cebuanoName: "Balitadham / Tartaraok",
    scientificName: "Combretum indicum",
    category: "Anti-helminthic",
    medicinalUses: "Traditional deworming agent for expelling intestinal roundworms (Ascaris lumbricoides).",
    preparationMethod: "1. Harvest mature, dried seeds from dried fruit pods.\n2. Crack open the shell to extract dried kernel seeds.\n3. Chew seeds thoroughly 2 hours after evening meal.",
    dosage: "Adults: 8-10 seeds. Children 9-12 yrs: 6-7 seeds. Children 7-8 yrs: 5-6 seeds. Children 4-6 yrs: 4-5 seeds. Single dose only.",
    regionFound: "Found cultivated in home gardens and growing wild in low-altitude thickets.",
    warnings: "Strictly adhere to age dosages. Overdosing induces severe hiccups, dizziness, and diarrhea. Forbidden for children under 4 years.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555501/herbal_ai_herbs/niyogniogan_doh.jpg",
    isDohApproved: true,
    isVerified: true,
  },
  {
    localName: "Ulasimang Bato",
    cebuanoName: "Sinaw-sinaw / Pansit-pansitan",
    scientificName: "Peperomia pellucida",
    category: "Metabolic / Uric Acid",
    medicinalUses: "Clinically proven to reduce serum uric acid levels; therapeutic in relieving pain and swelling of gout and arthritis.",
    preparationMethod: "1. Wash 1 1/2 cups of fresh clean leaves and tender stems.\n2. Boil in 2 glasses of water for 15 minutes with pot uncovered.\n3. Strain and divide into 3 portions, or eat 1 cup fresh as raw vegetable salad.",
    dosage: "Adults: Drink 1/3 of the decoction 3 times daily after meals, or 1 cup fresh salad daily.",
    regionFound: "Grows in damp, shaded yards, brick walls, and lowlands throughout the country.",
    warnings: "Maintain good hydration. Consult your physician during acute inflammatory gout crises.",
    imageUrl: "https://res.cloudinary.com/dclqw6at7/image/upload/v1787555502/herbal_ai_herbs/ulasimang_bato_doh.jpg",
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
      bio: "Official System Administrator of Herbal AI Repository.",
    },
  });
  console.log(`👤 Admin account seeded: ${admin.email} (role: ${admin.role})`);

  // 2. Seed the 10 DOH Scientifically Validated Philippine Herbs
  for (const herbData of DOH_HERBS) {
    const textToEmbed = `${herbData.localName} ${herbData.scientificName} ${herbData.category} ${herbData.medicinalUses} ${herbData.preparationMethod} ${herbData.dosage} ${herbData.warnings}`;
    const embedding = await generateVector(textToEmbed);

    const existing = await prisma.herb.findFirst({
      where: {
        OR: [
          { localName: { equals: herbData.localName, mode: "insensitive" } },
          { scientificName: { equals: herbData.scientificName, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      if (embedding) {
        await prisma.$executeRawUnsafe(
          `UPDATE "Herb" SET 
            "cebuanoName" = $1, 
            category = $2, 
            "medicinalUses" = $3, 
            "preparationMethod" = $4, 
            dosage = $5, 
            "regionFound" = $6, 
            warnings = $7, 
            "imageUrl" = $8, 
            "isDohApproved" = true,
            "isVerified" = true,
            embedding = $9::vector,
            "updatedAt" = NOW()
           WHERE id = $10`,
          herbData.cebuanoName,
          herbData.category,
          herbData.medicinalUses,
          herbData.preparationMethod,
          herbData.dosage,
          herbData.regionFound,
          herbData.warnings,
          herbData.imageUrl,
          embedding,
          existing.id
        );
      } else {
        await prisma.herb.update({
          where: { id: existing.id },
          data: {
            cebuanoName: herbData.cebuanoName,
            category: herbData.category,
            medicinalUses: herbData.medicinalUses,
            preparationMethod: herbData.preparationMethod,
            dosage: herbData.dosage,
            regionFound: herbData.regionFound,
            warnings: herbData.warnings,
            imageUrl: herbData.imageUrl,
            isDohApproved: true,
            isVerified: true,
          },
        });
      }
      console.log(`🌿 Updated DOH herb: ${herbData.localName} (${herbData.scientificName})`);
    } else {
      if (embedding) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "Herb" (id, "localName", "cebuanoName", "scientificName", category, "medicinalUses", "preparationMethod", dosage, "regionFound", warnings, "imageUrl", "isDohApproved", "isVerified", embedding, "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, true, $11::vector, NOW(), NOW())`,
          herbData.localName,
          herbData.cebuanoName,
          herbData.scientificName,
          herbData.category,
          herbData.medicinalUses,
          herbData.preparationMethod,
          herbData.dosage,
          herbData.regionFound,
          herbData.warnings,
          herbData.imageUrl,
          embedding
        );
      } else {
        await prisma.herb.create({
          data: {
            localName: herbData.localName,
            cebuanoName: herbData.cebuanoName,
            scientificName: herbData.scientificName,
            category: herbData.category,
            medicinalUses: herbData.medicinalUses,
            preparationMethod: herbData.preparationMethod,
            dosage: herbData.dosage,
            regionFound: herbData.regionFound,
            warnings: herbData.warnings,
            imageUrl: herbData.imageUrl,
            isDohApproved: true,
            isVerified: true,
          },
        });
      }
      console.log(`🌿 Inserted DOH herb: ${herbData.localName} (${herbData.scientificName})`);
    }
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
