type Item = { q: string; a: string };

type Props = {
  title: string;
  items: ReadonlyArray<Item>;
};

export default function DirectoryFAQ({ title, items }: Props) {
  return (
    <section id="faq-directorio" aria-labelledby="faq-directorio-title" className="mt-16 sm:mt-20">
      <h2
        id="faq-directorio-title"
        className="font-bold tracking-tightish text-linku-text text-[clamp(1.6rem,3vw,2.25rem)] leading-tight"
      >
        {title}
      </h2>
      <div className="mt-7 divide-y divide-linku-border border-y border-linku-border">
        {items.map((it, i) => (
          <details key={i} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-linku-text sm:text-lg">
              {it.q}
              <span
                aria-hidden
                className="text-linku-coral transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-linku-text-muted leading-relaxed sm:text-base">
              {it.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
