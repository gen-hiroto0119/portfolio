import "server-only";

import { cache } from "react";

import { CmsError, databaseError } from "@/lib/cms/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Deduplicate checks within one server render, never across users or requests.
export const requireOwner = cache(async function requireOwner() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new CmsError("UNAUTHENTICATED", "ログインしてください。");

  const { data: owner, error } = await supabase.from("cms_owners").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error) throw databaseError(error);
  if (!owner) throw new CmsError("FORBIDDEN", "このアカウントには編集権限がありません。");
  return { supabase, user };
});
