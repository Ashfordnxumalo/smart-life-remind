import { createRoot } from 'react-dom/client'
import './index.css'
import { FirebaseSetupNotice } from './components/FirebaseSetupNotice'

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

const hasFirebaseConfig = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

if (!hasFirebaseConfig) {
  // Avoid importing App (and transitively src/lib/firebase.ts) at all when
  // unconfigured — the Firebase Auth SDK throws synchronously on an invalid
  // API key at module-eval time, which would otherwise crash the whole
  // module graph before React ever mounts.
  root.render(<FirebaseSetupNotice />);
} else {
  import('./App.tsx').then(({ default: App }) => {
    root.render(<App />);
  });
}
