import type { Metadata } from "next";
import Link from "next/link";
import { Section, P, UL, LI, Callout, LEGAL_CONTACT, LEGAL_UPDATED } from "../legal-ui";

export const metadata: Metadata = {
  title: "Terms of Service | CraftX",
  description: "The terms that apply when you use CraftX.",
};

export default function TermsPage() {
  return (
    <article>
      <p className="text-[13px] tracking-[1.1px] text-[#9ca3af]">LEGAL</p>
      <h1 className="mt-[10px] text-[36px] font-bold leading-[46px] tracking-[-0.7px] text-[#111827]">
        Terms of Service
      </h1>
      <p className="mt-[10px] text-[14.5px] text-[#9ca3af]">Last updated {LEGAL_UPDATED}</p>

      <Callout>
        CraftX is operated by an independent developer trading as &ldquo;CraftX&rdquo;. Payments are
        processed by Lemon Squeezy, who act as the merchant of record for every purchase.
      </Callout>

      <Section title="1. Agreement">
        <P>
          These terms apply when you create a CraftX account or use any part of the service. If you
          do not agree with them, please do not use CraftX. We may update these terms as the product
          changes; if a change materially affects your rights, we will tell you by email before it
          takes effect.
        </P>
      </Section>

      <Section title="2. Your account">
        <UL>
          <LI>You must be at least 16 years old to create an account.</LI>
          <LI>You are responsible for keeping your password secure and for activity on your account.</LI>
          <LI>One account per person. Sharing login credentials between people is not permitted.</LI>
          <LI>Tell us promptly at {LEGAL_CONTACT} if you believe your account has been accessed without your permission.</LI>
        </UL>
      </Section>

      <Section title="3. What CraftX does">
        <P>
          CraftX is a workspace that uses AI models to help you research content ideas, draft scripts,
          prepare titles and keywords, plan a posting schedule, analyse your own scripts, and get
          strategy suggestions. It is an assistant, not a guarantee of any result.
        </P>
        <P>
          You remain responsible for everything you publish. AI output can be wrong, outdated, or
          unoriginal, and you should review it before using it anywhere that matters.
        </P>
      </Section>

      <Section title="4. Acceptable use">
        <P>You agree not to use CraftX to:</P>
        <UL>
          <LI>Create content that is unlawful, hateful, harassing, deceptive, or sexually explicit.</LI>
          <LI>Impersonate another person or misrepresent your affiliation with anyone.</LI>
          <LI>Infringe someone else&apos;s copyright, trademark, or other rights.</LI>
          <LI>Resell CraftX output as an AI writing service, or use the service to build a competing product.</LI>
          <LI>Automate, scrape, or otherwise access the service other than through the interface we provide.</LI>
          <LI>Attempt to bypass usage limits, plan restrictions, or any security control.</LI>
        </UL>
        <P>
          We may suspend or close an account that breaches these rules. Where the breach is serious
          or repeated, we may do so without notice and without a refund.
        </P>
      </Section>

      <Section title="5. Your content and ours">
        <P>
          You keep ownership of everything you enter into CraftX and everything the service generates
          for you. You are free to publish, sell, or adapt that output.
        </P>
        <P>
          We need a limited licence to your content purely to operate the service — to store it, show
          it back to you, and send it to the AI providers listed in our{" "}
          <Link href="/privacy" className="text-[#5b5bd6] underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          so they can generate a response. We do not use your content to train our own models.
        </P>
        <P>
          The CraftX name, interface, and underlying software remain ours. Nothing in these terms
          transfers that to you.
        </P>
        <P>
          Because AI models can produce similar output for similar prompts, we cannot promise that
          anything generated for you is unique to you.
        </P>
      </Section>

      <Section title="6. Plans, limits and billing">
        <P>
          CraftX offers a free plan and two paid plans. Each plan includes a monthly allowance for
          each tool, shown on the pricing page and in the app. Allowances reset on the first day of
          each calendar month and do not roll over.
        </P>
        <UL>
          <LI>Paid plans bill monthly in advance through Lemon Squeezy.</LI>
          <LI>You can cancel at any time from Settings; your plan stays active until the end of the period you have paid for, then drops to Free.</LI>
          <LI>We may change prices with at least 30 days&apos; notice by email. Existing subscriptions keep their current price until the next renewal after that notice.</LI>
          <LI>Refunds are covered by our <Link href="/refunds" className="text-[#5b5bd6] underline underline-offset-2">Refund Policy</Link>.</LI>
        </UL>
      </Section>

      <Section title="7. AI availability">
        <P>
          CraftX depends on third-party AI providers. Which model handles a given request may change
          as we add or replace providers, and a provider outage may make a tool temporarily
          unavailable. Access to any particular named model is not guaranteed and is not part of what
          you are paying for; you are paying for access to the CraftX tools and their monthly
          allowances.
        </P>
      </Section>

      <Section title="8. Availability and changes">
        <P>
          We aim to keep CraftX running reliably but do not promise uninterrupted service. We may
          add, change, or remove features. If we discontinue a paid feature entirely, we will give
          notice and refund any unused portion of your current billing period.
        </P>
      </Section>

      <Section title="9. Closing your account">
        <P>
          You can delete your account at any time from Settings. Deletion removes your saved work and
          personal data as described in the Privacy Policy, and cannot be undone. Cancelling a
          subscription is not the same as deleting your account.
        </P>
      </Section>

      <Section title="10. Liability">
        <P>
          CraftX is provided &ldquo;as is&rdquo;. To the extent the law allows, we are not liable for lost
          profits, lost audience, lost data, or any indirect or consequential loss arising from your
          use of the service, including from AI output that turns out to be inaccurate.
        </P>
        <P>
          Where liability cannot be excluded, it is limited to the amount you paid us in the twelve
          months before the claim arose.
        </P>
        <P>
          Nothing here limits rights you have under consumer law in your country that cannot legally
          be limited.
        </P>
      </Section>

      <Section title="11. Governing law">
        <P>
          These terms are governed by the laws of Bangladesh. Where you are a consumer resident
          elsewhere, you keep the benefit of any mandatory consumer protections available to you
          locally.
        </P>
      </Section>

      <Section title="12. Contact">
        <P>
          Questions about these terms go to{" "}
          <a href={`mailto:${LEGAL_CONTACT}`} className="text-[#5b5bd6] underline underline-offset-2">
            {LEGAL_CONTACT}
          </a>
          . For billing disputes you may also contact Lemon Squeezy directly as merchant of record.
        </P>
      </Section>
    </article>
  );
}
