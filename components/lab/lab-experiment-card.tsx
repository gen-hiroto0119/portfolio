import type { LabExperiment } from "@/lib/lab-registry";

type LabExperimentCardProps = {
  experiment: LabExperiment;
};

export function LabExperimentCard({ experiment }: LabExperimentCardProps) {
  const { Component, date, title, description } = experiment;

  return (
    <article className="min-w-0">
      <div className="h-64 overflow-hidden rounded-md bg-surface"><Component /></div>
      <div className="pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base leading-7 font-medium text-foreground">{title}</h2>
          <time dateTime={date} className="shrink-0 text-xs text-muted-foreground">{date}</time>
        </div>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}

export function LabExperimentGrid({ experiments }: { experiments: LabExperiment[] }) {
  return (
    <section aria-label="実験" className="mx-auto grid w-full max-w-4xl gap-x-8 gap-y-12 px-6 pb-24 sm:px-8 md:grid-cols-2">
      {experiments.map((experiment) => <LabExperimentCard key={experiment.id} experiment={experiment} />)}
    </section>
  );
}
