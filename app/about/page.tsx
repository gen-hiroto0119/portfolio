import type { Metadata } from "next";

import { AboutContent } from "@/components/about/about-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Hiroto Furugenのプロフィール。これまでの仕事や、取り組んでいることを紹介しています。",
};

export default function AboutPage() {
  return <AboutContent />;
}
