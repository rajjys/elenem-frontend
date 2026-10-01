/**
 * Retakes the landing's captures of the demo league (PHASE5A_PRODUCT_SITE §6.5): the day panel of
 * the organiser's calendar, and the league site's standings in a phone. Both are written to
 * public/landing/ as WebP at the widths the page's srcset names.
 *
 * Read-only: it signs in as the demo account, opens a month and a day, and saves nothing.
 *
 *   npm i --no-save playwright-core@1.49.1     # only this script needs it; not a dependency
 *   DEMO_LEAGUE_EMAIL=… DEMO_LEAGUE_PASSWORD=… CHROMIUM=/path/to/chromium \
 *     node scripts/capture-landing.mjs [YYYY-MM-DD]
 *
 * The day defaults to 2026-09-30: three games in two halls, two of them back to back in one. Pick
 * another with the same shape if the demo's schedule changes. Times are shown in Kinshasa time,
 * the demo league's, so they match the league site.
 *
 * The other captures are not taken here: the hero's two screens and the WhatsApp previews came
 * from the owner's own devices.
 */
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const APP = 'https://dxscores.com';
const SITE = 'https://demo.dxscores.app';
const OUT = new URL('../public/landing/', import.meta.url).pathname;
const DAY = process.argv[2] ?? '2026-09-30';

const { DEMO_LEAGUE_EMAIL: email, DEMO_LEAGUE_PASSWORD: password, CHROMIUM: executablePath } = process.env;
if (!email || !password) throw new Error('DEMO_LEAGUE_EMAIL and DEMO_LEAGUE_PASSWORD are required.');

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTH_HEADING = new RegExp(`^(${MONTHS.join('|')}) \\d{4}$`, 'i');
const context = { locale: 'fr-FR', timezoneId: 'Africa/Kinshasa', colorScheme: 'light' };

/** One PNG, resized to each width and written as WebP. */
async function save(png, name, widths) {
  for (const w of widths) {
    const file = `${OUT}${name}-${w}.webp`;
    const { size } = await sharp(png).resize({ width: w }).webp({ quality: 86, effort: 6 }).toFile(file);
    console.log(`  ${file.split('/public/')[1]}  ${Math.round(size / 1024)} KB`);
  }
}

const browser = await chromium.launch({ executablePath });
try {
  // ---- The day panel: desktop, at twice the pixels, so it stays sharp on a phone's screen ----
  const desk = await browser.newContext({ ...context, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await desk.newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.locator('input:not([type=password])').first().fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60_000 });

  await page.goto(`${APP}/tenant/calendar`, { waitUntil: 'networkidle' });
  const [year, month, date] = DAY.split('-').map(Number);
  const wanted = `${MONTHS[month - 1]} ${year}`;
  for (let i = 0; i < 24; i++) {
    const shown = (await page.getByText(MONTH_HEADING).first().innerText()).toLowerCase();
    if (shown === wanted) break;
    const [m, y] = shown.split(' ');
    const before = Number(y) * 12 + MONTHS.indexOf(m) > year * 12 + month - 1;
    await page.getByLabel(before ? 'Mois précédent' : 'Mois suivant').click();
    await page.waitForLoadState('networkidle');
  }
  // In its own month, a day's number appears once among the cells.
  await page.locator('main button', { hasText: new RegExp(`^${date}$`) }).first().click();
  const panel = page.locator('aside[role=dialog]');
  await panel.getByRole('button', { name: 'Ajouter un match' }).waitFor();
  const box = await panel.boundingBox();
  const add = await panel.getByRole('button', { name: 'Ajouter un match' }).boundingBox();
  // From the panel's top to just under its last button; one pixel in, past its left border.
  const dayPanel = await page.screenshot({
    clip: { x: box.x + 1, y: box.y, width: box.width - 1, height: add.y + add.height + 14 - box.y },
  });
  console.log(`Day panel, ${DAY}`);
  await save(dayPanel, 'day-panel', [702, 351]);
  await desk.close();

  // ---- The league site's standings, as a phone shows it: the page, its rules, the tab bar ----
  const phone = await browser.newContext({
    ...context,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const site = await phone.newPage();
  await site.goto(`${SITE}/standings`, { waitUntil: 'networkidle' });
  console.log('Standings on a phone');
  await save(await site.screenshot(), 'standings-phone', [780, 420]);
  await phone.close();
} finally {
  await browser.close();
}
