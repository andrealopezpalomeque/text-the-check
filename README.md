# text the check

Tu compañero financiero por WhatsApp. Manejá tu plata con amigos o en lo personal — todo en un mensaje.

## What is Text the Check?

Text the Check is a WhatsApp-first financial companion built for Argentina and Latin America. It has two modes under one brand:

- **Viajes / Grupos** — Split expenses with friends during trips. Track who owes whom.
- **Mis Finanzas** — Track personal bills, recurring payments, and daily spending with AI insights.

## Project Structure

```
text-the-check/
├── client/              # Nuxt.js 3 frontend (landing page)
│   ├── assets/css/      # Tailwind + custom theme tokens
│   ├── components/      # Vue components (Header, Hero, Modes, CTA, Footer, ThemeToggle)
│   ├── composables/     # useTheme (dark/light mode)
│   ├── layouts/         # Default layout
│   ├── pages/           # Landing page
│   └── public/img/      # Logo variants (SVG + PNG)
├── server/              # Express.js backend (placeholder)
└── firebase.json        # Firebase Hosting config
```

## Tech Stack

- **Frontend**: Nuxt.js 3 + Tailwind CSS + Vue 3
- **Backend**: Express.js on Render (placeholder health endpoint)
- **Deployment**: Firebase Hosting → `textthecheck.app`
- **Fonts**: Outfit (wordmark), Nunito (headings), DM Sans (body)

## Getting Started

### Client (Nuxt)

```bash
cd client
npm install
npm run dev
```

Opens at `http://localhost:3000`

### Server (Express)

```bash
cd server
npm install
npm start
```

Runs on `http://localhost:3001`

## Build & Deploy

```bash
# Build static site
cd client
npm run generate

# Deploy to Firebase Hosting
cd ..
firebase deploy --only hosting
```

The static output goes to `client/.output/public`, which Firebase serves at `textthecheck.app`.

## Brand

- **Domain**: [textthecheck.app](https://textthecheck.app)
- **Instagram**: [@textthecheck](https://instagram.com/textthecheck)
- Dark mode by default, light mode supported
- Wordmark: "text the check" — always lowercase, Outfit font, "the" accented in brand blue

## Authors

- Andrea López Palomeque
- Imanol Corimayo
