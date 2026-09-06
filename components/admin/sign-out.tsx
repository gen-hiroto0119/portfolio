"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FeedbackNotice } from "@/components/feedback-notice";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
export function SignOut() {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  async function signOut() {
    if (pending) return;
    setPending(true); setError(false);
    try {
      const result = await createBrowserSupabaseClient().auth.signOut();
      if (result.error) throw result.error;
      router.replace("/admin/login"); router.refresh();
    } catch { setError(true); }
    finally { setPending(false); }
  }
  return <div>
    <button type="button" disabled={pending} className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50" onClick={() => void signOut()}>{pending ? "ログアウト中…" : "ログアウト"}</button>
    {error && <FeedbackNotice title="ログアウトを完了できませんでした" onDismiss={() => setError(false)}><p>接続を確認して、もう一度お試しください。</p><button type="button" disabled={pending} className="button" onClick={() => void signOut()}>もう一度試す</button></FeedbackNotice>}
  </div>;
}
