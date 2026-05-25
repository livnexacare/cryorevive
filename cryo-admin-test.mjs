/**
 * CryoRevive admin flow end-to-end test
 * Tests: login → dashboard loads → bookings fetch → confirm/cancel → logout
 */
import { chromium } from 'playwright';

const BASE        = process.env.FRONTEND_URL  || 'http://localhost:3000';
const API_URL     = process.env.NEXT_PUBLIC_API_URL || 'https://cryorevive.onrender.com';
const ADMIN_KEY   = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
const ADMIN_USER  = process.env.ADMIN_USERNAME;
const ADMIN_PASS  = process.env.ADMIN_PASSWORD;
const SS_DIR      = 'C:\\Users\\user\\AppData\\Local\\Temp\\cryo-ss';

import { mkdirSync } from 'fs';
mkdirSync(SS_DIR, { recursive: true });

let passed = 0, failed = 0;
const results = [];

function log(icon, label, detail = '') {
  const line = `${icon} ${label}${detail ? ' → ' + detail : ''}`;
  results.push(line);
  console.log(line);
}

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext();
const page    = await ctx.newPage();

try {
  // ── Step 1: Backend health ──────────────────────────────────────────────────
  const health = await fetch(`${API_URL}/health`).then(r => r.json());
  if (health.status === 'ok') { log('✅', 'Backend health', 'ok'); passed++; }
  else                        { log('❌', 'Backend health', JSON.stringify(health)); failed++; }

  // ── Step 2: 403 on missing key ──────────────────────────────────────────────
  const noKey = await fetch(`${API_URL}/api/bookings`);
  if (noKey.status === 403) { log('✅', 'GET /api/bookings no key', '403 Forbidden'); passed++; }
  else                      { log('❌', 'GET /api/bookings no key', `got ${noKey.status}`); failed++; }

  // ── Step 3: GET /api/bookings with key ─────────────────────────────────────
  const bRes = await fetch(`${API_URL}/api/bookings?limit=5`, {
    headers: { 'X-Admin-Key': ADMIN_KEY }
  });
  if (bRes.ok) { log('✅', 'GET /api/bookings with key', `${bRes.status} OK`); passed++; }
  else         { log('❌', 'GET /api/bookings with key', `${bRes.status}`); failed++; }
  const bookings = await bRes.json().catch(() => []);
  log('🔍', `Bookings returned`, `${Array.isArray(bookings) ? bookings.length : 'non-array'} rows`);

  // ── Step 4: POST /api/bookings (create test booking) ───────────────────────
  const testBooking = {
    name: 'Test User',
    email: 'test@cryorevive.com',
    phone: '9999999999',
    service_type: 'ice_bath',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // tomorrow
    time_slot: '10:00 AM',
    notes: 'automated test'
  };
  const createRes = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testBooking)
  });
  let newBookingId = null;
  if (createRes.status === 201) {
    const created = await createRes.json();
    newBookingId = created.id;
    log('✅', 'POST /api/bookings', `201 Created id=${newBookingId?.slice(0,8)}`); passed++;
  } else {
    log('❌', 'POST /api/bookings', `${createRes.status}`); failed++;
  }

  // ── Step 5: GET single booking ─────────────────────────────────────────────
  if (newBookingId) {
    const single = await fetch(`${API_URL}/api/bookings/${newBookingId}`, {
      headers: { 'X-Admin-Key': ADMIN_KEY }
    });
    if (single.ok) { log('✅', `GET /api/bookings/${newBookingId.slice(0,8)}`, '200 OK'); passed++; }
    else           { log('❌', `GET /api/bookings/${newBookingId.slice(0,8)}`, `${single.status}`); failed++; }
  }

  // ── Step 6: PATCH status → confirmed ──────────────────────────────────────
  if (newBookingId) {
    const confirm = await fetch(`${API_URL}/api/bookings/${newBookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
      body: JSON.stringify({ status: 'confirmed' })
    });
    const confirmBody = await confirm.json().catch(() => ({}));
    if (confirm.ok && confirmBody.status === 'confirmed') {
      log('✅', 'PATCH status → confirmed', 'status=confirmed'); passed++;
    } else {
      log('❌', 'PATCH status → confirmed', `${confirm.status} ${JSON.stringify(confirmBody)}`); failed++;
    }
  }

  // ── Step 7: PATCH status → cancelled ──────────────────────────────────────
  if (newBookingId) {
    const cancel = await fetch(`${API_URL}/api/bookings/${newBookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
      body: JSON.stringify({ status: 'cancelled' })
    });
    const cancelBody = await cancel.json().catch(() => ({}));
    if (cancel.ok && cancelBody.status === 'cancelled') {
      log('✅', 'PATCH status → cancelled', 'status=cancelled'); passed++;
    } else {
      log('❌', 'PATCH status → cancelled', `${cancel.status} ${JSON.stringify(cancelBody)}`); failed++;
    }
  }

  // ── Step 8: 404 on bad booking id ─────────────────────────────────────────
  const notFound = await fetch(`${API_URL}/api/bookings/00000000-0000-0000-0000-000000000000`, {
    headers: { 'X-Admin-Key': ADMIN_KEY }
  });
  if (notFound.status === 404) { log('✅', '🔍 GET unknown id', '404 as expected'); passed++; }
  else                         { log('❌', '🔍 GET unknown id', `got ${notFound.status}`); failed++; }

  // ── Step 9: UI — admin login page ─────────────────────────────────────────
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${SS_DIR}\\01-login.png` });
  const loginCard = await page.locator('input[id="username"]').isVisible();
  if (loginCard) { log('✅', 'UI /admin login form visible'); passed++; }
  else           { log('❌', 'UI /admin login form not found'); failed++; }

  // ── Step 10: UI — bad credentials ─────────────────────────────────────────
  await page.fill('input[id="username"]', 'wrong');
  await page.fill('input[id="password"]', 'wrong');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  const errorMsg = await page.locator('text=Invalid credentials').isVisible();
  if (errorMsg) { log('✅', '🔍 Bad credentials', 'error message shown'); passed++; }
  else          { log('❌', '🔍 Bad credentials', 'no error shown'); failed++; }
  await page.screenshot({ path: `${SS_DIR}\\02-bad-creds.png` });

  // ── Step 11: UI — successful login ────────────────────────────────────────
  await page.fill('input[id="username"]', ADMIN_USER);
  await page.fill('input[id="password"]', ADMIN_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 8000 }).catch(() => {});
  await page.screenshot({ path: `${SS_DIR}\\03-dashboard.png` });
  const onDashboard = page.url().includes('/admin/dashboard');
  if (onDashboard) { log('✅', 'UI login → redirected to /admin/dashboard'); passed++; }
  else             { log('❌', 'UI login → not on dashboard', page.url()); failed++; }

  // ── Step 12: UI — stats cards visible ─────────────────────────────────────
  await page.waitForSelector('text=Total Bookings', { timeout: 8000 }).catch(() => {});
  const statsVisible = await page.locator('text=Total Bookings').isVisible();
  if (statsVisible) { log('✅', 'UI stats cards visible'); passed++; }
  else              { log('❌', 'UI stats cards not found'); failed++; }

  // ── Step 13: UI — bookings table rendered (no infinite spinner) ────────────
  await page.waitForTimeout(3000); // allow API fetch
  await page.screenshot({ path: `${SS_DIR}\\04-dashboard-loaded.png` });
  const tableVisible = await page.locator('table').isVisible().catch(() => false);
  const spinner      = await page.locator('text=Loading bookings...').isVisible();
  const apiError     = await page.locator('text=API error').isVisible();
  if (tableVisible && !spinner) { log('✅', 'UI bookings table rendered'); passed++; }
  else if (spinner)             { log('❌', 'UI still showing spinner (API down?)'); failed++; }
  else if (apiError)            { log('❌', 'UI showing API error'); failed++; }
  else                          { log('❌', 'UI table not found'); failed++; }

  // ── Step 14: UI — logout ──────────────────────────────────────────────────
  await page.click('button:has-text("Logout")');
  await page.waitForURL(`${BASE}/admin`, { timeout: 5000 }).catch(() => {});
  await page.screenshot({ path: `${SS_DIR}\\05-after-logout.png` });
  const backOnLogin = page.url().includes('/admin') && !page.url().includes('dashboard');
  if (backOnLogin) { log('✅', 'UI logout → back on /admin'); passed++; }
  else             { log('❌', 'UI logout → wrong page', page.url()); failed++; }

  // ── Step 15: UI — dashboard redirect after logout ─────────────────────────
  await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const redirected = !page.url().includes('dashboard');
  if (redirected) { log('✅', '🔍 /admin/dashboard without session → redirected'); passed++; }
  else            { log('❌', '🔍 /admin/dashboard without session → NOT redirected'); failed++; }

} catch (err) {
  log('❌', 'Unexpected error', err.message);
  failed++;
} finally {
  await browser.close();
  await fetch(`C:\\Users\\user\\AppData\\Local\\Temp\\cryo-migrate.mjs`).catch(() => {}); // no-op cleanup
}

console.log('\n' + '='.repeat(60));
console.log(`PASSED: ${passed}  FAILED: ${failed}  TOTAL: ${passed + failed}`);
console.log(`VERDICT: ${failed === 0 ? 'PASS' : 'FAIL'}`);
console.log('Screenshots: ' + SS_DIR);
