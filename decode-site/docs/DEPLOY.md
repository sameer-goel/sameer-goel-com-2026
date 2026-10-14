# Deploying (read github_deploy_playbook.md in the site repo first)

The live project `sameergoel` is Cloudflare Pages DIRECT UPLOAD. Every deploy replaces the WHOLE site.
So never upload `out/` alone. Always upload the merged bundle:

1. `npm run build`
2. Start from the legacy repo `sameer-goel/sameer-goel-com-2026` (main).
3. Keep these untouched: `anthropic-certifications/`, `forward-deployed-engineer/`, `functions/`, `previews/`, `portfolio-assets/`, `robots.txt`.
4. Remove legacy `index.html`, copy `out/` on top.
5. `sitemap.xml`: insert new URLs only (script asserts nothing is lost). `llms.txt` and `_redirects`: append only.
6. Do NOT ship `resume-source/` (private material).

## Staging (preview, never production)
```bash
npx wrangler pages deploy ./stage --project-name sameer-goel-staging --branch staging
```
Preview URLs on a non-production branch are served with `X-Robots-Tag: noindex` by Cloudflare.
`functions/` is excluded from staging so the magic-link email function cannot send real email.

## Production (only after explicit approval)
Needs a token with Pages Edit on the account that owns project `sameergoel` (account 8db390f5...).
```bash
npx wrangler pages deploy ./stage --project-name sameergoel --branch main
```
Rollback: Cloudflare dashboard > Pages > sameergoel > Deployments > previous deployment > "Rollback to this deployment". The full backup zip of the current live site is also kept.

## Vercel alternative
Static export works anywhere: set output directory to the merged bundle. Redirects in `_redirects` would need converting to `vercel.json`.
