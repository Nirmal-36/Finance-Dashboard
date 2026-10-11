# FinanceLens — Mobile (React Native)

The mobile client for FinanceLens, talking to the same FastAPI backend as the
web app. Built with the bare React Native Community CLI (not Expo), because
the planned Android Accessibility Service capture feature needs native module
support that Expo's managed workflow doesn't offer without ejecting.

## Feature scope (this pass)

Full feature parity with the web app's UI/API layer:

- **Auth** — signup, login, JWT access/refresh token handling with
  auto-refresh-on-401, logout (top-right of the Overview tab).
- **Overview (Dashboard)** — summary cards, balance trend chart, category
  breakdown donut (tap a slice to jump to filtered transactions), upcoming
  bills, cashflow heatmap, pull-to-refresh.
- **Transactions** — infinite-scroll list, debounced search, filter sheet
  (type/category), add/edit/delete (admin only).
- **Budgets** — month switcher, budget-vs-actual progress cards, set/edit a
  monthly limit per category (admin only).
- **Statements** — upload a PDF (PhonePe/GPay/Paytm/bank) via the native
  document picker, upload history with live status polling while a file is
  parsing/categorizing.
- **Devices** — register a device to get a long-lived API key (shown once),
  list/revoke devices. This only covers key management — the actual Android
  Accessibility Service capture module is **out of scope for this pass** by
  design, so these screens exist ahead of that feature landing.

Not yet built (intentionally deferred, same as the backend/web READMEs note):
AI categorization quality tuning, the Accessibility Service native module
itself, CSV/export (dropped on mobile — no share-sheet flow yet).

## Running it

```bash
npm install
npx react-native start        # Metro bundler, in one terminal
npx react-native run-android  # in another terminal, with an emulator/device up
```

### Pointing at the backend

`src/api/client.ts` hardcodes the backend URL:

```ts
const BASE_URL = 'http://10.0.2.2:8000/api/v1'
```

- **Android emulator**: `10.0.2.2` is the emulator's alias for your host
  machine's `localhost` — this is correct as-is if the backend runs on your
  dev machine via `localhost:8000` (e.g. the Dockerized Postgres + uvicorn
  setup from the backend README).
- **Physical device**: replace `10.0.2.2` with your machine's LAN IP (e.g.
  `192.168.1.42`), and make sure the device is on the same network and the
  backend's `CORS_ORIGINS` / host binding allows it.
- **iOS simulator**: `localhost` works directly, so swap in `localhost`
  instead of `10.0.2.2` if you build for iOS.

### Native setup

This project uses the standard RN 0.76+ autolinking (`settings.gradle` calls
`autolinkLibrariesFromCommand()`), so all native dependencies — gesture
handler, SVG (for charts), document picker, async storage, clipboard — wire
themselves into the Android Gradle build automatically. No manual
`MainActivity`/`MainApplication` edits were needed.

`App.tsx` imports `react-native-gesture-handler` as the very first line and
wraps the app in `GestureHandlerRootView` — both required by React
Navigation's native-stack navigator.

**Not verified in this environment**: there was no Android SDK/emulator
available in the sandbox this was built in, so `npx react-native run-android`
has not actually been run. What **is** verified: the project compiles clean
end-to-end (`npx tsc --noEmit`) and passes lint (`npx eslint src App.tsx`)
with zero errors. Run the actual Android build on your machine as the next
verification step.

## Architecture notes

- **State**: Zustand (`src/store/authStore.ts`), same shape as the web app.
- **API client**: Axios with an in-memory token cache layered over
  AsyncStorage (`src/api/client.ts`) — AsyncStorage is async-only, so the
  request interceptor reads from the in-memory cache for near-zero-latency
  auth headers, hydrated once at startup and kept in sync on every write.
- **Navigation**: React Navigation — a root stack that swaps between the
  `AuthNavigator` (Login/Signup) and `MainTabNavigator` (five bottom tabs)
  based on `authStore.isAuthed` (`src/navigation/AppNavigator.tsx`).
- **Charts**: `react-native-gifted-charts`, since Recharts (used on web)
  needs a DOM/SVG-in-browser environment that doesn't exist in RN.
- **File uploads**: RN's `FormData` accepts a `{uri, name, type}` object
  literal for a file picked via `react-native-document-picker`, unlike the
  browser's real `File`/`Blob` objects used on web — see
  `src/api/uploads.ts`.
- **No `<select>` in RN**: `src/components/ui/Select.tsx` is a custom
  Modal + FlatList bottom-sheet picker standing in for it everywhere a
  dropdown is needed.
- **Styling**: `StyleSheet.create()` against the design tokens in
  `src/theme/index.ts` — the same ink/paper/signal/amber/coral palette as the
  web app's Tailwind `@theme` block, just expressed as a plain JS object
  since RN has no CSS.

## Known bug class avoided proactively

The web app hit a real bug where `TransactionFormModal`'s account dropdown
stuck at an empty string because `useState(accounts[0]?.id ?? '')` only runs
its initializer once, before `accounts` loads asynchronously — causing a 422
on submit. The RN version of this form
(`src/components/transactions/TransactionFormModal.tsx`) resets its fields in
a `useEffect` keyed on `[visible, editing, accounts]` instead, specifically
to avoid the same stale-closure pattern. See the comment in that file.
