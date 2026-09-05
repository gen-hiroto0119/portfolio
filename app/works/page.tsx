import type { Metadata } from "next";

import { SectionPageHeader } from "@/components/works/section-page-header";
import { WorkCardList } from "@/components/works/work-card";
import { getAllWorks } from "@/app/works/_lib/get-works";

export const metadata: Metadata = {
  title: "Works",
  description:
    "これまでに取り組んだ制作・開発と、その中で担当したことを紹介します。",
};

export default async function WorksPage() {
  const works = await getAllWorks();

  return (
    <>
      <SectionPageHeader
        label="Works"
        title="つくったもの"
        description="これまでに取り組んだ制作・開発と、その中で担当したことを紹介します。"
      />
      <WorkCardList works={works} />
    </>
  );
}
