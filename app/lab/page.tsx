import type { Metadata } from "next";

import { LabExperimentGrid } from "@/components/lab/lab-experiment-card";
import { LabPageHeader } from "@/components/lab/lab-page-header";
import { labExperiments } from "@/lib/lab-registry";

export const metadata: Metadata = {
  title: "Lab",
  description:
    "ブラウザで動くアニメーションや、マウスに反応する表現を試しています。",
};

export default function LabPage() {
  return (
    <>
      <LabPageHeader
        label="Lab"
        title="実験"
        description="ブラウザで動くアニメーションや、マウスに反応する表現を試しています。"
      />
      <LabExperimentGrid experiments={labExperiments} />
    </>
  );
}
