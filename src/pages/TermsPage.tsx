import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="29 July 2026">
      <LegalSection heading="Using the service">
        <p>
          By creating an account you agree to these terms. If you do not agree, please do not
          use the app.
        </p>
        <p>
          You are responsible for keeping your login details secure and for activity that
          happens under your account.
        </p>
      </LegalSection>

      <LegalSection heading="Your content">
        <p>
          The reminders, notes and contact details you enter remain yours. You grant us only
          the access needed to store and display them back to you and to deliver the
          notifications you request.
        </p>
        <p>
          When you add someone as a family or team member, you confirm that you are entitled to
          store their contact details for this purpose.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>
          Do not use the app to store unlawful content, to harass anyone, to send unsolicited
          messages to the contacts you add, or to attempt to access other users&rsquo; data or
          disrupt the service.
        </p>
      </LegalSection>

      <LegalSection heading="Plan limits">
        <p>
          The family plan supports up to 5 active members and the business plan up to 15. These
          limits are enforced when you add members.
        </p>
      </LegalSection>

      <LegalSection heading="Reminders are not guaranteed">
        <p>
          This is important: the app is a convenience tool, not a guaranteed alerting system.
          Notification delivery depends on your device, browser, network and permissions, and
          may be delayed or fail entirely. Do not rely on it alone for anything time-critical,
          medical, legal or financial.
        </p>
      </LegalSection>

      <LegalSection heading="Availability and changes">
        <p>
          The service is provided &ldquo;as is&rdquo;, without warranties of any kind. We may
          change, suspend or discontinue features at any time, and may update these terms.
          Continued use after a change means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the extent permitted by law, we are not liable for any loss arising from missed
          reminders, failed notifications, or unavailability of the service.
        </p>
      </LegalSection>

      <LegalSection heading="Ending your account">
        <p>
          You may stop using the app at any time and request deletion of your account and data.
          We may suspend accounts that breach these terms.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Replace this paragraph with a monitored contact address and the governing
          jurisdiction before publishing.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
