import type { APIRoute } from "astro";
import { createNotionWebhookHandler } from "@/lib/publishing/webhook-handler";
const handler = createNotionWebhookHandler();
export const POST: APIRoute = ({ request, params }) => handler(request, { params: Promise.resolve({ key: params.key ?? "" }) });
