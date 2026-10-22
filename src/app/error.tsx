"use client";

import { PageRecovery } from "@/components/page-recovery";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return <PageRecovery retry={retry} />;
}
