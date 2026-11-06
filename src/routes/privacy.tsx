import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";
import { CONTACT_EMAIL } from "@/lib/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Daily Bloom" },
      { name: "description", content: "What data Daily Bloom collects, how it's used and stored, and your rights (draft)." },
      { property: "og:title", content: "Privacy Policy · Daily Bloom" },
      { property: "og:description", content: "What data Daily Bloom collects, how it's used and stored, and your rights (draft)." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your email address, first name, optional last name, and when you accepted these terms.</li>
        <li><strong>Habit data:</strong> your habits, categories, routines, check-ins, notes and goals.</li>
        <li><strong>Preferences:</strong> your theme choice and timezone.</li>
        <li><strong>Device storage:</strong> your browser stores your sign-in session and a few display settings (such as whether the sidebar is collapsed, and coach chat history).</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To run the app: show your checklist, calculate streaks and statistics, and sync between your devices.</li>
        <li>When you use the AI coach or bulk add, the text you send and a summary of your habit data are sent to an AI model provider to generate the reply. This only happens when you use those features.</li>
        <li>To send account emails such as confirmation and password reset.</li>
      </ul>
      <h2>How it's stored</h2>
      <p>Your data is stored in a hosted database. Access rules ensure each account can only read and change its own data.</p>
      <h2>What we don't do</h2>
      <p>We do not sell your personal data, and we don't use it for advertising.</p>
      <h2>Your rights</h2>
      <ul>
        <li>See and edit your data in the app at any time.</li>
        <li>Delete your account and all its data from Settings → "Delete account and all data".</li>
        <li>Contact us to ask about the data we hold about you.</li>
      </ul>
      <h2>Contact</h2>
      <p>Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
