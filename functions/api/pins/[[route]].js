/**
 * Pin persistence for the visual study guide.
 *
 * Routes (all under /api/pins/):
 *   POST /api/pins/link     { email, cert, pins[] }  -> emails a magic link
 *   GET  /api/pins/verify?t=...                      -> sets a session cookie, redirects back
 *   GET  /api/pins/list                              -> pins for the current session
 *   POST /api/pins/sync     { cert, pins[] }         -> replaces that cert's pins
 *   POST /api/pins/signout                           -> revokes the session
 *
 * WHY MAGIC LINKS AND NOT EMAIL PLUS PASSWORD
 * The point of collecting the address is to have a usable one, so it has to be
 * verified; a magic link verifies and authenticates in a single step. It also
 * means no password is stored here. That matters because the Workers runtime
 * offers PBKDF2 but not Argon2 or bcrypt, so a home-rolled password store would
 * be both weaker and a liability, for data that is a list of bookmarks.
 *
 * WHY THE TOKEN IS NEVER STORED
 * Only sha256(token) is written, for both magic links and sessions. A database
 * leak therefore does not hand over working sign-in links or live sessions. Same
 * pattern as schema-002-auth.sql in the exam engine.
 *
 * Bindings reused from the exam engine rather than duplicated:
 *   env.exam_subscribers  D1
 *   env.RESEND_API_KEY    secret
 *   env.IP_SALT           secret
 */

const FROM = 'Sameer Goel <noreply@sameer-goel.com>';
const GUIDE = 'https://sameer-goel.com/anthropic-certifications/visual-study-guide/';

// Certificate ids are resolved here, never taken from the request, so a caller
// cannot invent a cert or inject one into an email subject.
const CERTS = {
  associate: 'Claude Certified Associate - Foundations',
  developer: 'Claude Certified Developer - Foundations',
  foundations: 'Claude Certified Architect - Foundations',
  architect: 'Claude Certified Architect - Professional',
};

const MAGIC_MINUTES = 20;
const SESSION_DAYS = 180;
const MAX_PINS = 200;          // a whole cert is at most 38 cards
const LINKS_PER_IP_PER_DAY = 12;

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra,
    },
  });
}

