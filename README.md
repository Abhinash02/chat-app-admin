# Vibe Chat — Admin Panel

React control centre for the Vibe chat app. Pricing, colours, moderation,
payments and outreach all change from here, live, without a release.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:5000`, so start the backend
first and sign in with the bootstrap admin that `npm run seed` prints there.

For a deployed build set `VITE_API_URL` to the API origin; leave it empty to use
the proxy locally.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | oxlint |

## What each page does

| Page | Purpose |
| --- | --- |
| **Dashboard** | Users, messages, revenue, coin economy and what needs attention. Refreshes itself. |
| **Users** | Search and filter everyone. Open an account for its wallet, ledger, purchases and devices — and to suspend, reactivate, adjust coins or sign it out everywhere. |
| **Reports** | The moderation queue, with the reported messages captured at the time they were reported. |
| **Pricing & coins** | Coin packs, and the rules behind them — free minutes, messages per charge, daily bonus. |
| **Payments** | Razorpay settles itself; UPI transfers wait here for you to confirm the money arrived. |
| **Campaigns** | Push notifications and promotional email, with audience targeting and previews. |
| **Appearance** | Themes. Pick one, press *Make live*, and connected apps re-colour immediately. |
| **Settings** | Chat, discovery, rooms, games, moderation and payment configuration. |
| **Audit log** | Every privileged action, permanently. |

## A few decisions worth knowing

**The panel does not follow the app's theme.** An operator's tools should not
change colour when they recolour the product. The app's live palette appears
inside a phone-shaped preview on the Appearance page instead — swatch grids
cannot answer "is this text still readable on that background", but a mock of
the real chat screen can.

**Every destructive action confirms, and the confirm button names the action.**
"Suspend account" and "Approve and credit coins" rather than "OK": the button
text is the last thing read before it happens.

**Sections save independently.** The settings API is partial by design, so
fixing a UPI ID does not re-submit every unrelated value on the page.

**Errors show the server's own message.** The API already writes user-facing
copy; replacing it with "Something went wrong" throws away the useful part.

**Campaign HTML renders in a sandboxed iframe.** It is authored to run inside a
mail client, and dropping it into this document would let its styles and any
script escape into the panel.

## Structure

```
src/
├── main.jsx · App.jsx      Providers · routes (lazily loaded)
├── lib/                    API client with token refresh, formatting, sockets
├── hooks/                  Auth context and every React Query hook
├── components/
│   ├── ui/                 Buttons, fields, tables, modals, feedback states
│   ├── layout/             Sidebar shell and page header
│   ├── ThemePreview.jsx    The phone mock on the Appearance page
│   └── CampaignComposer.jsx
└── pages/                  One file per screen
```

Query keys live in one place (`hooks/queries.js`) so an invalidation cannot miss
a cache entry because two files spelled a key differently.

## Sessions

Access tokens are short-lived, so expiry mid-session is normal rather than
exceptional. The API client refreshes once per request and retries; concurrent
401s share a single refresh promise, because refresh tokens rotate on use and
five parallel refreshes would look like token theft and revoke the whole
session.

A stored session is re-validated against the server before the shell renders —
trusting localStorage alone would flash the panel to someone whose access was
already withdrawn.
