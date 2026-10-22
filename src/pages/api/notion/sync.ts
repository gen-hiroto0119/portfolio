import type { APIRoute } from "astro";
import { manualSync } from "@/lib/publishing/manual-handler";
export const POST: APIRoute = ({ request }) => manualSync(request);
