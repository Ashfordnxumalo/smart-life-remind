import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="29 July 2026">
      <LegalSection heading="What this covers">
        <p>
          Smart R helps you track reminders for appointments, documents, subscriptions
          and personal events, and optionally share them with family or team members. This
          policy explains what the app stores, where it is stored, and what control you have
          over it.
        </p>
      </LegalSection>

      <LegalSection heading="Information we collect">
        <p>The app stores only what you enter or explicitly enable:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Account details</strong> — your email address,
            the name you provide at sign-up, and your selected plan (family or business).
            Passwords are handled by Firebase Authentication and are never visible to the app.
          </li>
          <li>
            <strong className="text-foreground">Reminders</strong> — titles, descriptions,
            categories, priorities, due dates and times, completion status, and any optional
            location you attach to a reminder.
          </li>
          <li>
            <strong className="text-foreground">Family and team members</strong> — the names,
            relationships, email addresses and phone numbers you add for people you assign
            reminders to. You are responsible for having their permission to store these.
          </li>
          <li>
            <strong className="text-foreground">Location</strong> — only if you switch on
            location services. The app keeps your most recent position so it can tell you when
            you are near a reminder location. It does not keep a history of your movements.
          </li>
          <li>
            <strong className="text-foreground">Preferences</strong> — theme, notification and
            location-tracking settings.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How your data is stored and protected">
        <p>
          Data is stored in Google Cloud Firestore. Records are scoped to your account, and
          server-side security rules prevent any other signed-in user from reading or writing
          your data.
        </p>
        <p>
          Address lookups for reminder locations are performed via OpenStreetMap&rsquo;s
          Nominatim service. When you search for an address, that search text is sent to
          OpenStreetMap.
        </p>
      </LegalSection>

      <LegalSection heading="What we do not do">
        <p>
          The app does not sell your data, does not serve advertising, and does not share your
          information with third parties beyond the infrastructure providers described above.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You can edit or delete any reminder or member at any time, and turn location services
          off from Settings. Deleting a record removes it from the database.
        </p>
        <p>
          To request deletion of your account and all associated data, contact us using the
          details below.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about this policy or your data can be sent to the app owner. Replace this
          paragraph with a monitored contact address before publishing.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
