type DesignPageHeaderProps = {
  label: string;
  title: string;
  description: string;
};

export function DesignPageHeader({ label, title, description }: DesignPageHeaderProps) {
  return (
    <header className="mx-auto w-full max-w-4xl px-6 pt-20 pb-16 sm:px-8 sm:pt-28">
      <p className="mb-6 text-xs text-muted-foreground">{label}</p>
      <h1 className="mb-5 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
    </header>
  );
}
