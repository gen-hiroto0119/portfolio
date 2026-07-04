import type { Metadata } from "next";

import { LabExperimentGrid } from "@/components/lab/lab-experiment-card";
import { LabPageHeader } from "@/components/lab/lab-page-header";
import { labExperiments } from "@/lib/lab-registry";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "インタラクションと描画の試作を常設展示する実験室。小さな UI 実験のギャラリー。",
};

export default function LabPage() {
  return (
    <>
      <LabPageHeader
        label="Lab"
        title="実験室。"
        description="小さな実験を常設展示するギャラリー。インタラクションと描画の試作を置いています。"
      />
      <LabExperimentGrid experiments={labExperiments} />
    </>
  );
}
