import { readFile } from "node:fs/promises";
export async function GET() { return new Response(await readFile("app/icon.png"), { headers: { "Content-Type": "image/png" } }); }
