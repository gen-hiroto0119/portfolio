"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

export function SiteNavigation() {
  const home = useSelectedLayoutSegment() === null;
  return <Link href={home ? "/blog" : "/"}>{home ? "Blog" : "Home"}</Link>;
}
