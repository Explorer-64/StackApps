# StackApps

StackApps is a discovery and proof layer for indie, browser-ready PWA SaaS: a curated public directory (“The Stackhouse”) where builders can list apps and, when live-approved, receive crawler-visible trust surfaces like a server-rendered listing backlink, an embeddable “StackApps Verified” badge, and a site readiness scan for search + AI crawler signals. StackApps is the channel and credibility layer — it is not the business tool itself.

For the long-term strategy and product framing, see `VISION.md`.

## Tech stack

- **Frontend**: React + TypeScript + Vite
- **Auth/Data/Storage**: Firebase Auth + Firestore + Storage
- **Backend**: FastAPI (Python) on Cloud Run
- **Hosting**: Firebase Hosting

## Running locally

### Environment variables

Frontend (`client/.env.example` → copy to `client/.env.local`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Backend (copy `.env.example` → `.env.local` or export in your shell):

- `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string of a Firebase Admin service account key)
- `GOOGLEAI_API_KEY` (Gemini API key)
- `GOOGLE_SAFE_BROWSING_API_KEY`

Notes:

- Admin emails are **hardcoded** in `firestore.rules` and `client/src/lib/admins.ts` (and should be replaced before deploying).
- The backend reads `GOOGLEAI_API_KEY` (some teams name this `GEMINI_API_KEY` in their own deployments; keep the variable name aligned with code unless you intentionally change it).

### Install + run

```bash
npm install
npm run dev
```

## Deploying

Build then deploy hosting:

```bash
npm run build
firebase deploy --only hosting
```

## Strategic context

See `VISION.md`.

