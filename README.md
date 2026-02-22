# devtools-log-popover

A floating dev tools log popover for React (web) and React Native. I build this
tool to be used a a DX improvement for my company. I do not intend on maintaining
this project fully, and if you'd like to make changes, I'd encourage you to fork it,
since I likely won't be paying much attention to issues/PRs.

## Installation

```bash
npm install devtools-log-popover
```

## Usage

```tsx
import { devLog, DevTools } from 'devtools-log-popover';

// Call anywhere in your app to add a log entry
devLog('User signed in', { userId: 'abc123' }, 'auth');

// Render once near the root of your app (wrap in a dev check if needed)
{process.env.NODE_ENV === 'development' && <DevTools title="Logs" />}
```

`devLog` is a no-op outside of `NODE_ENV=development`, so it is safe to leave in production builds.

### Props

| Prop     | Type                        | Description                                                        |
| -------- | --------------------------- | ------------------------------------------------------------------ |
| `title`  | `string`                    | Header text. Defaults to `"Logs"`.                                 |
| `users`  | `Record<string, UserEntry>` | Optional map of user IDs to metadata shown in the Users tab.       |
| `top`    | `number`                    | Distance from the top of the screen/viewport. Overrides `bottom`.  |
| `bottom` | `number`                    | Distance from the bottom (default: `128` native, `16` web).        |
| `left`   | `number`                    | Distance from the left edge. Overrides `right`.                    |
| `right`  | `number`                    | Distance from the right edge (default: `16`).                      |

### `devLog` signature

```ts
devLog(message: string, data?: unknown, category?: string): void
```

---

## Development

### Build the library

```bash
npm run build      # single build
npm run dev        # watch mode
```

The compiled output lands in `dist/`. Both example apps depend on `dist/` being present, so run this before starting either example for the first time (or after changing source files).

### Testing with the example apps

Two sample apps live in `examples/` for manual end-to-end testing.

#### React Web (`examples/web`)

Vite + React + TypeScript.

```bash
cd examples/web
npm install
npm run dev
```

Open the local Vite URL in a browser. Click the buttons on the page to generate log entries across several categories, then open the 🛠 popover in the bottom-right corner to verify:

- Logs appear with correct timestamps and category badges
- Category filter pills appear and filter correctly
- Entries with data are expandable
- Copy-to-clipboard works for individual entries and "Copy all"
- Clear removes all entries
- The panel is resizable by dragging the left, top, and top-left edges
- The Users tab shows the demo user metadata

#### React Native (`examples/native`)

Expo managed workflow.

```bash
cd examples/native
npm install
npx expo start
```

Press `i` for the iOS simulator or `a` for Android. Tap the buttons to generate log entries, then tap the 🛠 bubble to open the modal and verify:

- Logs appear with correct timestamps and category badges
- Horizontal filter bar scrolls and filters correctly
- Entries with data are expandable
- Clear removes all entries
- The Users tab shows the demo user metadata

> **Note:** If you change library source, run `npm run build` in the project root before restarting the example — Metro and Vite both read from `dist/`.

## Publishing

1. Log in to npm from the CLI

```
npm login
```

This opens a browser to authenticate. Run `npm whoami` afterward to confirm you're logged in.

2. Build the package

```
npm run build
```

This runs tsup and produces `dist/`. Double-check it's there:

```
ls dist/
# index.js index.mjs index.d.ts index.native.js
```

3. Verify what will be published

```
npm pack --dry-run
```

This lists every file that would be included. You should see only `dist/` files plus `package.json`, `README.md`, and `LICENSE`. If anything unexpected shows up (e.g. src/, examples/), add it to `.npmignore`.

4. Publish

```
npm publish
```

5. Verify it published

```
npm view devtools-log-popover
```

You should see your package metadata. It also appears on `npmjs.com/package/devtools-log-popover` within a minute or two.

6. Before you publish — quick checklist

- [ ] version in `package.json` is correct (0.1.0)
- [ ] `dist/` is up to date (`npm run build`)
- [ ] `README.md` exists and looks good
- [ ] `LICENSE` is present
- [ ] `npm pack --dry-run` shows no unexpected files
