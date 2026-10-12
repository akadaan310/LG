import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { parseLocalEnvironment } from '../../scripts/read-local-env.mjs';

// Synthetic, isolated local acceptance accounts only. Never target a remote project.
const credentialFile = process.env.ADEQUATE_LOCAL_CREDENTIALS || '/tmp/adequate-local.env';
const app = process.env.ADEQUATE_TEST_URL || 'http://127.0.0.1:3100';
const allowed = ['127.0.0.1', 'localhost'].includes(new URL(app).hostname) && existsSync(credentialFile);
const credentials = allowed ? parseLocalEnvironment(readFileSync(credentialFile, 'utf8')) : {};
const admin = allowed ? createClient('http://127.0.0.1:54321', credentials.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const password = 'Isolated-web-fixture-42!';
const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

async function fixture(label, role = 'member') {
  const email = `adequate-web-${runId}-${label}@example.test`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  const userId = created.data.user.id;
  if (role !== 'member') execFileSync('docker', ['exec', '-i', process.env.ADEQUATE_DB_CONTAINER || 'adequate_db', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: `update public.user_roles set role='${role}' where user_id='${userId}';`, stdio: ['pipe', 'pipe', 'pipe'] });
  return { email, userId };
}
async function browserPage(width = 1440) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return { browser, page, errors };
}
async function signIn(page, email) {
  await page.goto(`${app}/auth`);
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('[data-approved-screen="member.today@v2"]')).toBeVisible({ timeout: 15000 });
}

