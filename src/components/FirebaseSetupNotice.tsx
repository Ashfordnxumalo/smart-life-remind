export const FirebaseSetupNotice = () => (
  <div className="min-h-screen flex items-center justify-center bg-muted p-4">
    <div className="max-w-lg w-full bg-background border rounded-xl shadow-sm p-8 space-y-4">
      <h1 className="text-xl font-bold">Firebase isn't configured yet</h1>
      <p className="text-sm text-muted-foreground">
        Smart R needs a Firebase project before it can run. Copy{" "}
        <code className="bg-muted px-1 py-0.5 rounded">.env.example</code> to{" "}
        <code className="bg-muted px-1 py-0.5 rounded">.env</code> and fill in your Firebase
        Web app config (Project settings → General → Your apps → Web, in the Firebase console).
      </p>
      <p className="text-sm text-muted-foreground">
        Then restart the dev server. See the migration plan for the full prerequisite checklist
        (creating the project, enabling Email/Password auth, Firestore, and the Blaze plan for
        Cloud Functions).
      </p>
    </div>
  </div>
);
