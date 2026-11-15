import Link from 'next/link';

const steps = [
  ['1. Draft', 'Pick 5 small creators. Bigger channels cost more, so find the hidden gems.'],
  ['2. Score', 'Earn points from real YouTube growth: views, subs, uploads and engagement.'],
  ['3. Kingmaker', 'If FaZe signs a creator you drafted early, the badge is yours forever.'],
];

export default function Home() {
  return (
    <section className="py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E4002B]">Kingmakers since 2010</p>
      <h1 className="font-display mt-4 text-5xl leading-none sm:text-7xl">
        Scout the next<br />
        <span className="text-[#E4002B]">FaZe star.</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-white/70">
        {'FaZe turned unknown gamers into household names. Now it is your turn. Draft 5 rising creators with a $50 budget, earn points as they grow, and get the Kingmaker badge if FaZe signs your pick.'}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/draft" className="rounded bg-[#E4002B] px-6 py-3 font-semibold hover:bg-red-700">
          Start drafting
        </Link>
        <Link href="/watchlist" className="rounded border border-white/30 px-6 py-3 font-semibold hover:border-white">
          See the FaZe Watchlist
        </Link>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {steps.map(([title, text]) => (
          <div key={title} className="rounded-lg border border-white/10 p-5">
            <h3 className="font-display text-xl">{title}</h3>
            <p className="mt-2 text-sm text-white/60">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
