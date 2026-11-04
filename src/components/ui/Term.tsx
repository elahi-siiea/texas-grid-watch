"use client";

import { useId, useState } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

export function Term({ term, children }: { term: GlossaryKey; children?: React.ReactNode }) {
  const { label, text } = GLOSSARY[term];
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-flex items-baseline gap-1">
      {children ?? label}
      <button
        type="button"
        aria-label={`What is ${label}?`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-soft text-[10px] font-semibold leading-none text-soft hover:border-accent hover:text-accent"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute left-0 top-full z-20 mt-1 w-64 max-w-[80vw] rounded border border-line bg-surface p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-ink shadow-md"
        >
          {text}
        </span>
      )}
    </span>
  );
}
