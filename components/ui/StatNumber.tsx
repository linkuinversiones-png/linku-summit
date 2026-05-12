type Props = {
  value: string;
  label: string;
  size?: 'md' | 'lg';
};

export default function StatNumber({ value, label, size = 'md' }: Props) {
  const valueCls =
    size === 'lg'
      ? 'text-[clamp(3rem,7vw,5rem)]'
      : 'text-[clamp(2.5rem,5.5vw,4rem)]';
  return (
    <div className="flex flex-col">
      <span
        className={`font-bold tracking-tighter2 leading-none text-linku-text ${valueCls}`}
      >
        {value}
      </span>
      <span className="mt-2 text-xs font-medium uppercase tracking-[0.15em] text-linku-text-muted sm:text-sm">
        {label}
      </span>
    </div>
  );
}
