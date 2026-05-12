import StatNumber from '@/components/ui/StatNumber';

type Stat = { value: string; label: string };

export default function Stats({ stats }: { stats: Stat[] }) {
  return (
    <section className="border-y border-linku-border bg-linku-bg-2/40">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <StatNumber key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
