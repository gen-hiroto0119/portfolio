export type CmsErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "VALIDATION" | "DATABASE";

export class CmsError extends Error {
  constructor(public readonly code: CmsErrorCode, message: string) {
    super(message);
    this.name = "CmsError";
  }
}

export function databaseError(error: { code?: string; message: string }): CmsError {
  if (error.code === "23505") return new CmsError("CONFLICT", "同じ URL の記事がすでにあります。");
  if (error.code === "40001" || error.message.includes("CMS_REVISION_CONFLICT")) {
    return new CmsError("CONFLICT", "別のタブで更新されています。再読み込みしてから保存してください。");
  }
  if (error.code === "P0002") return new CmsError("NOT_FOUND", "記事が見つかりません。");
  if (error.code === "42501") return new CmsError("FORBIDDEN", "この操作を行う権限がありません。");
  if (error.message.includes("CMS_INVALID_ASSET")) return new CmsError("VALIDATION", "本文に利用できない画像が含まれています。");
  if (error.code === "23503") return new CmsError("CONFLICT", "記事から参照されている画像は削除できません。");
  return new CmsError("DATABASE", "保存先との通信に失敗しました。もう一度お試しください。");
}
