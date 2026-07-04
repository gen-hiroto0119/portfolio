import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorkDetail } from "@/components/works/work-detail";
import { getAllWorks, getWork } from "@/lib/content";
import { site } from "@/lib/site";

type WorkPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const works = await getAllWorks();
  return works.map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork(slug);

  if (!work) {
    return {};
  }

  return {
    title: work.title,
    description: work.description,
    openGraph: {
      title: work.title,
      description: work.description,
      type: "article",
      publishedTime: work.date,
      url: `${site.url}/works/${slug}`,
    },
  };
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const work = await getWork(slug);

  if (!work) {
    notFound();
  }

  const allWorks = await getAllWorks();
  const currentIndex = allWorks.findIndex((w) => w.slug === slug);
  const prev =
    currentIndex > 0
      ? {
          slug: allWorks[currentIndex - 1].slug,
          title: allWorks[currentIndex - 1].title,
        }
      : null;
  const next =
    currentIndex < allWorks.length - 1
      ? {
          slug: allWorks[currentIndex + 1].slug,
          title: allWorks[currentIndex + 1].title,
        }
      : null;

  return <WorkDetail work={work} prev={prev} next={next} />;
}
