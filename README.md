# কালিয়াকৈর পৌরসভা – নাগরিক রেশন সেবা (Admin Portal)

Next.js (App Router) + TypeScript + Tailwind v4 front-end for the Kaliakair Pourashava citizen ration portal.
Phase-by-phase build; this repository currently ships a browser-side mock data layer (zustand + localStorage) so the whole flow works without a backend. Swap `src/store/data.ts` for API calls when the backend lands.

## Run

```bash
yarn install
yarn dev        # http://localhost:3000  → /admin
```

Demo accounts (password `admin123`): `super@kaliakair.gov.bd` (TOTP demo code 123456), `admin@kaliakair.gov.bd`, `officer@kaliakair.gov.bd`, `viewer@kaliakair.gov.bd`.

## Routes

- `/admin` – staff portal (login at `/admin/login`)
- `/agent` – field-agent web app (login `agent1@kaliakair.gov.bd` / `agent123`): 4-step registration, own submissions only, works offline (installable PWA; the service worker is active in `yarn build && yarn start`)
- `/citizen` – citizen web app (next phase)

## Design

"Future Civic": porcelain · petrol · copper · sage palette, aurora mesh background, glass surfaces, Hind Siliguri + Space Grotesk, Bangla numerals everywhere, light & dark themes, reduced-motion aware.
