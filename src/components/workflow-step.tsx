type WorkflowStepProps = {
  index: number;
  title: string;
  description: string;
};

export function WorkflowStep({ index, title, description }: WorkflowStepProps) {
  return (
    <article className="glass-control relative rounded-3xl p-5">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl border border-cyan-100/30 bg-cyan-300/15 text-sm font-semibold text-cyan-50 cyan-glow">
        {index}
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-cyan-50/70">{description}</p>
    </article>
  );
}
