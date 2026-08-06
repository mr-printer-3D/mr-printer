# MR. Printer — Premium 3D Printing Studio

Award-winning premium website for [MR. Printer](https://github.com/mr-printer-3D) — a 3D printing studio based in Baner, Pune, Maharashtra.

## Tech Stack

- Next.js 16 · TypeScript · Tailwind CSS
- Framer Motion · GSAP · Three.js · React Three Fiber
- Lenis Smooth Scroll · Lucide Icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Links

- **GitHub:** [github.com/mr-printer-3D](https://github.com/mr-printer-3D)
- **Instagram:** [@mr_printer.in](https://www.instagram.com/mr_printer.in/)
- **Email:** mrmr.printer@gmail.com
- **Phone / WhatsApp:** +91 86248 80423

## Project Structure

```
app/           → Pages & routing
components/    → UI, layout, home sections, 3D, products
lib/           → Constants, products catalog, animations
hooks/         → Custom React hooks
public/        → Images & static assets
public/studio/ → Mr. Printer Studio tools (Pricing Calculator, more later)
types/         → TypeScript interfaces
```

## Mr. Printer Studio (main app)

The marketing website homepage is turned off. This deploy is **Mr. Printer Studio** (internal tools).

| URL | Tool |
|-----|------|
| `/` | Studio home — all tools |
| `/tools/pricing` | Pricing Calculator |

**Branches**
- `main` — live Studio
- `tool/pricing` — Pricing Calculator work
- `tool/<name>` — future tools

Live (after deploy):
- Studio: https://mr-printer.vercel.app/
- Pricing: https://mr-printer.vercel.app/tools/pricing
