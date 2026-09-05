import { NextResponse, type NextRequest } from "next/server";

import { createRouteSupabaseClient } from "@/lib/supabase/route";

function returnToLogin(error: "cancelled" | "oauth" | "confirmation") {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/admin/login?error=${error}`, "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (params.has("error") || params.has("error_code")) {
    const cancelled = params.get("error") === "access_denied" || params.get("error_code") === "access_denied";
    return returnToLogin(cancelled ? "cancelled" : "oauth");
  }

  const code = params.get("code");
  if (!code) return returnToLogin("confirmation");

  // A fixed relative Location preserves the browser's origin even when a proxy
  // normalizes request.url (for example, 127.0.0.1 to localhost in development).
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin", "Cache-Control": "private, no-store" },
  });
  try {
    const client = createRouteSupabaseClient(request, response);
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      response.headers.set("Location", "/admin/login?error=confirmation");
    }
  } catch {
    response.headers.set("Location", "/admin/login?error=confirmation");
  }
  return response;
}
