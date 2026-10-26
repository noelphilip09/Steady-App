# Steady — housing stability platform

Three apps for a dignity-centred housing stability program in Sydney, each with its own sign-in and URL, all working on **one live, shared dataset**:

| App | URL | Sign-in | Who |
| --- | --- | --- | --- |
| **Couch Surfer** (iPhone-style app) | `/couchsurfer/` | `/couchsurfer/login` | Young people looking for a short, supported stay |
| **Host** (iPhone-style app) | `/host/` | `/host/login` | Verified hosts offering a spare room |
| **Insights dashboard** (web) | `/dashboard/` | `/dashboard/login` | Government staff: viewer, analyst, administrator |

Accept a request in the Host app and it appears on the couch surfer's phone within a second, with a notification; the dashboard recalculates from the same records. Accounts created through the apps' onboarding are real accounts on the server.

> Everything in the dataset is simulated demo data. No real identity verification, payment, government approval or housing outcome is implied.

## Run it

Requires Node 18 or newer. There are no npm dependencies.

```bash
npm start
```

Then open <http://localhost:8787>. The first start seeds the dataset and the demo accounts.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `STEADY_DATA_DIR` | `server/data` | Where `state.json`, `accounts.json` and `sessions.json` live (point this at a persistent disk in production) |
| `STEADY_DEMO_PASSWORD` | `steady-demo` | Password for the seeded demo accounts |
| `COOKIE_SECURE` | auto | Force `Secure` session cookies on (`1`) or off (`0`); auto follows `X-Forwarded-Proto` |

Other scripts:

```bash
npm run dev            # restart the server when files in server/ change
npm run seed           # rebuild the dataset from the seed (keeps accounts); stop the server first
npm run users -- list  # list accounts
npm run users -- add dashboard jane@agency.gov.au 'a-strong-password' --name "Jane Citizen" --role analyst
npm run users -- add host sam.host@example.com 'a-strong-password' --name "Sam Host"
npm run users -- passwd couchsurfer jordan@steady.demo 'new-password'
```

### Demo accounts

All use the password `steady-demo` unless `STEADY_DEMO_PASSWORD` is set.

| App | Email | Notes |
| --- | --- | --- |
| Couch Surfer | `jordan@steady.demo` | Returning member with a verified stay and an active membership |
| Couch Surfer | `sam@steady.demo` | New member; has a request waiting with Priya |
| Couch Surfer | `mia@steady.demo` | Completed a stay and moved to a private rental |
| Host | `priya@steady.demo` | Approved host in Marrickville with one pending request |
| Host | `marcus@steady.demo` | Approved host in Glebe |
| Dashboard | `viewer@steady.demo` | Standard report only |
| Dashboard | `analyst@steady.demo` | Filters, comparisons, exports |
| Dashboard | `admin@steady.demo` | Edits assumptions; can view as any role |

New couch surfer and host accounts are created inside each app's onboarding ("I'm new: create an account" / "Become a host"). Dashboard accounts are provisioned with `npm run users`.

## How it is built

```
apps/
  landing/      the front page linking the three apps
  couchsurfer/  index.html (app shell + skeleton), login.html, tpl.json (compiled screens), manifest
  host/         same
  dashboard/    same
  demo/         the connected demo: both phones and the dashboard on one screen (needs a dashboard sign-in)
shared/
  css/          steady.css (design system), site.css, app.css (skeletons, lazy images, live indicator, sign-in pages)
  js/           core.js (all product logic and the seeded dataset), runtime.js (Preact renderer for the compiled
                templates), steady-live.js (accounts, registration, live sync), steady-boot.js, steady-login.js
  img/ icons/   illustrations, portraits, app icons
server/
  index.js      HTTP server: static apps, per-app sessions, JSON API, Server-Sent Events
  auth.js       scrypt password hashing, cookie sessions, login rate limiting
  store.js      atomic JSON-file persistence
  core-node.js  loads core.js in Node to seed and repair the dataset with the apps' own logic
  users.js      account CLI · seed.js re-seeds the dataset
```

**Dynamic data.** The product logic runs in the browser (`core.js`, shared by all three apps). The server keeps the dataset, authenticates each app separately (one httpOnly cookie per app, so one browser can be signed in to all three), and broadcasts every change over Server-Sent Events. A client pushes only the collections whose content changed; others merge the patch into their state and surface new notifications addressed to the signed-in user as toasts. Reconnects and tab focus trigger a resync by revision.

**Per-user identity.** The original prototype hard-coded one demo couch surfer and one demo host. The core now resolves the signed-in participant or host (`csId()` / `hostId()`), notifications carry the recipient's id, and new accounts get their own records created with the same factories the seed uses.

**Loading.** Each app paints an in-layout skeleton immediately, then loads the runtime, its template and the shared state in parallel and cross-fades in. Images are lazy-loaded and fade in when decoded. Dashboard figures show a shimmer while a filter recalculates.

**Animations.** Screen transitions, sheets, toasts, tab bars, KPI count-ups and the ID-scan sequence are the design system's own; conditional blocks are keyed so each navigation mounts fresh nodes and the entrance animations replay. `prefers-reduced-motion` is respected throughout.

## API (same origin, JSON)

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/:app/login` | `{ email, password }` → sets the app's session cookie |
| `POST` | `/api/:app/register` | Couch Surfer and Host only: `{ email, password, name?, phone? }` |
| `POST` | `/api/:app/logout` | |
| `GET`/`PATCH` | `/api/:app/me` | Current account; `PATCH { name }` |
| `GET` | `/api/:app/state` | `{ rev, dayOffset, db }` |
| `PATCH` | `/api/:app/state` | `{ clientId, db: { collection: value, … }, dayOffset? }` |
| `POST` | `/api/:app/state/reset` | Re-seed the dataset (accounts and their records are kept) |
| `GET` | `/api/:app/events` | Server-Sent Events: `hello`, `patch`, `reset`, `presence` |
| `GET` | `/api/health` | |

`:app` is `couchsurfer`, `host` or `dashboard`. This is a prototype trust model: any signed-in client may update the shared records.

## Deploying

The server is plain Node with no build step, so any Node or Docker host works. Set `PORT` if the platform requires it, and give `STEADY_DATA_DIR` a persistent disk so accounts and records survive restarts. Behind a TLS-terminating proxy (every platform below), cookies are marked `Secure` automatically from `X-Forwarded-Proto`.

### Render (one click, free tier)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/noelphilip09/Steady-App)

1. Click the button and sign in to Render with GitHub. It reads `render.yaml` and creates the `steady-app` web service.
2. Wait for the first deploy (about two minutes). Your apps are at `https://steady-app.onrender.com/couchsurfer/`, `/host/` and `/dashboard/` (Render may add a suffix to the name).

Free-tier notes: the service sleeps after 15 minutes without traffic and takes 30 to 60 seconds to wake; the filesystem is ephemeral, so accounts created in the apps and any changes to the shared records reset on each restart or deploy (demo accounts are re-seeded). For persistence, switch the plan to Starter and enable the disk block in `render.yaml`.

### Fly.io (persistent volume)

```bash
fly launch --copy-config --no-deploy
fly volumes create steady_data --size 1
fly deploy
```

### Docker (any VPS)

```bash
docker build -t steady-app .
docker run -d --name steady -p 80:8787 -v steady-data:/data steady-app
```

Railway, Koyeb and similar hosts pick up the `Dockerfile` or `Procfile` automatically; add a volume and point `STEADY_DATA_DIR` at it.

To give each app its own hostname, point three hostnames at the same service and link to `/couchsurfer/`, `/host/` and `/dashboard/`.
