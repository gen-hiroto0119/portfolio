"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { SiGithub } from "react-icons/si";

import { FeedbackNotice } from "@/components/feedback-notice";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function subscribeReturnError(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
function readReturnError(): string {
  // Supabase can return errors in fragments, which the server cannot read.
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (!params.has("error") && !params.has("error_code")) return "";
  const cancelled = params.get("error") === "access_denied" || params.get("error_code") === "access_denied";
  return cancelled
    ? "GitHubでのログインが中断されました。もう一度お試しください。"
    : "GitHubでログインできませんでした。もう一度お試しください。";
}
function readServerReturnError() { return ""; }

export function LoginForm({ initialError = "" }: { initialError?: string }) {
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState("");
  const returnedError = useSyncExternalStore(subscribeReturnError, readReturnError, readServerReturnError);
  const message = error || (!attempted ? returnedError || initialError : "");

  useEffect(() => {
    const resume = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false);
    };
    window.addEventListener("pageshow", resume);
    return () => window.removeEventListener("pageshow", resume);
  }, []);

  async function login() {
    if (pending) return;
    setPending(true);
    setAttempted(true);
    setError("");
    const cleanUrl = new URL(window.location.href);
    cleanUrl.hash = "";
    cleanUrl.searchParams.delete("error");
    window.history.replaceState(window.history.state, "", cleanUrl);
    try {
      const { data, error } = await createBrowserSupabaseClient().auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error || !data.url) throw error ?? new Error("OAuth redirect was not created.");
    } catch {
      setError("GitHubに接続できませんでした。時間をおいてもう一度お試しください。");
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <button type="button" className="button-primary w-full" disabled={pending} onClick={() => void login()}>
        {pending ? <Loader2 size={17} className="animate-spin" aria-hidden /> : <SiGithub size={17} aria-hidden />}
        {pending ? "GitHubに接続中…" : "GitHubでログイン"}
      </button>
      {message && <FeedbackNotice key={message} title="ログインを完了できませんでした"><p>{message}</p></FeedbackNotice>}
      <p className="text-xs leading-6 text-muted-foreground">管理者として登録されたアカウントでログインしてください。</p>
    </div>
  );
}
