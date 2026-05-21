# Split & Settle 모임 — Split without the stress

A friendly bill-splitting app built with React + Vite. No awkward conversations, no mental math.

## Features
- **Groups** — create groups for trips, birthdays, apartments, anything
- **Import transactions** — simulate importing from KakaoPay / Toss (prototype mode)
- **Manual entry** — add any expense in seconds
- **Debt simplification** — algorithm collapses multiple expenses into minimum transfers
- **Status labels** — Unsettled / Settling / Done (friendly, not blame-y)
- **Settle up** — step-by-step payment flow with KakaoPay deep-link placeholder
- **Progress bar** — see how close your group is to fully settled
- **Celebration** — confetti when everyone's all square 🎉

## Tech stack
- React 18 + Vite 5
- React Router v6
- No external UI library — custom CSS design system
- gh-pages for deployment

---

## Local development

```bash
npm install
npm run dev
# → opens at http://localhost:5173
```

---

## Deploy to GitHub Pages

### 1. Update your username in two places

**package.json** — change `YOUR_GITHUB_USERNAME`:
```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/split-and-settle"
```

**vite.config.js** — the base is already set to `/split-and-settle/`. If you rename the repo, update this too.

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/split-and-settle.git
git branch -M main
git push -u origin main
```

### 3. Deploy

```bash
npm run deploy
```

Your app will be live at:
```
https://YOUR_USERNAME.github.io/split-and-settle
```

### 4. Future updates

```bash
# make your changes, then:
git add .
git commit -m "your message"
git push
npm run deploy
```

---

## Project structure

```
src/
├── components/
│   ├── Home.jsx          ← group list + net balance
│   ├── GroupView.jsx     ← expense list + progress bar
│   ├── AddExpense.jsx    ← manual entry + simulated import
│   ├── SettleUp.jsx      ← debt simplification + payment flow
│   ├── NewGroup.jsx      ← create a group
│   ├── Activity.jsx      ← full expense history
│   ├── BottomNav.jsx     ← navigation bar
│   └── Avatar.jsx        ← reusable avatar component
├── data/
│   └── seed.js           ← demo groups, users, expenses
├── utils/
│   └── debt.js           ← simplifyDebts() algorithm + helpers
├── AppContext.jsx         ← global state (React Context)
├── App.jsx               ← routing
├── main.jsx              ← entry point
└── index.css             ← design system (CSS variables + classes)
```

---

## Customising

**Change demo data** → edit `src/data/seed.js`

**Add a real user** → add to the `USERS` object in `seed.js`

**Change colors** → edit CSS variables at the top of `index.css`

**Add a screen** → create `src/components/YourScreen.jsx`, add a `<Route>` in `App.jsx`

---

Built for the ShardLab Product Intern Challenge.
