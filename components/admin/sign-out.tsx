"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
export function SignOut() {
  const router = useRouter(); const [error, setError] = useState(false);
  return <div><button className="text-xs text-muted-foreground hover:text-foreground" onClick={async () => {
    const { error } = await createBrowserSupabaseClient().auth.signOut();
    if (error) { setError(true); return; }
    router.replace("/admin/login"); router.refresh();
  }}>ログアウト</button>{error && <p role="alert" className="text-xs">ログアウトできませんでした。</p>}</div>;
}
