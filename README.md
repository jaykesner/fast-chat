# Fast Chat

Anonymous chat rooms with 5-character shareable codes, powered by Next.js and Firebase Firestore.

## Setup

1. Create a Firebase project and enable **Cloud Firestore**.
2. Register a **Web** app and copy its config.
3. Copy env vars and fill them in:

```bash
cp .env.example .env.local
```

| Variable | Firebase config field |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

4. In the Firebase console, paste the contents of [`firestore.rules`](./firestore.rules) into **Firestore → Rules** and publish.
5. Create a composite index only if the console prompts you (messages are ordered by `createdAt`).

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- No sign-in — pick any display name (stored in `localStorage`).
- **Create room** generates a code like `XY1B2` and opens `/XY1B2`.
- **Join** with a code, or share the room URL directly.
- Messages sync in realtime via Firestore.
