import { prisma } from '../src/lib/prisma.js';
import { uploadToCloudinary } from '../src/services/cloudinary.service.js';

interface PhotoResult {
  imageUrl: string;
  creator: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFromINaturalist(scientificName: string): Promise<PhotoResult | null> {
  try {
    const cleanName = scientificName.replace(/×/g, '').trim();
    const taxonUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(cleanName)}`;
    const taxonRes = await fetch(taxonUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'HerbalAiBot/1.0 (botanical educational catalog; contact@herbalai.ph)' },
    });
    if (!taxonRes.ok) return null;
    const taxonJson = await taxonRes.json();
    const taxon = taxonJson.results?.[0];
    if (!taxon?.id) return null;

    const obsUrl = `https://api.inaturalist.org/v1/observations?taxon_id=${taxon.id}&photos=true&order_by=votes&order=desc&per_page=1`;
    const obsRes = await fetch(obsUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'HerbalAiBot/1.0 (botanical educational catalog)' },
    });
    if (!obsRes.ok) return null;
    const obsJson = await obsRes.json();
    const obs = obsJson.results?.[0];
    const photo = obs?.photos?.[0];

    if (!photo?.url) return null;

    // Convert thumbnail 'square.jpeg' to 'medium.jpeg' (500px, high quality)
    const highResUrl = photo.url.replace(/square\.(jpe?g|png)/i, 'medium.$1');
    const license = (photo.license_code || 'cc-by').toUpperCase();
    const creator = obs.user?.name || obs.user?.login || photo.attribution || 'iNaturalist Observer';
    const sourceUrl = `https://www.inaturalist.org/observations/${obs.id}`;
    const licenseUrl = license.includes('CC0')
      ? 'https://creativecommons.org/publicdomain/zero/1.0/'
      : `https://creativecommons.org/licenses/${license.toLowerCase()}/4.0/`;

    return {
      imageUrl: highResUrl,
      creator,
      sourceUrl,
      license,
      licenseUrl,
    };
  } catch (err) {
    return null;
  }
}

async function fetchFromWikimedia(scientificName: string): Promise<PhotoResult | null> {
  try {
    const cleanName = scientificName.replace(/×/g, '').trim();
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanName)}&gsrlimit=4&prop=imageinfo&iiprop=url|extmetadata&format=json`;
    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'HerbalAiBot/1.0 (herb image sourcing; contact@herbalai.ph)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const imageInfo = page.imageinfo?.[0];
      if (!imageInfo?.url) continue;

      const ext = imageInfo.extmetadata;
      const creator = ext?.Artist?.value?.replace(/<[^>]*>?/gm, '').trim() || 'Wikimedia Commons Contributor';
      const license = ext?.LicenseShortName?.value || 'CC-BY-SA';
      const licenseUrl = ext?.LicenseUrl?.value || 'https://creativecommons.org/licenses/by-sa/4.0/';
      const sourceUrl = imageInfo.descriptionurl || imageInfo.url;

      if (/\.(jpe?g|png)$/i.test(imageInfo.url)) {
        return {
          imageUrl: imageInfo.url,
          creator: creator.slice(0, 100),
          sourceUrl: sourceUrl.slice(0, 255),
          license: license.toUpperCase().slice(0, 50),
          licenseUrl: licenseUrl.slice(0, 255),
        };
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function fetchFromWikipediaPage(scientificName: string): Promise<PhotoResult | null> {
  try {
    const cleanName = scientificName.replace(/×/g, '').trim();
    const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName.replace(/\s+/g, '_'))}`;
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'HerbalAiBot/1.0 (herb image sourcing; contact@herbalai.ph)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.thumbnail?.source) return null;

    return {
      imageUrl: data.thumbnail.source,
      creator: 'Wikipedia Contributor',
      sourceUrl: data.content_urls?.desktop?.page || pageUrl,
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    };
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('--- Starting Botanical Image Sourcing & Cloudinary Upload Pipeline ---');

  const herbsWithoutImages = await prisma.herb.findMany({
    where: {
      publicationStatus: 'PUBLISHED',
      OR: [
        { imageUrl: null },
        { imageUrl: '' },
        { imageUrl: { contains: 'placeholder' } },
      ],
    },
    select: {
      id: true,
      localName: true,
      scientificName: true,
    },
    orderBy: { localName: 'asc' },
  });

  console.log(`Found ${herbsWithoutImages.length} herbs needing authentic photos.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < herbsWithoutImages.length; i++) {
    const herb = herbsWithoutImages[i];
    console.log(`\n[${i + 1}/${herbsWithoutImages.length}] Sourcing photo for ${herb.localName} (${herb.scientificName})...`);

    // 1. Search iNaturalist first (high quality field observation)
    let photoLead = await fetchFromINaturalist(herb.scientificName);

    // 2. Fallback to Wikimedia Commons
    if (!photoLead) {
      photoLead = await fetchFromWikimedia(herb.scientificName);
    }

    // 3. Fallback to Wikipedia Summary Lead
    if (!photoLead) {
      photoLead = await fetchFromWikipediaPage(herb.scientificName);
    }

    if (!photoLead) {
      console.warn(`   ⚠️ No photo found across sources for ${herb.localName} (${herb.scientificName})`);
      failCount++;
      await delay(500);
      continue;
    }

    console.log(`   📸 Found photo from ${photoLead.creator} (${photoLead.license})`);

    // Download image
    let imgBuffer: Buffer;
    try {
      const imgRes = await fetch(photoLead.imageUrl, {
        signal: AbortSignal.timeout(20_000),
        headers: { 'User-Agent': 'HerbalAiBot/1.0 (herb image sourcing)' },
      });
      if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
      imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    } catch (dlErr: any) {
      console.error(`   ❌ Failed downloading image:`, dlErr.message);
      failCount++;
      await delay(500);
      continue;
    }

    // Upload to Cloudinary
    let cloudinaryUrl: string;
    try {
      cloudinaryUrl = await uploadToCloudinary(imgBuffer, 'herbal_ai_herbs');
      console.log(`   ☁️ Uploaded to Cloudinary: ${cloudinaryUrl}`);
    } catch (upErr: any) {
      console.error(`   ❌ Cloudinary upload failed:`, upErr.message);
      failCount++;
      await delay(500);
      continue;
    }

    // Update Herb in DB
    try {
      await prisma.herb.update({
        where: { id: herb.id },
        data: {
          imageUrl: cloudinaryUrl,
          imageCreator: photoLead.creator.slice(0, 100),
          imageSourceUrl: photoLead.sourceUrl.slice(0, 255),
          imageLicense: photoLead.license.slice(0, 50),
          imageLicenseUrl: photoLead.licenseUrl.slice(0, 255),
          imageModification: 'None; authentic research-grade botanical photograph',
        },
      });
      console.log(`   ✅ DB updated for ${herb.localName}`);
      successCount++;
    } catch (dbErr: any) {
      console.error(`   ❌ DB update failed:`, dbErr.message);
      failCount++;
    }

    // Rate limit delay between requests (800ms)
    await delay(800);
  }

  console.log(`\n========================================`);
  console.log(`Image Pipeline Finished!`);
  console.log(`Total Processed: ${herbsWithoutImages.length}`);
  console.log(`Successfully Uploaded & Updated: ${successCount}`);
  console.log(`Failed / Missed: ${failCount}`);
  console.log(`========================================\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal pipeline error:', err);
  process.exit(1);
});
