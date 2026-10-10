import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { uploadToCloudinary } from '../src/services/cloudinary.service.js';

interface PhotoResult {
  imageUrl: string;
  creator: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
}

// Delay helper to avoid rate-limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchFromINaturalist(scientificName: string): Promise<PhotoResult | null> {
  try {
    const taxonUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}`;
    const taxonRes = await fetch(taxonUrl, { signal: AbortSignal.timeout(15_000) });
    if (!taxonRes.ok) return null;
    const taxonJson = await taxonRes.json();
    const taxon = taxonJson.results?.[0];
    if (!taxon?.id) return null;

    const obsUrl = `https://api.inaturalist.org/v1/observations?taxon_id=${taxon.id}&quality_grade=research&photos=true&order_by=votes&order=desc&per_page=1`;
    const obsRes = await fetch(obsUrl, { signal: AbortSignal.timeout(15_000) });
    if (!obsRes.ok) return null;
    const obsJson = await obsRes.json();
    const obs = obsJson.results?.[0];
    const photo = obs?.photos?.[0];

    if (!photo?.url) return null;

    // Convert thumbnail 'square.jpeg' to 'medium.jpeg' (often 500px, ideal for herb cards)
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
    console.warn(`iNaturalist fetch failed for ${scientificName}:`, err);
    return null;
  }
}

async function fetchFromWikimedia(scientificName: string): Promise<PhotoResult | null> {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(scientificName)}&gsrlimit=3&prop=imageinfo&iiprop=url|extmetadata&format=json`;
    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { 'User-Agent': 'HerbalAiBot/1.0 (herb image sourcing; contact@herbalai.ph)' }
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

      // Prefer image formats that are jpg/jpeg/png
      if (/\.(jpe?g|png)$/i.test(imageInfo.url)) {
        return {
          imageUrl: imageInfo.url,
          creator,
          sourceUrl,
          license: license.toUpperCase(),
          licenseUrl,
        };
      }
    }
    return null;
  } catch (err) {
    console.warn(`Wikimedia fetch failed for ${scientificName}:`, err);
    return null;
  }
}

async function main() {
  try {
    const herbsWithoutImage = await prisma.herb.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      },
      select: {
        id: true,
        localName: true,
        scientificName: true,
      },
      orderBy: { localName: 'asc' }
    });

    console.log(`Found ${herbsWithoutImage.length} herbs without image.`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < herbsWithoutImage.length; i++) {
      const herb = herbsWithoutImage[i];
      console.log(`\n[${i + 1}/${herbsWithoutImage.length}] Processing ${herb.localName} (${herb.scientificName})...`);

      // 1. Sourcing photo
      let photoLead = await fetchFromINaturalist(herb.scientificName);
      if (!photoLead) {
        console.log(`   Trying Wikimedia Commons fallback for ${herb.scientificName}...`);
        photoLead = await fetchFromWikimedia(herb.scientificName);
      }

      if (!photoLead) {
        console.error(`   ❌ Failed to find image for ${herb.localName} (${herb.scientificName})`);
        failCount++;
        continue;
      }

      console.log(`   Found photo: ${photoLead.imageUrl} by ${photoLead.creator} (${photoLead.license})`);

      // 2. Fetch image buffer
      let imgBuffer: Buffer;
      try {
        const imgRes = await fetch(photoLead.imageUrl, {
          signal: AbortSignal.timeout(20_000),
          headers: { 'User-Agent': 'HerbalAiBot/1.0 (herb image sourcing)' }
        });
        if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
        imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        console.log(`   Fetched image buffer: ${imgBuffer.length} bytes`);
      } catch (dlErr) {
        console.error(`   ❌ Failed to download image from ${photoLead.imageUrl}:`, dlErr);
        failCount++;
        continue;
      }

      // 3. Upload to Cloudinary
      let cloudinaryUrl: string;
      try {
        cloudinaryUrl = await uploadToCloudinary(imgBuffer, 'herbal_ai_herbs');
        console.log(`   ☁️ Uploaded to Cloudinary: ${cloudinaryUrl}`);
      } catch (upErr) {
        console.error(`   ❌ Cloudinary upload failed:`, upErr);
        failCount++;
        continue;
      }

      // 4. Update Herb record in Neon DB
      try {
        await prisma.herb.update({
          where: { id: herb.id },
          data: {
            imageUrl: cloudinaryUrl,
            imageCreator: photoLead.creator.slice(0, 100),
            imageSourceUrl: photoLead.sourceUrl.slice(0, 255),
            imageLicense: photoLead.license.slice(0, 50),
            imageLicenseUrl: photoLead.licenseUrl.slice(0, 255),
            imageModification: 'None; uploaded authentic botanical specimen photo',
          }
        });
        console.log(`   ✅ DB record updated successfully for ${herb.localName}`);
        successCount++;
      } catch (dbErr) {
        console.error(`   ❌ DB update failed:`, dbErr);
        failCount++;
      }

      // Polite pause between iterations
      await delay(800);
    }

    console.log(`\n========================================`);
    console.log(`Completed Image Pipeline!`);
    console.log(`Total processed: ${herbsWithoutImage.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`========================================`);

  } finally {
    await closeDatabasePool();
  }
}

main().catch(console.error);
