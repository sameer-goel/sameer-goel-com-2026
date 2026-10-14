# Domain migration checklist

Current state (13 Oct 2026):
- `sameer-goel.com` (apex) -> Pages project `sameergoel`, HTTP 200.
- `www.sameer-goel.com` -> CNAME `ghs.googlehosted.com` (old Google Sites), HTTP 525 SSL error. Broken today.

Steps, each needs Sameer's approval:
- [ ] Backup confirmed (zip of current live site saved in the thread).
- [ ] Review staging URL on desktop and mobile.
- [ ] Confirm facts in FACTS-TO-VERIFY.md.
- [ ] Promote bundle to project `sameergoel` (production).
- [ ] Fix www: replace the `ghs.googlehosted.com` CNAME with a Pages custom domain `www.sameer-goel.com`, then add a 301 from www to apex (Cloudflare Bulk Redirect or a redirect rule). DNS change: approval required.
- [ ] Optional later: if you prefer www as canonical, flip `SITE.url`, regenerate sitemap and update legacy canonicals together, then 301 apex to www. Never mix.
- [ ] Remove the Google Sites property once www is served by Pages.
- [ ] Google Search Console: verify the domain property, submit `https://sameer-goel.com/sitemap.xml`, watch Coverage for 2 weeks.
- [ ] Check old Stripe payment links: they are no longer linked from the home page, and the links themselves are untouched. Deactivating them is a separate decision.
