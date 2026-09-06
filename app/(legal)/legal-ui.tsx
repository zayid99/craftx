import type { ReactNode } from "react";

/** Shared building blocks so all three legal pages read identically. */

export const LEGAL_CONTACT = "craftxofficialbd@gmail.com";
export const LEGAL_UPDATED = "5 September 2026";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-[38px]">
      <h2 className="text-[20px] font-semibold tracking-[-0.3px] text-[#111827]">{title}</h2>
      <div className="mt-[12px] space-y-[14px]">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[15.5px] leading-[27px] text-[#4b5563]">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="space-y-[10px]">{children}</ul>;
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-[12px] text-[15.5px] leading-[27px] text-[#4b5563]">
      <span className="mt-[11px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#c9c6f6]" />
      <span>{children}</span>
    </li>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-[20px] rounded-[14px] border border-[#e4e7f1] bg-[#fafbfd] p-[20px] text-[15px] leading-[25px] text-[#4b5563]">
      {children}
    </div>
  );
}
