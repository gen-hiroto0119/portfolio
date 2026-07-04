import type { Metadata } from "next";

import { AboutContent } from "@/components/about/about-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Hiroto のプロフィール — デザイン、エンジニアリング、ビジネスの交差点で活動するプロダクトデザイナー。",
};

export default function AboutPage() {
  return <AboutContent />;
}
