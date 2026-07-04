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
      "異なる軌道で回る点群と、距離に応じて結ばれる細い線。マウスで緩く引き寄せられます。",
    date: "2026-07",
    Component: OrbitLines,
  },
  {
    id: "dither-gradient",
    no: "002",
    title: "Dither Gradient",
    description:
      "Bayer 行列による ordered dithering で 2 色のグラデーションを描画。しきい値が波打つように動きます。",
    date: "2026-07",
    Component: DitherGradient,
  },
  {
    id: "type-grid",
    no: "003",
    title: "Type Grid",
    description:
      "等間隔に敷いた文字が、マウスとの距離に応じて opacity・scale・字形が変化します。",
    date: "2026-07",
    Component: TypeGrid,
  },
];
