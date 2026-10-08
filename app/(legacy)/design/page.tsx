import type { Metadata } from "next";

import { DesignPageContent } from "@/components/design/design-page-content";
import { DesignPageHeader } from "@/components/design/design-page-header";

export const metadata: Metadata = {
  title: "Design",
  description:
    "色、文字、余白、ボタンなど、このサイトで使っているスタイルをまとめています。",
};

export default function DesignPage() {
  return (
    <>
      <DesignPageHeader
        label="Design"
        title="このサイトのデザイン"
        description="色、文字、余白、ボタンなど、このサイトで使っているスタイルをまとめています。"
      />
      <DesignPageContent />
    </>
  );
}
