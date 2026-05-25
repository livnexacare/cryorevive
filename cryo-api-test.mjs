/**
 * CryoRevive API-only test (no browser / Playwright)
 * Tests: health → auth guard → bookings CRUD → status transitions → 404
 */

const API   = process.env.NEXT_PUBLIC_API_URL || 'https://cryorevive.onrender.com';
const KEY   = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

let passed = 0, failed = 0;

function log(icon, label, detail = '') {
  console.log(`${icon} ${label}${detail ? ' → ' + detail : ''}`);
}
function pass(label, detail) { log('✅', label, detail); passed++; }
function fail(label, detail) { log('❌', label, detail); failed++; }

console.log(`\nTarget: ${API}`);
console.log(`Admin key: ${KEY ? KEY.slice(0, 6) + '…' : '(not set — auth steps will report actual results)'}\n`);

// ── 1. Backend health ─────────────────────────────────────────────────────────
try {
  const r = await fetch(`${API}/health`);
  const body = await r.json().catch(() => ({}));
  if (body.status === 'ok') pass('GET /health', 'status=ok');
  else                      fail('GET /health', JSON.stringify(body));
} catch (e) { fail('GET /health', e.message); }

// ── 2. 403 on missing key ─────────────────────────────────────────────────────
try {
  const r = await fetch(`${API}/api/bookings`);
  if (r.status === 403) pass('GET /api/bookings (no key)', '403 Forbidden');
  else                  fail('GET /api/bookings (no key)', `got ${r.status}`);
} catch (e) { fail('GET /api/bookings (no key)', e.message); }

// ── 3. GET /api/bookings with key ─────────────────────────────────────────────
try {
  const r = await fetch(`${API}/api/bookings?limit=5`, {
    headers: { 'X-Admin-Key': KEY }
  });
  const body = await r.json().catch(() => null);
  if (r.ok) pass('GET /api/bookings (with key)', `${r.status} — ${Array.isArray(body) ? body.length + ' rows' : JSON.stringify(body).slice(0, 80)}`);
  else      fail('GET /api/bookings (with key)', `${r.status} ${JSON.stringify(body).slice(0, 80)}`);
} catch (e) { fail('GET /api/bookings (with key)', e.message); }

// ── 3b. Cleanup: cancel any leftover test bookings ───────────────────────────
try {
  const all = await fetch(`${API}/api/bookings?limit=200`, {
    headers: { 'X-Admin-Key': KEY }
  });
  if (all.ok) {
    const rows = await all.json().catch(() => []);
    const stale = Array.isArray(rows)
      ? rows.filter(b => b.email === 'autotest@cryorevive.com' && b.status !== 'cancelled')
      : [];
    for (const b of stale) {
      await fetch(`${API}/api/bookings/${b.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': KEY },
        body: JSON.stringify({ status: 'cancelled' })
      });
    }
    if (stale.length) log('🧹', `Cleaned up ${stale.length} stale test booking(s)`);
  }
} catch (_) {}

// ── 4. POST /api/bookings — create test booking ───────────────────────────────
let newId = null;
try {
  const r = await fetch(`${API}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Automated Test',
      email: 'autotest@cryorevive.com',
      phone: '9000000001',
      service_type: 'ice_bath',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      time_slot: '10:00 AM',
      notes: 'api-only automated test'
    })
  });
  const body = await r.json().catch(() => ({}));
  if (r.status === 201) { newId = body.id; pass('POST /api/bookings', `201 Created id=${newId?.slice(0, 8)}`); }
  else                  fail('POST /api/bookings', `${r.status} ${JSON.stringify(body).slice(0, 120)}`);
} catch (e) { fail('POST /api/bookings', e.message); }

// ── 5. GET single booking ─────────────────────────────────────────────────────
if (newId) {
  try {
    const r = await fetch(`${API}/api/bookings/${newId}`, {
      headers: { 'X-Admin-Key': KEY }
    });
    if (r.ok) pass(`GET /api/bookings/:id`, `200 OK id=${newId.slice(0, 8)}`);
    else      fail(`GET /api/bookings/:id`, `${r.status}`);
  } catch (e) { fail('GET /api/bookings/:id', e.message); }
}

// ── 6. PATCH → confirmed ──────────────────────────────────────────────────────
if (newId) {
  try {
    const r = await fetch(`${API}/api/bookings/${newId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': KEY },
      body: JSON.stringify({ status: 'confirmed' })
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok && body.status === 'confirmed') pass('PATCH status → confirmed', 'status=confirmed');
    else                                     fail('PATCH status → confirmed', `${r.status} ${JSON.stringify(body).slice(0, 80)}`);
  } catch (e) { fail('PATCH status → confirmed', e.message); }
}

// ── 7. PATCH → cancelled ──────────────────────────────────────────────────────
if (newId) {
  try {
    const r = await fetch(`${API}/api/bookings/${newId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': KEY },
      body: JSON.stringify({ status: 'cancelled' })
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok && body.status === 'cancelled') pass('PATCH status → cancelled', 'status=cancelled');
    else                                     fail('PATCH status → cancelled', `${r.status} ${JSON.stringify(body).slice(0, 80)}`);
  } catch (e) { fail('PATCH status → cancelled', e.message); }
}

// ── 8. 404 on unknown id ──────────────────────────────────────────────────────
try {
  const r = await fetch(`${API}/api/bookings/00000000-0000-0000-0000-000000000000`, {
    headers: { 'X-Admin-Key': KEY }
  });
  if (r.status === 404) pass('GET /api/bookings/unknown-id', '404 as expected');
  else                  fail('GET /api/bookings/unknown-id', `got ${r.status}`);
} catch (e) { fail('GET /api/bookings/unknown-id', e.message); }

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log(`PASSED: ${passed}  FAILED: ${failed}  TOTAL: ${passed + failed}`);
console.log(`VERDICT: ${failed === 0 ? '✅ PASS' : '❌ FAIL'}`);
if (!KEY) console.log('\nNote: set NEXT_PUBLIC_ADMIN_API_KEY to test authenticated endpoints.');
