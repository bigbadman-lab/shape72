import {
  MAGIC_EDEN_COLLECTION_URL,
  SECONDARY_MARKET_COPY,
  SECONDARY_MARKET_CTA,
  SECONDARY_MARKET_HEADING,
} from "@/data/marketplace";

export function SecondaryMarketStrip() {
  const live = Boolean(MAGIC_EDEN_COLLECTION_URL);

  return (
    <section
      className="mt-10 border-t border-border pt-6"
      aria-label="Secondary market"
    >
      <div className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {SECONDARY_MARKET_HEADING}
      </div>
      <p className="mt-3 max-w-lg font-display text-[10px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground">
        {SECONDARY_MARKET_COPY}
      </p>
      {live ? (
        <a
          href={MAGIC_EDEN_COLLECTION_URL || undefined}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex rounded-full border border-border px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.25em] text-foreground transition-colors hover:border-foreground/40"
        >
          {SECONDARY_MARKET_CTA}
        </a>
      ) : (
        <div className="mt-5 inline-flex items-center gap-3 font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
          <span>Magic Eden collection pending</span>
        </div>
      )}
    </section>
  );
}
