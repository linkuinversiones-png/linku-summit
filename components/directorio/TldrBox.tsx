import RichText from './RichText';

export default function TldrBox({ children }: { children: string }) {
  return (
    <aside
      className="rounded-2xl border border-linku-coral/30 bg-linku-coral/5 p-6 sm:p-7"
      aria-label="TL;DR"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-linku-coral">
        TL;DR
      </div>
      <p className="mt-3 text-base text-linku-text leading-relaxed sm:text-lg">
        <RichText text={children} />
      </p>
    </aside>
  );
}
