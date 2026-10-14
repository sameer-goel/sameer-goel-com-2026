#!/usr/bin/env bash
# Builds the complete sameer-goel.com upload bundle into ./dist
#   TARGET=staging  -> excludes functions/ (no live email) ; used for preview
#   TARGET=production -> includes functions/
# Protected legacy paths are copied as-is. Never ship resume-source/.
set -euo pipefail
TARGET="${TARGET:-staging}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
rm -rf "$DIST" && mkdir -p "$DIST"

echo "1/4 legacy site files"
python3 - "$ROOT" "$DIST" <<'PY'
import os, shutil, sys
root, dist = sys.argv[1], sys.argv[2]
skip = {'.git','.github','ci','dist','decode-site','resume-source','.archive','.assets-src','scripts',
        'build-sql-pins-schema.sql','_build_portfolio_assets.py','github_deploy_playbook.md','.gitignore','node_modules'}
for name in os.listdir(root):
    if name in skip: continue
    src = os.path.join(root, name); dst = os.path.join(dist, name)
    shutil.copytree(src, dst) if os.path.isdir(src) else shutil.copy2(src, dst)
PY
[ "$TARGET" = "production" ] || rm -rf "$DIST/functions"

echo "2/4 DeCoDE pages (Next.js static export)"
cd "$ROOT/decode-site"
# images are not stored in git (text-only pipeline); fetch them from the running staging site
IMG_BASE="${IMG_BASE:-https://staging.sameer-goel-staging.pages.dev}"
mkdir -p public/img/talks
for f in og.jpg img/hero-2400.webp img/hero-1400.webp img/hero-800.webp img/emblem-1000.webp img/emblem-520.webp img/emblem-256.png \
         img/portrait-contact-900.webp img/portrait-contact-480.webp img/talks/01.webp img/talks/05.webp img/talks/08.webp \
         img/talks/11.webp img/talks/16.webp img/talks/20.webp img/talks/22.webp img/talks/26.webp; do
  [ -s "public/$f" ] || curl -sfL "$IMG_BASE/$f" -o "public/$f"
done
mkdir -p src/app
[ -s src/app/icon.png ] || curl -sfL "$IMG_BASE/icon.png" -o src/app/icon.png
[ -s src/app/apple-icon.png ] || curl -sfL "$IMG_BASE/apple-icon.png" -o src/app/apple-icon.png
npm ci --no-audit --no-fund
NEXT_TELEMETRY_DISABLED=1 npm run build
# legacy index.html is the homepage; drop the Next.js one and its text twin
rm -f out/index.html out/index.txt
cp -R out/. "$DIST/"

echo "3/4 safety checks"
cd "$DIST"
for p in index.html forward-deployed-engineer/index.html anthropic-certifications/visual-study-guide/index.html _redirects sitemap.xml llms.txt robots.txt decode/index.html mentoring/index.html; do
  [ -s "$p" ] || { echo "MISSING $p"; exit 1; }
done
[ -e resume-source ] && { echo "resume-source must not ship"; exit 1; }
grep -q 'hero-wordmark' index.html || { echo "homepage is not the new hero"; exit 1; }
! grep -q 'buy.stripe.com' index.html || { echo "stripe links still on homepage"; exit 1; }
python3 - <<'PY'
import re
s=open('sitemap.xml').read(); n=len(re.findall(r'<loc>',s)); assert n>=21, f'sitemap lost entries: {n}'
PY
echo "4/4 bundle ready: $(find . -type f | wc -l) files, target=$TARGET"
