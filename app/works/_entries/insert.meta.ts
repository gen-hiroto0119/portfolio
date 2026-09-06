import type { Work } from "@/app/works/_lib/schema";

export const insertWork: Work = {
  slug: "insert",
  title: "Insert",
  description:
    "作業中に試したことや考えたことを、一行ずつ残すメモアプリ。タスクごと、週ごとに読み返せます。",
  role: "Product Owner",
  stack: ["Next.js", "TypeScript"],
  featured: true,
  published: true,
};
