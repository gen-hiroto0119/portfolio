import type { APIRoute } from "astro";
import { createNotionWebhookHandler } from "@/lib/publishing/webhook-handler";
import { reconcileBlogWorkflow, syncNotionPageWorkflow } from "../../../../workflows/publishing";
const handler = createNotionWebhookHandler(undefined, undefined, { reconcileBlogWorkflow, syncNotionPageWorkflow });
export const POST: APIRoute = ({ request, params }) => handler(request, { params: Promise.resolve({ key: params.key ?? "" }) });
