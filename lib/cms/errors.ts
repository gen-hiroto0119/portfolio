export type CmsErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "VALIDATION" | "DATABASE";
export type CmsErrorField = "title" | "slug" | "description" | "date" | "category" | "tags";

export class CmsError extends Error {
  readonly code: CmsErrorCode;
  readonly field?: CmsErrorField;
  constructor(code: CmsErrorCode, message: string, field?: CmsErrorField) {
    super(message);
    this.name = "CmsError";
    this.code = code;
    this.field = field;
  }
}

export function databaseError(error: { code?: string; message: string }): CmsError {
  if (error.code === "23505") return new CmsError("CONFLICT", "このURLは別の記事で使われています。別のURLに変更してください。", "slug");
  if (error.code === "40001" || error.message.includes("CMS_REVISION_CONFLICT")) {
    return new CmsError("CONFLICT", "別のタブで記事が更新されています。この画面の文章を控えてから、記事を開き直してください。");
  }
  if (error.code === "P0002") return new CmsError("NOT_FOUND", "記事が見つかりません。");
  if (error.code === "42501") return new CmsError("FORBIDDEN", "この操作を行う権限がありません。");
  if (error.message.includes("CMS_INVALID_ASSET")) return new CmsError("VALIDATION", "本文に利用できない画像が含まれています。");
  if (error.code === "23503") return new CmsError("CONFLICT", "記事から参照されている画像は削除できません。");
  return new CmsError("DATABASE", "保存先との通信に失敗しました。もう一度お試しください。");
}

export function publicFailure(error: unknown) {
  const known = error instanceof CmsError ? error : null;
  return {
    ok: false as const,
    code: known?.code ?? "DATABASE" as CmsErrorCode,
    error: known?.message ?? "接続を確認してから、もう一度お試しください。",
    field: known?.field,
  };
}

export function userMessage(error: unknown, fallback: string): string {
  return error instanceof CmsError ? error.message : fallback;
}
