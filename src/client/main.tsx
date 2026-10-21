/** @jsxImportSource hono/jsx/dom */
import { injectSpeedInsights } from "@vercel/speed-insights";
import { render } from "hono/jsx/dom";

import "../styles/global.css";
import { AsciiPortrait } from "./ascii-portrait";
import { PageRecovery } from "./page-recovery";

injectSpeedInsights();

const portrait = document.getElementById("ascii-portrait");
if (portrait) render(<AsciiPortrait />, portrait);

const recovery = document.getElementById("page-recovery");
if (recovery) render(<PageRecovery />, recovery);
