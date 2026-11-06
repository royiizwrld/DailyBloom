import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { CONTACT_EMAIL } from "@/lib/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions · Daily Bloom" },
      { name: "description", content: "The terms for using the Daily Bloom habit tracker (draft)." },
      { property: "og:title", content: "Terms and Conditions · Daily Bloom" },
      { property: "og:description", content: "The terms for using the Daily Bloom habit tracker (draft)." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms and Conditions">
      <p>These terms explain the rules for using Daily Bloom, a personal habit-tracking app. By creating an account you agree to them.</p>
      <h2>1. The service</h2>
      <p>Daily Bloom lets you create habits, record daily check-ins and notes, view streaks and statistics, and optionally ask an AI coach for suggestions. The service is provided free of charge and "as is". We may change or discontinue features.</p>
      <h2>2. Your account</h2>
      <ul>
        <li>You must give a valid email address and keep your password safe.</li>
        <li>You are responsible for activity on your account.</li>
        <li>You can delete your account at any time from Settings.</li>
      </ul>
      <h2>3. Your content</h2>
      <p>You own the habits, notes and other content you add. You give us permission to store and process it only to run the service for you, as described in the <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.</p>
      <h2>4. AI features</h2>
      <p>The habit coach and bulk add use an AI model. Their answers can be wrong and are general habit-building suggestions only. They are not medical, mental-health or professional advice.</p>
      <h2>5. Acceptable use</h2>
      <p>Don't misuse the service, try to access other people's data, or interfere with its operation.</p>
      <h2>6. Liability</h2>
      <p>To the extent allowed by law, we are not liable for indirect losses or for lost data. Please keep your own records of anything important.</p>
      <h2>7. Changes</h2>
      <p>If we change these terms we will update the date above. Continuing to use the service means you accept the updated terms.</p>
      <h2>8. Contact</h2>
      <p>Questions? Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
