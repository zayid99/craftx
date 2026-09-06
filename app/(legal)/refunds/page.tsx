import type { Metadata } from "next";
import Link from "next/link";
import { Section, P, UL, LI, Callout, LEGAL_CONTACT, LEGAL_UPDATED } from "../legal-ui";

export const metadata: Metadata = {
  title: "Refund Policy | CraftX",
  description: "When CraftX gives refunds, and how to request one.",
};

export default function RefundsPage() {
  return (
    <article>
      <p className="text-[13px] tracking-[1.1px] text-[#9ca3af]">LEGAL</p>
      <h1 className="mt-[10px] text-[36px] font-bold leading-[46px] tracking-[-0.7px] text-[#111827]">
        Refund Policy
      </h1>
      <p className="mt-[10px] text-[14.5px] text-[#9ca3af]">Last updated {LEGAL_UPDATED}</p>

      <Callout>
        <strong>7-day guarantee.</strong> If your first payment on a plan does not work out, email us
        within 7 days and we will refund it in full. After that, cancel any time and you will not be
        charged again.
      </Callout>

      <Section title="Try before you pay">
        <P>
          Every CraftX tool is available on the free plan with a smaller monthly allowance. We
          strongly recommend using it first — it is the best way to know whether a paid plan is worth
          it for you, and it means nobody needs to pay to find out.
        </P>
      </Section>

      <Section title="Your first payment">
        <P>
          We refund the first payment on any paid plan in full if you ask within 7 days of that
          charge. You do not need to give a reason.
        </P>
        <P>
          This applies once per account. It covers your first upgrade to Creator or Creator Pro, not
          later renewals, and not a second subscription after a previous refund.
        </P>
      </Section>

      <Section title="Renewals">
        <P>
          Monthly renewals are not refundable, because you can cancel at any point before one
          happens. Cancelling from Settings stops future billing immediately and keeps your paid
          access until the end of the period you have already paid for.
        </P>
        <P>
          We do not give partial or pro-rata refunds for unused time in a period that has already
          started.
        </P>
      </Section>

      <Section title="Always refunded">
        <P>Regardless of timing, we will refund you if:</P>
        <UL>
          <LI>You were charged twice for the same period.</LI>
          <LI>You were charged after cancelling.</LI>
          <LI>A payment was made without your authorisation.</LI>
          <LI>A fault on our side made your paid plan unusable for a significant stretch of a billing period and we could not fix it.</LI>
        </UL>
      </Section>

      <Section title="When we may decline">
        <P>
          The 7-day guarantee is meant to cover &ldquo;this is not for me&rdquo;, not a free month of
          output. Generating content costs us money per request, so we may decline a refund where:
        </P>
        <UL>
          <LI>More than half of any monthly allowance has already been used.</LI>
          <LI>The account has breached our <Link href="/terms" className="text-[#5b5bd6] underline underline-offset-2">Terms of Service</Link>.</LI>
          <LI>The same person has previously been refunded and subscribed again.</LI>
        </UL>
        <P>
          If we decline, we will explain why, and you can still cancel so you are not billed again.
        </P>
      </Section>

      <Section title="How to request one">
        <P>
          Email{" "}
          <a href={`mailto:${LEGAL_CONTACT}`} className="text-[#5b5bd6] underline underline-offset-2">
            {LEGAL_CONTACT}
          </a>{" "}
          from the address on your account, with the date of the charge. We aim to reply within 2
          working days.
        </P>
        <P>
          Approved refunds go back to your original payment method through Lemon Squeezy, our
          merchant of record. Their processing usually takes 5 to 10 working days depending on your
          bank. You may also contact Lemon Squeezy directly about any charge.
        </P>
      </Section>

      <Section title="Your legal rights">
        <P>
          This policy sits alongside consumer law, it does not replace it. If you live somewhere that
          gives you a statutory right to cancel a digital purchase, that right still applies and we
          will honour it.
        </P>
      </Section>
    </article>
  );
}
