# Cloudflare Pages Deployment

This repository is prepared for Cloudflare Pages with a Vite frontend and Pages Functions under `/functions`.

## Dashboard setup

When importing the GitHub repository:

- Repository: `addvaluewithai-hub/booking-wizard-ai-salesman`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

The `public/_redirects` file provides SPA routing fallback for dedicated niche routes.

## Gemini secret — important

The GitHub repository secret named `GEMINI_API_KEY` is useful for GitHub Actions, but **Cloudflare Pages direct Git integration does not automatically receive GitHub Actions secrets at runtime**.

After the Pages project is created:

1. Open the Pages project in Cloudflare.
2. Go to **Settings → Variables and Secrets**.
3. Add `GEMINI_API_KEY`.
4. Mark/encrypt it as a secret.
5. Configure it for **Production**.
6. Configure it for **Preview** too, so PR preview URLs can exercise the AI.
7. Redeploy after adding/changing the secret.

The server function reads it from `context.env.GEMINI_API_KEY`.

Never create a `VITE_GEMINI_API_KEY`; Vite-prefixed values are client-exposed.

## Pages Functions

Cloudflare automatically turns files in root `/functions` into server routes.

Current route:

- `GET /api/salesman` — health metadata, no generation
- `POST /api/salesman` — server-side Gemini/Gemma generation with model fallback

Planned routes are documented in `docs/ARCHITECTURE.md`.

## Preview workflow

Cloudflare Pages can create preview deployments for pull requests.

Recommended autonomous-agent workflow:

1. create branch for phase/task group
2. push implementation
3. open PR
4. wait for Cloudflare preview
5. test preview at real URL on desktop/mobile
6. fix visual/functional issues
7. run checks
8. merge to `main`
9. production automatically redeploys

This lets us treat preview URLs as the visual QA loop.

## Build verification locally

```bash
npm install
npm run check
npm run build
```

The final static app should be in `dist/`.

## Runtime verification after first deployment

Check:

```text
/
/hpl
/yachts
/law-firms
/api/salesman
```

`GET /api/salesman` should return JSON identifying the configured model chain without exposing the key.

Then test a POST generation request from the actual frontend.

## Recommended later bindings

Not required for first preview:

- D1 binding for leads + anonymized conversion events
- optional KV for client/config cache
- Turnstile for public lead endpoints if abuse appears

Do not introduce persistent visitor memory until privacy behavior is designed.

## Performance notes

- code split heavy niche experiences when they become substantial
- optimize and pre-size all real images
- do not block initial paint on Gemini
- salesman can hydrate/observe after page becomes interactive
- AI failure should not break the host page

## Official Cloudflare references

- Pages Functions: https://developers.cloudflare.com/pages/functions/
- Pages Functions bindings/secrets: https://developers.cloudflare.com/pages/functions/bindings/
- Vite Pages deployment: https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/
