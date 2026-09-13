-- Pin persistence for the visual study guide.
--
-- Added to the EXISTING exam-subscribers database on purpose. The alternative,
-- a second database, would split the mailing list in two and make "who has
-- engaged with what" unanswerable. One list, one unsubscribe flag.
--
-- The existing subscriber table is an EVENT LOG (one row per exam result email,
-- email is not unique). Pins need a stable identity, so pin_user is separate and
-- does hold a unique email. They join on email when you want the whole picture.

CREATE TABLE IF NOT EXISTS pin_user (
  user_id      TEXT PRIMARY KEY,             -- our own uuid, never an email
  email        TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  verified_at  TEXT,                         -- set when a magic link is followed
  last_seen_at TEXT,
  unsubscribed INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pin (
  user_id    TEXT NOT NULL REFERENCES pin_user(user_id) ON DELETE CASCADE,
  cert       TEXT NOT NULL,                  -- associate | developer | foundations | architect
  pid        TEXT NOT NULL,                  -- sha1(cert|module|lesson)[:10], never a position
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, cert, pid)
);
CREATE INDEX IF NOT EXISTS idx_pin_user ON pin(user_id);

-- Magic links. Only the sha256 of the token is stored, so a database leak does
-- not hand over a working sign-in link. Single use, short lived.
CREATE TABLE IF NOT EXISTS magic (
  token_hash TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  cert       TEXT,
  payload    TEXT,                           -- pins to attach on first verify
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_magic_expires ON magic(expires_at);

-- Sessions in D1 rather than a self-contained JWT, so revocation actually works.
-- Same pattern as schema-002-auth.sql: the raw cookie value is never stored.
CREATE TABLE IF NOT EXISTS pin_session (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES pin_user(user_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_pin_session_user ON pin_session(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_session_expires ON pin_session(expires_at);
