import { LoginForm } from "@/components/admin/login-form";
import { getSupabaseConfig } from "@/lib/supabase/config";

function loginError(code: string | string[] | undefined): string {
  if (code === "cancelled" || code === "access_denied") {
    return "GitHubでのログインが中断されました。もう一度お試しください。";
  }
  if (code === "confirmation") {
    return "ログインの確認に失敗しました。もう一度GitHubでログインしてください。";
  }
  return code ? "GitHubでログインできませんでした。もう一度お試しください。" : "";
}

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const error = loginError((await searchParams).error);

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-2xl font-medium tracking-tight">記事管理</h1>
      <p className="mt-3 mb-8 text-sm leading-7 text-muted-foreground">ログインすると、記事の作成・編集・公開ができます。</p>
      {getSupabaseConfig()
        ? <LoginForm key={error} initialError={error} />
        : <p className="text-sm text-muted-foreground">Supabaseの接続設定を確認してください。</p>}
    </div>
  );
}
