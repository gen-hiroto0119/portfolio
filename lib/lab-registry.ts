import type { ComponentType } from "react";

import { DitherGradient } from "@/components/lab/experiments/dither-gradient";
import { OrbitLines } from "@/components/lab/experiments/orbit-lines";
import { TypeGrid } from "@/components/lab/experiments/type-grid";

export type LabExperiment = {
  id: string;
  no: string;
  title: string;
  description: string;
  date: string;
  Component: ComponentType;
};

export const labExperiments: LabExperiment[] = [
  {
    id: "orbit-lines",
    no: "001",
    title: "Orbit Lines",
    description:
      "点が回りながら、近くの点どうしを線で結びます。マウスを近づけると、点が少し引き寄せられます。",
    date: "2026-07",
    Component: OrbitLines,
  },
  {
    id: "dither-gradient",
    no: "002",
    title: "Dither Gradient",
    description:
      "Bayer行列を使い、2色の点でグラデーションを描いています。模様がゆっくり動きます。",
    date: "2026-07",
    Component: DitherGradient,
  },
  {
    id: "type-grid",
    no: "003",
    title: "Type Grid",
    description:
      "マウスを近づけると、文字の濃さ、大きさ、形が変わります。",
    date: "2026-07",
    Component: TypeGrid,
  },
];
