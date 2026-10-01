/**
 * Retakes the landing's capture of the league site's standings in a phone (PHASE5A_PRODUCT_SITE
 * §6.5, the Points module), from the demo league on production. Written to public/landing/ as WebP
 * at the widths the page's srcset names.
 *
 * Read-only, and public: it opens one page of demo.dxscores.app, signed in as nobody.
 *
 *   npm i --no-save playwright-core@1.49.1     # only this script needs it; not a dependency
 *   CHROMIUM=/path/to/chromium node scripts/capture-landing.mjs
 *
 * The other captures are not taken here. The hero's two screens, the « Ajouter un match » dialog
 * and the WhatsApp previews came from the owner's devices.
 */
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const SITE = 'https://demo.dxscores.app';
const OUT = new URL('../public/landing/', import.meta.url).pathname;

/** One PNG, resized to each width and written as WebP. */
async function save(png, name, widths) {
  for (const w of widths) {
    const file = `${OUT}${name}-${w}.webp`;
    const { size } = await sharp(png).resize({ width: w }).webp({ quality: 86, effort: 6 }).toFile(file);
    console.log(`  ${file.split('/public/')[1]}  ${Math.round(size / 1024)} KB`);
  }
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM });
try {
  // As a phone shows it, at twice the pixels: the page, its rules under the table, the tab bar.
  const phone = await browser.newContext({
    locale: 'fr-FR',
    timezoneId: 'Africa/Kinshasa',
    colorScheme: 'light',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await phone.newPage();
  await page.goto(`${SITE}/standings`, { waitUntil: 'networkidle' });
  console.log('Standings on a phone');
  await save(await page.screenshot(), 'standings-phone', [780, 420]);
} finally {
  await browser.close();
}
