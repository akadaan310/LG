/**
 * Acceptance smoke test for the Design Atelier (optional; needs Playwright + Chromium).
 *   BASE_URL=http://localhost:3000 node apps/atelier/scripts/smoke.mjs
 * Checks: three concepts visible, hybrid selection (hero A / typography B / dashboard C),
 * persistence across reload, JSON export → reset → import round-trip, presentation keyboard nav.
 */
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = createRequire('/opt/node22/lib/node_modules/')('playwright'); }
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ok = (c, m) => { if (!c) { console.error('✗ ' + m); process.exitCode = 1; } else console.log('✓ ' + m); };

const browser = await playwright.chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(BASE + '/', { waitUntil: 'networkidle' });
ok((await page.locator('.at-concept').count()) === 3, 'three concepts on the board');

await page.locator('.at-concept').nth(0).getByRole('button', { name: 'Love' }).click();
await page.getByRole('button', { name: /Make this my favourite overall/ }).nth(1).click();
await page.getByRole('button', { name: /^Homepage opening from A/ }).click();
await page.getByRole('button', { name: /^Lettering \(type\) from B/ }).click();
await page.getByRole('button', { name: /^Member home \(Today\) from C/ }).click();
const summary = await page.locator('.at-summary').innerText();
ok(/Homepage opening: A/.test(summary) && /Lettering \(type\): B/.test(summary) && /Member home \(Today\): C/.test(summary), 'hybrid summary shows hero A, type B, dashboard C');
ok(/Favourite overall — B/.test(summary), 'favourite overall recorded');

await page.reload({ waitUntil: 'networkidle' });
const after = await page.locator('.at-summary').innerText();
ok(/Lettering \(type\): B/.test(after), 'selections survive reload');

await page.goto(BASE + '/review/', { waitUntil: 'networkidle' });
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download design-decisions.json' }).click()]);
const file = path.join(os.tmpdir(), 'adequate-design-decisions.json');
await dl.saveAs(file);
const json = JSON.parse(fs.readFileSync(file, 'utf8'));
ok(json.state?.decisions?.length >= 5 && json.summary.hybridSelections['slot.typography'] === 'resonance-atlas', 'export is valid JSON with decisions');
ok(json.state.decisions.every((d) => d.id && d.timestamp && d.author && d.status && 'conceptId' in d && 'variantId' in d && 'comment' in d), 'every decision has id, timestamp, author, status, concept, variant, comment');

page.once('dialog', (d) => d.accept());
await page.getByRole('button', { name: /Start over/ }).click();
await page.waitForTimeout(300);
ok((await page.evaluate(() => JSON.parse(localStorage.getItem('adequate.atelier.review.v1')).decisions.length)) === 0, 'reset clears local state');
await page.locator('input[type=file]').setInputFiles(file);
await page.waitForTimeout(500);
ok((await page.evaluate(() => JSON.parse(localStorage.getItem('adequate.atelier.review.v1')).decisions.length)) === json.state.decisions.length, 'import restores every decision');

await page.goto(BASE + '/present/', { waitUntil: 'networkidle' });
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(200);
ok(/Step 2 of/.test(await page.locator('.at-present-top').innerText()), 'presentation responds to arrow keys');

for (const r of ['/concept/golden-human/', '/concept/resonance-atlas/', '/concept/living-manifesto/', '/compare/', '/voice/', '/preview/?c=living-manifesto&s=member.today']) {
  await page.goto(BASE + r, { waitUntil: 'networkidle' });
}
ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`);
await browser.close();
