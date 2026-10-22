import { createLowlight } from "lowlight";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

const highlighter = createLowlight({ bash, css, go, javascript, json, markdown, plaintext, python, sql, typescript, xml, yaml });
highlighter.registerAlias({ typescript: ["tsx"], javascript: ["jsx"] });

// Keep large code blocks responsive on the public page.
const MAX_HIGHLIGHT_LENGTH = 20_000;

export const lowlight = {
  ...highlighter,
  highlight(language: string, code: string) {
    if (code.length > MAX_HIGHLIGHT_LENGTH) return highlighter.highlight("plaintext", code);
    try {
      return highlighter.highlight(language.toLowerCase(), code);
    } catch {
      return highlighter.highlight("plaintext", code);
    }
  },
  highlightAuto(code: string) {
    if (code.length > MAX_HIGHLIGHT_LENGTH) return highlighter.highlight("plaintext", code);
    try {
      return highlighter.highlightAuto(code);
    } catch {
      return highlighter.highlight("plaintext", code);
    }
  },
};
