import type { Metadata } from "next";

import { DesignPageContent } from "@/components/design/design-page-content";
import { DesignPageHeader } from "@/components/design/design-page-header";

export const metadata: Metadata = {
  title: "Design",
  description:
    "このサイトのデザインシステム — トークン、タイポグラフィ、コンポーネントのリファレンス。",
};

export default function DesignPage() {
  return (
    <>
      <DesignPageHeader
        label="Design"
        title="このサイトの設計。"
        description="このページはサイト自身のトークンとコンポーネントをそのまま描画しています。"
      />
      <DesignPageContent />
    </>
  );
}
