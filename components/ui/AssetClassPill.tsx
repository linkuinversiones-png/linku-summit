type Props = {
  label: string;
};

export default function AssetClassPill({ label }: Props) {
  return (
    <span className="inline-flex items-center rounded-full border border-linku-border-2 bg-white/[0.02] px-3 py-1 text-xs font-medium tracking-wide text-linku-text-muted">
      {label}
    </span>
  );
}
