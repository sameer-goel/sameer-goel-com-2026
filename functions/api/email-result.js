/**
 * POST /api/email-result
 *
 * Emails a candidate their own exam result and records the address.
 *
 * WHY THIS DOES NOT ACCEPT THE HTML THE BROWSER ALREADY BUILT
 * The page can already produce a full result document client-side, so the
 * obvious design is to POST that document and attach it. That would hand
 * anyone on the internet an authenticated mailer: POST an arbitrary body plus
 * any recipient, and the victim receives DKIM-signed mail from
 * sameer-goel.com. Rate limiting slows that down but does not close it.
 *
 * So no caller-supplied markup reaches the outbound message. This endpoint
 * accepts numbers and known identifiers only, and renders the email itself
 * from a fixed template. Domain labels are the one piece of caller text that
 * appears, and they are HTML-escaped, stripped of control characters and cut
 * to 80 chars, so they cannot carry markup or a link.
 *
 * The full question-by-question review stays in the local download, which
 * never leaves the candidate's machine.
 */

const FROM = 'Sameer Goel <noreply@sameer-goel.com>';
const BASE = 'https://sameer-goel.com/anthropic-certifications/practice-anthropic-certification-exam-engine/';

// Exam titles are resolved here, not taken from the request, so the subject
// line cannot be set by the caller.
const EXAMS = {
  'associate': 'Claude Certified Associate - Foundations',
  'developer': 'Claude Certified Developer - Foundations',
  'architect-foundation': 'Claude Certified Architect - Foundations',
  'architect-professional': 'Claude Certified Architect - Professional',
};

