# Merrill Girls Wrestling Athlete Development Platform

A phone-first athlete-development web app for Merrill Girls Wrestling. The app includes Today's 1%, the live Practice Board, Before and After Practice, the Five Cs, the Merrill performance Pillars, YOU University, Competition Mode, Reset Sweep, Confidence Bank, My Wrestling, Team Wins, coach tools, and program administration.

This repository is configured to publish through **GitHub Pages using GitHub Actions**. Athletes and coaches visit a normal website. They do not need GitHub accounts.

## Fastest GitHub Pages deployment

1. Create a new GitHub repository, for example `merrill-girls-wrestling`.
2. Extract this ZIP and upload **the contents of this folder** to the repository's `main` branch.
3. Open **Settings > Pages** in GitHub.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Open the **Actions** tab and allow the `Deploy Merrill Girls Wrestling to GitHub Pages` workflow to finish.
6. GitHub will show the public Pages address, usually:

   `https://YOUR-GITHUB-NAME.github.io/merrill-girls-wrestling/`

The workflow detects the repository name, sets the correct Vite base path, builds the project, and publishes `dist` automatically.

## Required Firebase setup for live sign-in and saved data

GitHub Pages hosts the app files. Firebase still provides Authentication and Firestore.

### 1. Add the Pages domain to Firebase Authentication

In Firebase Console, open:

**Authentication > Settings > Authorized domains**

Add the hostname only, for example:

`YOUR-GITHUB-NAME.github.io`

Also add a custom domain later if one is connected to GitHub Pages.

### 2. Enable a sign-in provider

In Firebase Console, open:

**Authentication > Sign-in method**

Enable Google, Email/Password, or both. The current interface supports both.

### 3. Create Cloud Firestore

Create the Firestore database for project:

`merrill-girls-wrestling`

Use production mode. The included `firestore.rules` will replace the temporary default rules when deployed.

### 4. Deploy Firestore rules and indexes

On a trusted computer with Node.js installed:

```bash
npm install
npx firebase-tools login
npx firebase-tools use merrill-girls-wrestling
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Do not weaken the rules to make sign-in easier. The Practice Board and private athlete data are intentionally stored separately.

### 5. Seed the program content and bootstrap the first administrator

Use a Firebase service-account JSON file only on your trusted computer. Never upload it to GitHub and never place it in the browser app.

macOS/Linux example:

```bash
export FIREBASE_SERVICE_ACCOUNT_PATH="/private/path/service-account.json"
npm run seed:project
npm run bootstrap:admin -- --email "YOUR_ADMIN_EMAIL" --name "YOUR NAME"
```

Windows PowerShell example:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT_PATH="C:\private\service-account.json"
npm run seed:project
npm run bootstrap:admin -- --email "YOUR_ADMIN_EMAIL" --name "YOUR NAME"
```

If the administrator has not signed in with Google yet, the bootstrap script can create an Email/Password account when run from your own terminal:

```bash
npm run bootstrap:admin -- --email "YOUR_ADMIN_EMAIL" --name "YOUR NAME" --temporary-password "CHANGE-ME-NOW"
```

Do not put the temporary password in GitHub, an issue, a commit, or a shared document.

## Instant visual preview without Firebase

To publish the synthetic demo instead of the live Firebase mode, edit `.env.production` before the workflow builds:

```env
VITE_DATA_MODE=demo
```

Commit the change. The deployed Pages site will then provide demo Athlete, Coach, Admin, and Practice Board entry points. Change it back to `firebase` for real team use.

## Important deployment files

- `.github/workflows/deploy-pages.yml` builds and publishes GitHub Pages.
- `.env.production` contains the client-visible Firebase web configuration.
- `firestore.rules` is the actual authorization boundary.
- `firestore.indexes.json` defines required Firestore indexes.
- `public/manifest.webmanifest` and `public/sw.js` provide installable PWA behavior.
- `scripts/` contains controlled administrative setup and export tools.
- `docs/product/` contains the five project source-of-truth documents.

## Local development

```bash
npm install
npm run dev
```

The development environment uses synthetic demo data by default.

For local Firebase emulators:

```bash
npm run emulators:fresh
npm run seed:emulator
npm run dev:firebase
```

## Build checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

GitHub Pages deployment will stop if the TypeScript build fails.

## Security boundaries

- Firebase web configuration is client-visible by design. It is not an administrator credential.
- Never commit a service-account file, Firebase Admin private key, password, or GitHub token.
- Do not make athlete records publicly readable.
- Do not expose Five Cs, private reflections, recovery information, or Confidence Bank text on the Practice Board.
- Do not add private coach-to-minor messaging.
- Do not use the app for therapy, diagnosis, weight-cutting, calorie tracking, or mental-health screening.

## GitHub Pages routing

This Pages edition uses hash-based routes, such as:

`https://YOUR-GITHUB-NAME.github.io/merrill-girls-wrestling/#/app/today`

That is intentional. GitHub Pages cannot provide Firebase-style SPA rewrites, and hash routing prevents deep links from returning a 404.
