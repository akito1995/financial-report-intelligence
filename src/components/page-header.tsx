type PageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PageHeader({ title, description, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-2">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/72">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
      <p className="max-w-3xl text-sm leading-6 text-cyan-50/72 sm:text-base">{description}</p>
    </header>
  );
}
