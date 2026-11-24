# Al-Wakeel Al-Shamel OMS — Android app

React Native (Expo SDK 58) app for the same backend as the website. One sign-in screen;
after login each role gets its own tabs:

| Role | Screens |
|---|---|
| Customer | Shop (search, categories, sort), product details, cart, checkout (cash / card), order confirmation, my orders with status tracker, invoice + PDF share, profile |
| Retail Salesperson | Sales dashboard, orders (filter, search, change status), profile |
| Warehouse Manager | Warehouse dashboard (low stock, activity), inventory (receive stock, stock check, history), product catalog, profile |
| Admin | Dashboard, orders (change status, view invoice), products (add / edit / delete), customers, sales reports, profile |

## Which server the app talks to

Set in `src/config.js`:

- **Development** (`npx expo start`): `http://10.0.2.2:8080` — the backend running on this PC, as seen from the Android emulator.
- **Release builds**: `https://oms-api-23gt.onrender.com`.
- Override either with `EXPO_PUBLIC_API_URL`, e.g. a real phone on the same Wi-Fi:
  `EXPO_PUBLIC_API_URL=http://192.168.0.6:8080 npx expo start`

The current server is shown at the bottom of the Profile screen.

## Run locally

1. Start the database and backend (from the repo root):
   ```powershell
   docker compose up -d postgres mailpit
   cd backend/Oms.Api
   $env:PORT=8080; dotnet run --no-launch-profile
   ```
2. Start the app (from `mobile/`):
   ```powershell
   npm install
   npx expo start --android
   ```
   This opens the app in Expo Go on a running emulator. On a real phone, install **Expo Go**
   from the Play Store and scan the QR code.

Demo logins are listed in the root `README.md`.

## Build an installable APK

Uses Expo's free cloud build service (EAS), so nothing heavy is built on this PC:

```powershell
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

When it finishes, EAS gives a download link for the `.apk`. The `preview` profile points
the app at the Render API (see `eas.json`). Use `--profile production` for a Play Store
`.aab` bundle.

## Project layout

```
App.js                      providers + navigation container
src/config.js               API URL
src/api/                    axios client (JWT header, 401 → sign out), useApi hook
src/context/                Auth (SecureStore), Cart (per user, AsyncStorage), Currency
src/navigation/             role-based tabs/stacks
src/screens/auth|customer|common|staff|admin
src/components/ui.js        shared UI pieces
src/utils/                  validation (same rules as the website), formatting, images
```
