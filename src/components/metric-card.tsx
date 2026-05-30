type MetricCardProps = {
  label: string;
  description: string;
};

export function MetricCard({ label, description }: MetricCardProps) {
  return (
    <article className="glass-control rounded-3xl p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="text-base font-semibold text-white">{label}</h2>
        <span className="rounded-full border border-cyan-100/25 bg-cyan-100/10 px-3 py-1 text-xs font-medium text-cyan-50/78">
          Chưa có dữ liệu
        </span>
      </div>
      <div className="mb-4 h-24 rounded-2xl border border-dashed border-cyan-100/25 bg-slate-950/18" />
      <p className="text-sm leading-6 text-cyan-50/70">{description}</p>
    </article>
  );
}
