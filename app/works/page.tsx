import type { Metadata } from "next";

import { SectionPageHeader } from "@/components/works/section-page-header";
import { WorkCardList } from "@/components/works/work-card";
import { getAllWorks } from "@/app/works/_lib/get-works";

export const metadata: Metadata = {
  title: "Works",
  description:
    "ビジネスの課題を、技術でかたちに。選ばれたプロジェクトとケーススタディ。",
};

export default async function WorksPage() {
  const works = await getAllWorks();

  return (
    <>
      <SectionPageHeader
        label="Works"
        title="ビジネスの課題を、技術でかたちに。"
        description="プロダクト設計からフロントエンド実装まで、課題の構造化と成果の可視化を軸にしたケーススタディ。"
      />
      <WorkCardList works={works} />
    </>
  );
}
