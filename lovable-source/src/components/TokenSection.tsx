import { CORE_TOKEN } from "@/lib/shapes";

const STATS = [
  { label: "Market Cap", value: CORE_TOKEN.marketCap },
  { label: "24H Volume", value: CORE_TOKEN.volume24h },
  { label: "Creator Rewards", value: CORE_TOKEN.creatorRewards },
  { label: "Shape Pool", value: CORE_TOKEN.shapePool },
];

/**
 * Native-token treatment. Sits below the gallery, quiet and typographic —
 * never an analytics dashboard. Supports the pre-launch state.
 */
export function TokenSection() {
  return (
    <section className="mt-28 sm:mt-40" aria-label="Core token">
      <div className="border-t border-border pt-8">
        <div className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Core Token
        </div>
        <div className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-foreground sm:text-6xl">
          {CORE_TOKEN.symbol}
        </div>
      </div>

      {CORE_TOKEN.launched ? (
        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-background p-6 sm:p-8">
              <dt className="font-display text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="mt-3 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mt-10 flex items-center gap-4">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
          <span className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Not live yet
          </span>
        </div>
      )}
    </section>
  );
}
