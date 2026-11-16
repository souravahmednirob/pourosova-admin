# কালিয়াকৈর পৌরসভা – নাগরিক রেশন সেবা (Admin Portal)

Next.js (App Router) + TypeScript + Tailwind v4 front-end for the Kaliakair Pourashava citizen ration portal.
Phase-by-phase build; this repository currently ships a browser-side mock data layer (zustand + localStorage) so the whole flow works without a backend. Swap `src/store/data.ts` for API calls when the backend lands.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000  → /admin
```

Demo accounts (password `admin123`): `super@kaliakair.gov.bd` (TOTP demo code 123456), `admin@kaliakair.gov.bd`, `officer@kaliakair.gov.bd`, `viewer@kaliakair.gov.bd`.

## Routes

- `/admin` – staff portal (login at `/admin/login`)
- `/citizen` – citizen web app (later phase)

## Design

"Future Civic": porcelain · petrol · copper · sage palette, aurora mesh background, glass surfaces, Hind Siliguri + Space Grotesk, Bangla numerals everywhere, light & dark themes, reduced-motion aware.
