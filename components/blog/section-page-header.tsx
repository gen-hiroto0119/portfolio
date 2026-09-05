type SectionPageHeaderProps = {
  label: string;
  title: string;
  description: string;
};

export function SectionPageHeader({ label, title, description }: SectionPageHeaderProps) {
  return (
    <header aria-label={label} className="mx-auto w-full max-w-4xl px-6 pt-16 pb-10 sm:px-8 sm:pt-24">
      <h1 className="max-w-2xl text-2xl leading-relaxed font-medium tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
        {description}
      </p>
    </header>
  );
}
