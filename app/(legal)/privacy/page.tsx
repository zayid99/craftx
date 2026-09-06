import type { Metadata } from "next";
import Link from "next/link";
import { Section, P, UL, LI, Callout, LEGAL_CONTACT, LEGAL_UPDATED } from "../legal-ui";

export const metadata: Metadata = {
  title: "Privacy Policy | CraftX",
  description: "What CraftX stores, who it is shared with, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <article>
      <p className="text-[13px] tracking-[1.1px] text-[#9ca3af]">LEGAL</p>
      <h1 className="mt-[10px] text-[36px] font-bold leading-[46px] tracking-[-0.7px] text-[#111827]">
        Privacy Policy
      </h1>
      <p className="mt-[10px] text-[14.5px] text-[#9ca3af]">Last updated {LEGAL_UPDATED}</p>

      <Callout>
        Short version: we store your account, your creator profile, and the work you save. We send
        your prompts to AI providers so they can generate a response. We do not sell your data and we
        do not use your content to train models. You can delete everything from Settings.
      </Callout>

      <Section title="1. What we collect">
        <P>Information you give us:</P>
        <UL>
          <LI><strong>Account</strong> — your email address and a password, which is hashed and stored by our authentication provider. We never see your password.</LI>
          <LI><strong>Creator profile</strong> — niche, platforms, audience, goals, experience level, content pillars and tone, if you choose to fill them in.</LI>
          <LI><strong>Your work</strong> — the prompts, scripts and transcripts you enter, and any ideas, scripts, SEO sets, content plans, analyses and coach conversations you save.</LI>
        </UL>
        <P>Information collected automatically:</P>
        <UL>
          <LI><strong>Usage records</strong> — which tool was used and how many generations it consumed, so we can enforce your monthly allowance.</LI>
          <LI><strong>Subscription status</strong> — your plan, renewal date, and cancellation state, received from our payment processor.</LI>
          <LI><strong>Error and performance data</strong> — when something breaks, our monitoring tool records the error along with technical details such as browser, page, and a session identifier.</LI>
          <LI><strong>Session replay</strong> — a sample of roughly one in ten sessions, and sessions where an error occurs, are recorded as a replay of on-screen activity so we can reproduce bugs. Replays capture what happens in the interface, including text you type into CraftX. They are retained by our monitoring provider and used only for debugging.</LI>
        </UL>
        <P>
          We do not collect or store your card details. Those go directly to our payment processor.
        </P>
      </Section>

      <Section title="2. Why we use it">
        <UL>
          <LI>To run the service — signing you in, generating output, and saving your work.</LI>
          <LI>To personalise results, using your creator profile and saved work as context.</LI>
          <LI>To apply plan limits and process your subscription.</LI>
          <LI>To find and fix faults, and to keep the service secure.</LI>
          <LI>To contact you about your account, billing, or material changes to the service.</LI>
        </UL>
        <P>
          We do not send marketing email unless you ask us to, and we do not sell or rent personal
          data to anyone.
        </P>
      </Section>

      <Section title="3. Who we share it with">
        <P>
          CraftX relies on a small number of providers. Each receives only what it needs to do its
          job.
        </P>
        <UL>
          <LI><strong>Supabase</strong> — authentication and database hosting. Stores your account, profile, saved work and usage records. Hosted in the AWS Asia Pacific (Singapore) region.</LI>
          <LI><strong>Anthropic</strong> — receives the prompt and relevant saved context when you use Creator Coach, in order to generate a reply.</LI>
          <LI><strong>DeepSeek</strong> — receives the prompt and relevant context for Idea Studio, Script Studio, SEO Studio, Content Planner and Script Analyzer.</LI>
          <LI><strong>Lemon Squeezy</strong> — merchant of record. Handles checkout, card processing, invoicing and tax, and sends us your subscription status.</LI>
          <LI><strong>Sentry</strong> — error monitoring and session replay, as described above.</LI>
          <LI><strong>Vercel</strong> — application hosting, which processes requests as they are served.</LI>
        </UL>
        <P>
          Several of these are outside your country, so your data may be processed abroad. We may
          add or change providers as the product develops, and will update this list when we do.
        </P>
        <P>
          We may also disclose data if required by law, or to protect the rights and safety of our
          users.
        </P>
      </Section>

      <Section title="4. AI providers and your content">
        <P>
          When you generate something, your prompt and any relevant saved context are sent to the AI
          provider handling that tool. We instruct providers not to use this content to train their
          models, and their business terms reflect that. Providers may retain the request briefly for
          abuse monitoring under their own policies.
        </P>
        <P>
          Please avoid entering passwords, financial details, health information, or anything else
          sensitive into a prompt.
        </P>
      </Section>

      <Section title="5. How long we keep it">
        <UL>
          <LI>Account and saved work — until you delete the item, or delete your account.</LI>
          <LI>Usage records — retained so we can calculate monthly allowances and support billing questions.</LI>
          <LI>Error data and session replays — retained by our monitoring provider on a rolling window, typically 90 days or less.</LI>
          <LI>Payment and invoice records — retained by Lemon Squeezy for as long as tax and accounting law requires.</LI>
        </UL>
      </Section>

      <Section title="6. Your choices">
        <UL>
          <LI><strong>Access and correction</strong> — your profile and saved work are visible and editable in the app.</LI>
          <LI><strong>Deletion</strong> — deleting your account from Settings removes your profile, saved work and usage records. This cannot be undone.</LI>
          <LI><strong>Export</strong> — every tool lets you copy or download its output. If you want a full copy of your data, email us and we will send it.</LI>
          <LI><strong>Objection</strong> — if you would rather not be included in session replay sampling, email us and we will exclude your account.</LI>
        </UL>
        <P>
          Depending on where you live you may have further rights, including to restrict processing
          or complain to a data protection authority. Email{" "}
          <a href={`mailto:${LEGAL_CONTACT}`} className="text-[#5b5bd6] underline underline-offset-2">
            {LEGAL_CONTACT}
          </a>{" "}
          and we will respond within 30 days.
        </P>
      </Section>

      <Section title="7. Security">
        <P>
          Traffic is encrypted in transit. Passwords are hashed by our authentication provider and
          never stored in plain text. Every database query is scoped to the signed-in account, so one
          user cannot read another&apos;s work. No system is perfectly secure, and we will notify
          affected users promptly if a breach occurs.
        </P>
      </Section>

      <Section title="8. Children">
        <P>
          CraftX is not intended for anyone under 16. We do not knowingly collect data from children.
          If you believe a child has created an account, contact us and we will remove it.
        </P>
      </Section>

      <Section title="9. Cookies">
        <P>
          We use cookies that are necessary for the service to work — chiefly to keep you signed in.
          We do not use advertising or cross-site tracking cookies. See our{" "}
          <Link href="/terms" className="text-[#5b5bd6] underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          for how the service itself operates.
        </P>
      </Section>

      <Section title="10. Changes and contact">
        <P>
          We will post any update here with a new date, and email you if the change is significant.
          Questions go to{" "}
          <a href={`mailto:${LEGAL_CONTACT}`} className="text-[#5b5bd6] underline underline-offset-2">
            {LEGAL_CONTACT}
          </a>
          .
        </P>
      </Section>
    </article>
  );
}
