# Text the Check — Instagram Reel Showreel

A clean, minimal showreel built with [Remotion](https://remotion.dev) for showcasing the **Text the Check** app on Instagram Reels.

---

## What this does

- **Format:** 1080×1920 (Instagram Reels / vertical video)
- **Duration:** 18 seconds at 30fps
- **Animations:** position, scale, rotation, opacity — nothing complex
- **Structure:** Intro → 4 app screens → Outro

### Timeline breakdown

| Section    | Time      | Animation        |
|------------|-----------|------------------|
| Intro      | 0–3s      | Spring in + fade |
| Screen 1   | 3–6s      | Slide up         |
| Screen 2   | 6–9s      | Scale up         |
| Screen 3   | 9–12s     | Slide from right |
| Screen 4   | 12–15s    | Fade + rotate    |
| Outro      | 15–18s    | Spring in + fade |

---

## Quick start

### 1. Install dependencies

Make sure you have **Node.js 16+** installed, then:

```bash
npm install
```

### 2. Open the Remotion Studio (live preview)

```bash
npm run dev
```

This opens a browser window where you can scrub through your video frame by frame.

### 3. Render the final video

```bash
npm run build
```

This exports `out/showreel.mp4` — ready to upload to Instagram.

---

## How to swap in your real screenshots

Right now the project uses **placeholder UI** (colored rectangles with fake elements). Here's how to replace them with actual screenshots:

### Step 1: Add your screenshots

Drop your PNG/JPG screenshots into the `public/screenshots/` folder:

```
public/
  screenshots/
    screen1.png
    screen2.png
    screen3.png
    screen4.png
```

### Step 2: Update ScreenSlide.tsx

In `src/components/ScreenSlide.tsx`, find the placeholder block (marked with comments) and replace it with:

```tsx
import { Img, staticFile } from "remotion";

// Inside the phone screen div, replace the placeholder with:
<Img
  src={staticFile(`screenshots/${screenshotFile}`)}
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }}
/>
```

Then add a `screenshotFile` prop to the component and pass it from `Showreel.tsx`.

### Step 3: Update Showreel.tsx

Pass the filename to each ScreenSlide:

```tsx
<ScreenSlide
  animation="slideUp"
  label="Home Screen"
  bgColor="#1A6B4F"
  description="Quick bill splitting"
  screenshotFile="screen1.png"
/>
```

---

## Project structure

```
src/
  index.ts              → Entry point (registers Remotion root)
  Root.tsx              → Composition definition (dimensions, fps, duration)
  Showreel.tsx          → Main timeline — sequences all slides
  components/
    IntroSlide.tsx      → Opening title animation
    ScreenSlide.tsx     → Phone mockup with 4 animation types
    OutroSlide.tsx      → Closing screen with CTA
public/
  screenshots/          → Drop your app screenshots here
remotion.config.ts      → Remotion settings
```

---

## Customization cheat sheet

| Want to change...       | Edit this file         | Look for...                  |
|-------------------------|------------------------|------------------------------|
| Video dimensions/fps    | `src/Root.tsx`         | `width`, `height`, `fps`     |
| Total duration          | `src/Root.tsx`         | `durationInFrames`           |
| Section timing          | `src/Showreel.tsx`     | `SECTION_DURATION`           |
| Background color        | `src/Showreel.tsx`     | `BG_COLOR`                   |
| Animation style         | `ScreenSlide.tsx`      | `animation` prop             |
| Screen accent colors    | `src/Showreel.tsx`     | `bgColor` prop               |
| App name / tagline      | `IntroSlide.tsx`       | Text strings                 |
| CTA / handle            | `OutroSlide.tsx`       | Text strings                 |
| Animation speed/bounce  | Any component          | `spring()` config values     |

---

## Key Remotion concepts used

- **`useCurrentFrame()`** — gives you the current frame number (like a timeline playhead)
- **`interpolate()`** — maps a range of frames to a range of values (like After Effects keyframes)
- **`spring()`** — physics-based animation (natural bounce/ease)
- **`<Sequence>`** — offsets a section in time (like placing a clip on a timeline)
- **`Easing`** — custom easing curves (like AE's graph editor)

---

## Tips

- Use **Easy Ease** equivalent: `spring()` with higher `damping` (less bounce)
- The `extrapolateLeft/Right: "clamp"` on interpolate prevents values from overshooting
- Instagram Reels can be up to 90 seconds — adjust `durationInFrames` in Root.tsx if you want longer
