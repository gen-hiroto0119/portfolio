"use client";

import { PageRecovery } from "@/components/page-recovery";

export default function AdminError({ retry }: { retry: () => void }) {
  return <PageRecovery retry={retry} admin />;
}
