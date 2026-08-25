# IELTS Scholars

A full-stack IELTS practice application built with React, TypeScript, Vinext/Next-compatible routing, Firebase Authentication, Cloud Firestore and Firebase Storage.

## Included features

- Student dashboard with Reading, Listening, Writing and Speaking modules
- Test libraries with Academic/General filters and search
- Strict timed mode and unlimited practice mode
- Reading split-view passages and objective questions
- Listening audio player, transcript fallback and automatic marking
- Writing task editor with live word count
- Speaking Part 1–3 prompts and browser microphone recording
- Full mock-test launcher, result screen, history and typing-speed practice
- Firebase email/password authentication, Google sign-in and password reset
- Google Analytics initialization from the supplied measurement ID
- Admin-only dashboard with create, edit, draft, publish, preview and delete
- Structured question builder and Firebase Storage audio upload
- Firestore security rules, indexes and Storage rules
- Four original sample tests; no copyrighted Cambridge/OnMock test content
- Demo mode when Firebase configuration is absent

## Requirements

- Node.js 22.13 or newer
- npm
- A Firebase project for persistent production data

## Run locally on Windows, macOS or Linux

```bash
npm install
npm run dev
```

Open the URL printed in the terminal, normally `http://localhost:5173`.

## Firebase project configuration

The supplied `ieltsscholars-addbc` Firebase Web App configuration is already included in `lib/firebase.ts`, `.env.example`, and `.env.local`. Firebase Web App configuration is client-visible by design; access is protected by Authentication and the included Firestore/Storage rules.

In https://console.firebase.google.com/:

1. Open the `ieltsscholars-addbc` project.
2. Go to **Authentication → Sign-in method** and enable both **Email/Password** and **Google**.
3. In **Authentication → Settings → Authorized domains**, add every production domain you will use. `localhost` should also be present for local development.
4. Create a **Cloud Firestore** database.
5. Enable **Firebase Storage**.

The configuration can still be overridden for another Firebase project with `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

Restart `npm run dev` after creating `.env.local`.

## Deploy Firebase rules

Log in and select your Firebase project:

```bash
npx firebase-tools login
npx firebase-tools use --add
npm run firebase:deploy
```

The included `firestore.rules`, `firestore.indexes.json`, `storage.rules`, and `firebase.json` configure the required access model.

## Create the first administrator

1. Register a user from `/login`.
2. In Firebase Console, open **Authentication → Users** and copy that user's UID.
3. In Firestore, create collection `admins`.
4. Create a document whose document ID is exactly the copied UID.
5. Add a field: `role` = `admin`.
6. Sign out and sign in again. The **Admin Panel** link will appear.

Only an authenticated UID that has a matching `admins/{uid}` document can create, edit or delete tests and upload audio.

## Firestore collections

- `tests/{testId}` — test metadata, passages, prompts and questions
- `attempts/{attemptId}` — student answers, score and submission status
- `admins/{uid}` — administrator allowlist

## Admin workflow

Open `/admin`, then select **Create custom test**. The form supports module, training type, duration, collection, status, passage/transcript, writing prompt, speaking parts, audio URL/upload, objective question type, options, correct answer and points. Set status to **Published** when the test is ready for students.

## Production notes

- Objective Reading/Listening questions are automatically marked.
- Writing and Speaking attempts are saved as `pending-review`. Connect your preferred AI evaluation API or human examiner workflow for official criterion scoring.
- Browser-recorded Speaking audio is kept locally for playback in this version; add an explicit upload/consent workflow before storing student voice recordings.
- IELTS is a registered trademark of its owners. This independent project is not affiliated with IELTS, Cambridge, British Council or IDP.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```
