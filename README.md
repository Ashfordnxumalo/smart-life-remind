# Smart R

An intelligent reminder management app — appointments, documents, subscriptions, and personal events, with optional location-based reminders and family/team member assignment.

## Backend

This project runs on **Firebase**: Firebase Authentication (email/password), Cloud Firestore, and Cloud Functions. It does not use Supabase, despite some earlier scaffolding history — see `firestore.rules`, `firestore.indexes.json`, and `functions/` for the backend definition.

### First-time setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Email/Password** sign-in under Authentication → Sign-in method.
3. Create a **Firestore** database (production mode).
4. Register a **Web app** in the project (Project settings → General → Your apps), copy the config, and fill in `.env` (copy `.env.example` first):
   ```sh
   cp .env.example .env
   ```
5. Deploy the security rules and indexes:
   ```sh
   firebase deploy --only firestore:rules,firestore:indexes
   ```
6. To deploy Cloud Functions (`functions/`), the project needs the **Blaze (pay-as-you-go)** plan:
   ```sh
   cd functions && npm install && cd ..
   firebase deploy --only functions
   ```
   Without this, most of the app works (auth, reminders, settings, location), but family-member add/remove and the reminder-assignment notification will fail — those specifically require the deployed callables.

## Local development

```sh
npm install
npm run dev
```

## What technologies are used for this project?

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Firebase (Auth, Firestore, Cloud Functions)

## How can I edit this code?

**Use your preferred IDE**

Clone this repo, install dependencies, and run `npm run dev`.

**Edit a file directly in GitHub**

Navigate to the file, click the pencil icon, make your changes, and commit.

**Use GitHub Codespaces**

From the repo's main page, click Code → Codespaces → New codespace.
