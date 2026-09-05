export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mx-auto w-full max-w-4xl px-6 pb-12 pt-16 sm:px-10 sm:pt-20">
      <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p>
    </header>
  );
}