async function sha256Hex(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

async function hashIp(ip, salt) {
  return (await sha256Hex(`${salt}:${ip}`)).slice(0, 32);
}

function randToken() {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return [...a].map(x => x.toString(16).padStart(2, '0')).join('');
}

function uuid() {
  return crypto.randomUUID();
}

/** Conservative address check. Rejecting a valid-but-exotic address is a far
 *  smaller problem than accepting junk into the list. */
function validEmail(e) {
  return typeof e === 'string'
    && e.length >= 6 && e.length <= 254
    && /^[^\s@,;:<>()"[\]\\]+@[^\s@.]+(\.[^\s@.]+)+$/.test(e)
    && !/\.\./.test(e);
}

/** Pin ids are fixed-length lowercase hex produced by the build. Anything else
 *  is discarded rather than stored, so the table cannot be used as free text. */
function cleanPins(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const p of v) {
    if (typeof p === 'string' && /^[0-9a-f]{10}$/.test(p) && out.indexOf(p) < 0) out.push(p);
    if (out.length >= MAX_PINS) break;
  }
  return out;
}

function cookieFrom(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return null;
}

function sessionCookie(token, maxAgeSec) {
  return `sgpin=${token}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; Secure; SameSite=Lax`;
}

async function currentUser(db, request) {
  const tok = cookieFrom(request, 'sgpin');
  if (!tok || !/^[0-9a-f]{64}$/.test(tok)) return null;
  const row = await db.prepare(
    `SELECT s.user_id, u.email FROM pin_session s
       JOIN pin_user u ON u.user_id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND u.unsubscribed = 0`
  ).bind(await sha256Hex(tok)).first();
  return row || null;
}

async function replacePins(db, userId, cert, pins) {
  const stmts = [db.prepare('DELETE FROM pin WHERE user_id = ? AND cert = ?').bind(userId, cert)];
  for (const p of pins) {
    stmts.push(db.prepare('INSERT OR IGNORE INTO pin (user_id, cert, pid) VALUES (?, ?, ?)')
      .bind(userId, cert, p));
  }
  await db.batch(stmts);
}

async function allPins(db, userId) {
  const r = await db.prepare('SELECT cert, pid FROM pin WHERE user_id = ?').bind(userId).all();
  const out = {};
  for (const row of (r.results || [])) {
    (out[row.cert] = out[row.cert] || []).push(row.pid);
  }
  return out;
}

/* ── POST /api/pins/link ─────────────────────────────────────────────────── */
async function postLink({ request, env }) {
  const db = env.exam_subscribers;
  if (!db) return json({ error: 'Storage is not configured.' }, 503);
  if (!env.RESEND_API_KEY) return json({ error: 'Email is not configured.' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 8000) {
    return json({ error: 'Request too large.' }, 413);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad JSON.' }, 400); }

  const email = String(body.email || '').trim().toLowerCase();
  const cert = Object.prototype.hasOwnProperty.call(CERTS, body.cert) ? body.cert : null;
  const pins = cleanPins(body.pins);
  if (!validEmail(email)) return json({ error: 'That email address does not look right.' }, 400);
  if (!cert) return json({ error: 'Unknown certification.' }, 400);

  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ipHash = await hashIp(ip, env.IP_SALT || 'study-guide');
  const rl = await db.prepare(
    `SELECT COUNT(*) AS n FROM send_log WHERE ip_hash = ? AND created_at > datetime('now','-1 day')`
  ).bind(ipHash).first();
  if (rl && rl.n >= LINKS_PER_IP_PER_DAY) {
    return json({ error: 'Too many emails from this address today. Try again tomorrow.' }, 429);
  }

  const token = randToken();
  await db.batch([
    db.prepare(
      `INSERT INTO magic (token_hash, email, cert, payload, expires_at)
       VALUES (?, ?, ?, ?, datetime('now', ?))`
    ).bind(await sha256Hex(token), email, cert, JSON.stringify(pins), `+${MAGIC_MINUTES} minutes`),
    db.prepare('INSERT INTO send_log (ip_hash) VALUES (?)').bind(ipHash),
  ]);

  const link = `https://sameer-goel.com/api/pins/verify?t=${token}`;
  const title = CERTS[cert];
  // The email body is rendered here from a fixed template. No caller-supplied
  // markup reaches the outbound message, so this cannot be used as an open mailer.
  const html =
    `<div style="font:400 15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a">
       <p>Tap the button to keep your pinned lessons and see them on any device.</p>
       <p style="margin:26px 0">
         <a href="${link}" style="background:#c75c3a;color:#fff;text-decoration:none;
            padding:12px 22px;border-radius:999px;font-weight:600;display:inline-block">
            Save my pinned lessons</a></p>
       <p style="color:#6b6b6b;font-size:13px">
         This link works once and expires in ${MAGIC_MINUTES} minutes.<br>
         You pinned ${pins.length} lesson${pins.length === 1 ? '' : 's'} in ${title}.<br>
         If you did not request this, ignore it and nothing is saved.</p>
     </div>`;

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: 'Save your pinned lessons',
      html,
      text: `Save your pinned lessons: ${link}\n\n`
        + `This link works once and expires in ${MAGIC_MINUTES} minutes.`,
    }),
  });
  if (!sent.ok) {
    console.log('resend failed', sent.status, (await sent.text()).slice(0, 300));
    return json({ error: 'Could not send the email just now. Please try again.' }, 502);
  }
  return json({ ok: true, sent: true });
}

