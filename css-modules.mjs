import { createHash } from "node:crypto";
import { relative } from "node:path";

export function generateScopedName(name, filename) {
  const clean = filename.split("?")[0].replaceAll("\\", "/");
  const file = relative(process.cwd(), clean).replaceAll("\\", "/");
  const hash = createHash("sha256").update(`${file}\0${name}`).digest("base64url").slice(0, 5);
  const base = file.split("/").pop()?.replace(/\.module\.css$/, "") || "css";
  return `${base}__${name}___${hash}`;
}