test('keyboard ring selection and mobile menu Escape restore focus after hydration', { skip: !allowed, timeout: 45000 }, async () => {
  const { browser, page, errors } = await browserPage(390);
  try {
    await page.goto(`${app}/principle`);
    await page.getByRole('tab', { name: 'Ring 01', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Ring 02', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Site navigation' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Site navigation' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused();
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('real member login, private reflection edit/export/persistence/delete, preferences and account deletion', { skip: !allowed, timeout: 90000 }, async () => {
  const account = await fixture('member');
  const { browser, page, errors } = await browserPage(390);
  const original = `Synthetic private browser reflection ${runId}`;
  const edited = `${original} edited`;
  try {
    await signIn(page, account.email);
    await page.getByLabel('Your private reflection', { exact: true }).fill(original);
    await page.getByRole('button', { name: 'Save reflection', exact: true }).click();
    await expect(page.getByText('Private reflection saved.', { exact: true })).toBeVisible();
    await page.goto(`${app}/reflections`);
    const card = page.locator('.reflection-list .card').filter({ hasText: original });
    await expect(card).toHaveCount(1);
    await card.getByRole('button', { name: 'Edit', exact: true }).click();
    await card.getByLabel('Edit reflection', { exact: true }).fill(edited);
    await card.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.locator('.reflection-list')).toContainText(edited);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export account data', exact: true }).click();
    const exported = await download;
    assert.match(readFileSync(await exported.path(), 'utf8'), new RegExp(runId));
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(`${app}/auth`);
    await signIn(page, account.email);
    await page.goto(`${app}/reflections`);
    await expect(page.locator('.reflection-list')).toContainText(edited);
    await page.goto(`${app}/preferences`);
    await page.getByLabel('Display name', { exact: true }).fill('Synthetic browser member');
    await page.getByRole('button', { name: 'Save profile', exact: true }).click();
    await expect(page.getByText('Profile saved.', { exact: true })).toBeVisible();
    await page.getByLabel('Color appearance', { exact: true }).selectOption('light');
    await page.getByLabel('Enable optional AI assistance', { exact: true }).check();
    await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
    await expect(page.getByText('Preferences saved.', { exact: true })).toBeVisible();
    await page.getByLabel('Optional AI processing of text you choose to send', { exact: true }).check();
    await expect(page.getByText('Consent granted.', { exact: true })).toBeVisible();
    await page.goto(`${app}/reflections`);
    const updated = page.locator('.reflection-list .card').filter({ hasText: edited });
    await updated.getByText('Optional AI assistance', { exact: true }).click();
    await updated.getByLabel('Send this reflection for optional AI structuring', { exact: true }).check();
    await updated.getByRole('button', { name: 'Request AI suggestion', exact: true }).click();
    await expect(updated.locator('.ai-output')).toContainText('Mock AI suggestion');
    await expect(updated).toContainText('Your original work remains unchanged.');
    await updated.getByRole('button', { name: 'Delete', exact: true }).click();
    await updated.getByRole('button', { name: 'Confirm delete', exact: true }).click();
    await expect(page.locator('.reflection-list')).toHaveCount(0);
    await page.goto(`${app}/studio`);
    await expect(page.getByText('Founder or editor access is required.', { exact: false })).toBeVisible();
    await page.goto(`${app}/preferences`);
    await page.getByLabel('Type DELETE to confirm', { exact: true }).fill('DELETE');
    await page.getByRole('button', { name: 'Permanently delete account', exact: true }).click();
    await expect(page).toHaveURL(`${app}/auth`);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('founder draft editing, rights, review, publish/unpublish, version restore and audit through real UI', { skip: !allowed, timeout: 90000 }, async () => {
  const account = await fixture('founder', 'founder');
  const { browser, page, errors } = await browserPage();
  const title = `Synthetic browser publication ${runId}`;
  try {
    await signIn(page, account.email);
    await page.goto(`${app}/studio`);
    await page.getByRole('button', { name: 'Create draft', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('URL slug', { exact: true }).fill(`web-${runId}`);
    await page.getByLabel('Provenance', { exact: true }).selectOption('user_authored');
    await page.getByLabel('Content text', { exact: true }).fill('Synthetic browser acceptance material. Never LG words.');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.getByText('Draft saved. Edits create a new version and require fresh approval.', { exact: true })).toBeVisible();
    await page.getByLabel('I have verified rights for this content', { exact: true }).check();
    await expect(page.getByText('Content rights: Verified', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Approve this version', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Approve this version', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unpublish to draft', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Preview as member', exact: true }).click();
    await expect(page.locator('.member-preview')).toContainText(title);
    await page.getByRole('button', { name: 'Unpublish to draft', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Submit for review', exact: true })).toBeVisible();
    await page.getByLabel('Content text', { exact: true }).fill('Changed synthetic browser acceptance material.');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Restore version 1', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Restore version 1', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm restore', exact: true }).click();
    await expect(page.getByLabel('Content text', { exact: true })).toHaveValue('Synthetic browser acceptance material. Never LG words.');
    await expect(page.locator('.audit-list')).toContainText('content.rollback');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

function silentWav(seconds = 32) {
  const sampleRate = 8000, byteCount = seconds * sampleRate * 2;
  const output = Buffer.alloc(44 + byteCount);
  output.write('RIFF', 0); output.writeUInt32LE(36 + byteCount, 4); output.write('WAVEfmt ', 8);
  output.writeUInt32LE(16, 16); output.writeUInt16LE(1, 20); output.writeUInt16LE(1, 22);
  output.writeUInt32LE(sampleRate, 24); output.writeUInt32LE(sampleRate * 2, 28);
  output.writeUInt16LE(2, 32); output.writeUInt16LE(16, 34); output.write('data', 36); output.writeUInt32LE(byteCount, 40);
  return output;
}

test('real quarantined media upload, founder transcript/rights, signed playback, chapter seek and saved resume', { skip: !allowed, timeout: 120000 }, async () => {
  const account = await fixture('recording-founder', 'founder');
  const { browser, page, errors } = await browserPage();
  const title = `Synthetic silent recording ${runId}`, slug = `silent-${runId}`;
  try {
    await signIn(page, account.email);
    await page.goto(`${app}/studio`);
    await page.getByRole('button', { name: 'Create draft', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('URL slug', { exact: true }).fill(slug);
    await page.getByLabel('Content kind', { exact: true }).selectOption('audio');
    await page.getByLabel('Provenance', { exact: true }).selectOption('user_authored');
    await page.getByLabel('Content text', { exact: true }).fill('Synthetic silent recording for local acceptance. This contains no LG voice or words.');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect(page.getByText('Draft saved. Edits create a new version and require fresh approval.', { exact: true })).toBeVisible();
    await page.getByLabel('Upload authorized audio', { exact: true }).setInputFiles({ name: 'synthetic-silence.wav', mimeType: 'audio/wav', buffer: silentWav() });
    await page.getByLabel('Rights and permission notes', { exact: true }).fill('Generated synthetic silence solely for isolated local acceptance. No founder material.');
    await page.getByRole('button', { name: 'Upload recording', exact: true }).click();
    const recordingSummary = page.locator('.media-editor > summary');
    await expect(recordingSummary).toContainText('rights pending');
    await recordingSummary.click();
    await page.getByLabel('Transcript correction', { exact: true }).fill('Synthetic silent test recording. No spoken content.');
    await page.getByLabel('Rights decision', { exact: true }).selectOption('verified');
    await page.getByLabel('Restrict recording to signed-in members', { exact: true }).uncheck();
    await page.getByLabel('Chapter markers (JSON)', { exact: true }).fill('[{"title":"Synthetic chapter","start_seconds":10}]');
    await page.getByRole('button', { name: 'Save transcript, chapters, and rights', exact: true }).click();
    await expect(recordingSummary).toContainText('rights verified');
    const content = await admin.from('content').select('id').eq('slug', slug).single(); assert.ifError(content.error);
    const asset = await admin.from('media_assets').select('id,scan_status,rights_notes').eq('content_id', content.data.id).single(); assert.ifError(asset.error);
    assert.equal(asset.data.scan_status, 'pending');
    assert.match(asset.data.rights_notes, /Generated synthetic silence/);
    // Service-only operator scanning is modeled here; browser users cannot set scan_status.
    execFileSync('docker', ['exec', '-i', process.env.ADEQUATE_DB_CONTAINER || 'adequate_db', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: `update public.media_assets set scan_status='clean' where id='${asset.data.id}';`, stdio: ['pipe', 'pipe', 'pipe'] });
    await page.reload();
    await page.getByRole('button').filter({ hasText: title }).click();
    await page.getByLabel('I have verified rights for this content', { exact: true }).check();
    await expect(page.getByText('Content rights: Verified', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
    await page.getByRole('button', { name: 'Approve this version', exact: true }).click();
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unpublish to draft', exact: true })).toBeVisible();
    await page.goto(`${app}/listen`);
    await page.getByRole('button', { name: `Play ${title}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `Pause ${title}`, exact: true })).toBeVisible();
    await page.getByRole('button', { name: '0:10 · Synthetic chapter', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('audio')?.currentTime >= 10);
    await page.getByRole('button', { name: `Pause ${title}`, exact: true }).click();
    await expect(page.getByText('Playback position saved.', { exact: true })).toBeVisible();
    await page.getByText('Read transcript', { exact: true }).click();
    await expect(page.getByText('Synthetic silent test recording. No spoken content.', { exact: true })).toBeVisible();
    await page.goto(`${app}/content/${slug}`);
    await page.waitForFunction(() => document.querySelector('audio')?.currentTime >= 10);
    await page.getByRole('button', { name: 'Save content', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Saved to your account', exact: true })).toBeVisible();
    await page.goto(`${app}/saved`);
    await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Remove saved item', exact: true }).click();
    await expect(page.getByText('No saved content yet.', { exact: false })).toBeVisible();
    await page.goto(`${app}/studio`);
    await page.getByRole('button').filter({ hasText: title }).click();
    await page.getByRole('button', { name: 'Unpublish to draft', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Submit for review', exact: true })).toBeVisible();
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
