# Real-Time Flight Booking Platform

Live demo: deployable on Vercel as a static browser demo with the full booking flow.

## Vercel Web App

This repository includes a polished `SkyReserve` frontend for the flight booking simulator. The live demo runs fully in the browser with demo data for:

- Login and registration
- Flight search with dynamic prices
- Visual seat selection
- Booking and payment flow
- PNR/PIN confirmation
- QR-style ticket display
- PDF receipt download
- Basic admin flight management demo

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3001`.

Demo user:

- Email: `demo@bookmyflight.com`
- Password: `demo123`

Admin user:

- Email: `admin@bookmyflight.com`
- Password: `admin123`

### Build for Vercel

```bash
npm run build
```

Vercel settings are captured in `vercel.json`:

- Framework preset: `Other`
- Build command: `npm run build`
- Output directory: `dist`
