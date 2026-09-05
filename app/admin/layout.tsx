import type { Metadata } from "next";
export const metadata: Metadata = { title: "執筆", robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 sm:px-10">{children}</div>;
}
