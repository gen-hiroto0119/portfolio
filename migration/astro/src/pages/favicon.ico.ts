import { readFile } from "node:fs/promises";
export async function GET() { return new Response(await readFile("app/favicon.ico"), { headers: { "Content-Type": "image/x-icon" } }); }