const MAX_PER_IP_PER_DAY = 20;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, 80)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Deliberately conservative rather than RFC-complete: a candidate typing their
// own address is the whole use case, so odd-but-legal addresses are an
// acceptable loss next to keeping the endpoint hard to abuse.
function validEmail(e) {
  return typeof e === 'string'
    && e.length >= 6 && e.length <= 254
    && /^[^\s@,;:<>"'()\[\]\\]+@[^\s@,;:<>"'()\[\]\\]+\.[a-zA-Z]{2,}$/.test(e);
}

function num(v, lo, hi) {
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
}

async function hashIp(ip, salt) {
  const data = new TextEncoder().encode(String(ip) + '|' + salt);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEND_API_KEY) return json({ error: 'Email is not configured.' }, 503);

  let body;
  try {
    if (Number(request.headers.get('content-length') || 0) > 20000) {
      return json({ error: 'Payload too large.' }, 413);
    }
    body = await request.json();
  } catch (e) {
    return json({ error: 'Expected JSON.' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!validEmail(email)) return json({ error: 'That does not look like an email address.' }, 400);

  const examId = Object.prototype.hasOwnProperty.call(EXAMS, body.examId) ? body.examId : null;
  if (!examId) return json({ error: 'Unknown exam.' }, 400);

  const correct = num(body.correct, 0, 2000);
  const total = num(body.total, 1, 2000);
  if (correct === null || total === null || correct > total) {
    return json({ error: 'Invalid score.' }, 400);
  }
  const pct = Math.round((correct / total) * 1000) / 10;

  // per-domain rows: numbers, plus a short escaped label
  let rows = [];
  if (Array.isArray(body.domains)) {
    rows = body.domains.slice(0, 30).map(d => {
      const c = num(d && d.correct, 0, 2000), t = num(d && d.total, 1, 2000);
      if (c === null || t === null || c > t) return null;
      return { name: esc(d && d.name), correct: c, total: t,
               pct: Math.round((c / t) * 1000) / 10 };
    }).filter(Boolean);
  }

  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ipHash = await hashIp(ip, env.IP_SALT || 'exam-engine');
  const db = env.exam_subscribers;

  // Rate limit before doing any work that costs money or reputation.
  if (db) {
    try {
      const r = await db.prepare(
        "SELECT COUNT(*) AS n FROM send_log WHERE ip_hash = ? AND created_at > datetime('now','-1 day')"
      ).bind(ipHash).first();
      if (r && Number(r.n) >= MAX_PER_IP_PER_DAY) {
        return json({ error: 'Daily limit reached. Use the download button instead.' }, 429);
      }
    } catch (e) { /* a rate-limit read failure must not block a legitimate send */ }
  }

  const examTitle = EXAMS[examId];
  const domainRows = rows.map(d =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #e3e6ea">${d.name || 'Domain'}</td>`
    + `<td style="padding:6px 8px;border-bottom:1px solid #e3e6ea;text-align:right">${d.correct} / ${d.total}</td>`
    + `<td style="padding:6px 8px;border-bottom:1px solid #e3e6ea;text-align:right">${d.pct}%</td></tr>`
  ).join('');

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#fff;color:#1a1d21;font:16px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:620px;margin:0 auto">
  <p style="margin:0 0 4px;color:#5b6470;font-size:13px">Anthropic certification practice exams</p>
  <h1 style="margin:0 0 18px;font-size:21px">Your ${esc(examTitle)} practice result</h1>
  <div style="border:1px solid #e3e6ea;border-radius:12px;padding:16px 18px;margin:0 0 18px">
    <div style="font-size:34px;font-weight:650;line-height:1.1">${pct}%</div>
    <div style="color:#5b6470;font-size:14px">${correct} of ${total} correct</div>
  </div>
  ${domainRows ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 18px">
    <thead><tr>
      <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e3e6ea">Domain</th>
      <th style="text-align:right;padding:6px 8px;border-bottom:1px solid #e3e6ea">Correct</th>
      <th style="text-align:right;padding:6px 8px;border-bottom:1px solid #e3e6ea">Score</th>
    </tr></thead><tbody>${domainRows}</tbody></table>` : ''}
  <p style="font-size:14px;color:#5b6470">This is a raw percentage from a practice attempt. Anthropic does not publish the raw-to-scaled mapping, so it deliberately claims no pass or fail.</p>
  <p style="font-size:14px">For the full question-by-question review, with the rationale for every answer, use the <strong>Save your result</strong> button on the results screen. That file is built in your browser and never uploaded.</p>
  <p style="font-size:14px"><a href="${BASE}${examId}/" style="color:#0d7d73">Take another attempt</a></p>
  <p style="font-size:12px;color:#5b6470;border-top:1px solid #e3e6ea;padding-top:12px;margin-top:22px">
    You are receiving this because you asked for your result by email at sameer-goel.com.
    Your address is stored only to send this and occasional updates about these practice exams.
    Reply with "unsubscribe" and it will be removed.
  </p>
</div></body></html>`;

  const text = `Your ${examTitle} practice result\n\n${pct}% (${correct} of ${total} correct)\n\n`
    + rows.map(d => `  ${d.name || 'Domain'}: ${d.correct}/${d.total} (${d.pct}%)`).join('\n')
    + `\n\nFor the full review with rationale for every answer, use the "Save your result" button on the results screen.\n`
    + `Take another attempt: ${BASE}${examId}/\n\n`
    + `You are receiving this because you asked for your result by email at sameer-goel.com. Reply with "unsubscribe" to be removed.\n`;

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: `Your ${examTitle} practice result: ${pct}%`,
      html, text,
    }),
  });

  if (!sent.ok) {
    let detail = '';
    try { detail = JSON.stringify(await sent.json()).slice(0, 300); } catch (e) {}
    // The provider's message is logged, never returned, so nothing about the
    // account or the key leaks to the caller.
    console.log('resend failed', sent.status, detail);
    return json({ error: 'Could not send the email. Please try the download instead.' }, 502);
  }

  if (db) {
    try {
      await db.batch([
        db.prepare(
          `INSERT INTO subscriber (email, exam_id, score_pct, ip_hash, user_agent)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(email, exam_id) DO UPDATE SET
             score_pct = excluded.score_pct,
             created_at = datetime('now'),
             unsubscribed = 0`
        ).bind(email, examId, pct, ipHash,
               String(request.headers.get('user-agent') || '').slice(0, 200)),
        db.prepare('INSERT INTO send_log (ip_hash) VALUES (?)').bind(ipHash),
      ]);
    } catch (e) {
      // The candidate already has their email. Losing the list row is the
      // lesser failure, so it must not turn a success into an error.
      console.log('subscriber insert failed', String(e).slice(0, 200));
    }
  }

  return json({ ok: true });
}

// Anything other than POST, including a cross-origin preflight, gets nothing.
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response('Method not allowed', { status: 405, headers: { 'allow': 'POST' } });
}