/* ── GET /api/pins/verify?t=... ──────────────────────────────────────────── */
async function getVerify({ request, env }) {
  const db = env.exam_subscribers;
  const url = new URL(request.url);
  const t = url.searchParams.get('t') || '';
  const back = (c, m) => Response.redirect(`${GUIDE}${c ? c + '.html' : ''}?pins=${m}`, 302);
  if (!/^[0-9a-f]{64}$/.test(t)) return back('', 'badlink');

  const row = await db.prepare(
    `SELECT token_hash, email, cert, payload FROM magic
      WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')`
  ).bind(await sha256Hex(t)).first();
  if (!row) return back('', 'expired');

  // single use, burned before anything else happens
  await db.prepare(`UPDATE magic SET used_at = datetime('now') WHERE token_hash = ?`)
    .bind(row.token_hash).run();

  let user = await db.prepare('SELECT user_id FROM pin_user WHERE email = ?')
    .bind(row.email).first();
  if (!user) {
    const id = uuid();
    await db.prepare(
      `INSERT INTO pin_user (user_id, email, verified_at, last_seen_at)
       VALUES (?, ?, datetime('now'), datetime('now'))`
    ).bind(id, row.email).run();
    user = { user_id: id };
  } else {
    await db.prepare(
      `UPDATE pin_user SET verified_at = COALESCE(verified_at, datetime('now')),
         last_seen_at = datetime('now'), unsubscribed = 0 WHERE user_id = ?`
    ).bind(user.user_id).run();
  }

  let pins = [];
  try { pins = cleanPins(JSON.parse(row.payload || '[]')); } catch { pins = []; }
  if (row.cert && pins.length) await replacePins(db, user.user_id, row.cert, pins);

  const st = randToken();
  await db.prepare(
    `INSERT INTO pin_session (token_hash, user_id, expires_at, user_agent)
     VALUES (?, ?, datetime('now', ?), ?)`
  ).bind(await sha256Hex(st), user.user_id, `+${SESSION_DAYS} days`,
    String(request.headers.get('user-agent') || '').slice(0, 200)).run();

  return new Response(null, {
    status: 302,
    headers: {
      location: `${GUIDE}${row.cert ? row.cert + '.html' : ''}?pins=saved`,
      'set-cookie': sessionCookie(st, SESSION_DAYS * 86400),
      'cache-control': 'no-store',
    },
  });
}

/* ── GET /api/pins/list ──────────────────────────────────────────────────── */
async function getList({ request, env }) {
  const db = env.exam_subscribers;
  const u = await currentUser(db, request);
  if (!u) return json({ signedIn: false, pins: {} });
  await db.prepare(`UPDATE pin_user SET last_seen_at = datetime('now') WHERE user_id = ?`)
    .bind(u.user_id).run();
  return json({ signedIn: true, email: u.email, pins: await allPins(db, u.user_id) });
}

/* ── POST /api/pins/sync ─────────────────────────────────────────────────── */
async function postSync({ request, env }) {
  const db = env.exam_subscribers;
  const u = await currentUser(db, request);
  if (!u) return json({ error: 'Not signed in.' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad JSON.' }, 400); }
  const cert = Object.prototype.hasOwnProperty.call(CERTS, body.cert) ? body.cert : null;
  if (!cert) return json({ error: 'Unknown certification.' }, 400);
  await replacePins(db, u.user_id, cert, cleanPins(body.pins));
  return json({ ok: true, pins: await allPins(db, u.user_id) });
}

/* ── POST /api/pins/signout ──────────────────────────────────────────────── */
async function postSignout({ request, env }) {
  const tok = cookieFrom(request, 'sgpin');
  if (tok && /^[0-9a-f]{64}$/.test(tok)) {
    await env.exam_subscribers.prepare('DELETE FROM pin_session WHERE token_hash = ?')
      .bind(await sha256Hex(tok)).run();
  }
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}

export async function onRequest(context) {
  const { request } = context;
  const path = new URL(request.url).pathname.replace(/\/+$/, '');
  const m = request.method;
  try {
    if (path.endsWith('/link') && m === 'POST') return await postLink(context);
    if (path.endsWith('/verify') && m === 'GET') return await getVerify(context);
    if (path.endsWith('/list') && m === 'GET') return await getList(context);
    if (path.endsWith('/sync') && m === 'POST') return await postSync(context);
    if (path.endsWith('/signout') && m === 'POST') return await postSignout(context);
  } catch (e) {
    console.log('pins error', path, m, String(e).slice(0, 300));
    return json({ error: 'Something went wrong.' }, 500);
  }
  return json({ error: 'Not found.' }, 404);
}
