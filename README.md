# 👑 Princess Subtraction — Rescue the Princess!

A bite-sized math adventure for kids. Solve vertical subtraction problems (with regrouping/borrowing) to collect keys, cross a magic bridge, dodge a dragon, and reach the castle tower.

Deployed at: **https://princess-subtraction.netlify.app**

---

## 🎮 Gameplay

- **Goal:** Get **3 keys** and reach the **Castle Tower** (tile 10)
- **Board:** 11 tiles (0 → 10) with special tiles:
  - 🐉 **Dragon Guard** — answer one extra problem to keep going
  - ✨ **Magic Bridge** — answer quickly for a **speed bonus**
  - 🏰 **Finish** — reach the tower; win with 3 keys
- **Problems:** Subtraction, typically 2–3 digits, often requires **regrouping**
- **Timer:** Optional 60s timer to encourage focus (and bonus on the bridge)
- **Scoring/Progress:**
  - ✅ Correct → move forward (+1 by default; **+2** if bridge is armed and you answer fast)
  - ❌ Incorrect on a special tile → back to start
  - ❌ Incorrect on a normal tile → move back one
  - 🔑 Each correct answer gives a key (max 3)

**Keyboard shortcuts**

- **Enter** → Check answer
- **Esc** → Draw a new card
- Numeric input filters non-digits automatically

---

## ✨ Features

- Colorful board with playful animations (bounce, sparkle, pulse)
- Kid-friendly copy and large tap targets
- Tailwind v4 design tokens with **light/dark** theme support
- Deterministic constraints that prefer **regrouping** problems
- Accessible live region for game messages (announcement friendly)

---

## 🧱 Tech Stack

- **Next.js 14** (App Router) + **React 18**
- **Tailwind CSS v4** + custom theme tokens + `tw-animate-css`
- **Radix UI** ecosystem compatibility (no hard deps required to run)
- No backend required (pure client-side)

> If you’re using this repo locally, the `package.json` defaults to Turbopack for dev. For CI/hosting (Netlify), use the standard `next build` unless you’ve confirmed Turbopack compatibility in your environment.

---

## 🚀 Local Dev

```bash
# install
npm i

# start dev server (Turbopack)
npm run dev

# lint
npm run lint

# production build
npm run build

# run production server
npm start

```

## 📄 License

MIT — do good things and have fun learning math.
