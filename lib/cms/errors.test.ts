import assert from "node:assert/strict";
import { test } from "node:test";
import { CmsError, databaseError, publicFailure, userMessage } from "./errors.ts";

test("unexpected errors never expose transport details to the UI", () => {
  const cause = new Error("fetch failed: internal.example secret=private");
  const result = publicFailure(cause);
  assert.equal(result.code, "DATABASE");
  assert.equal(result.error, "接続を確認してから、もう一度お試しください。");
  assert.equal(userMessage(cause, "画像を選び直してください。"), "画像を選び直してください。");
});

test("expected validation keeps the field and recovery instruction", () => {
  const result = publicFailure(new CmsError("VALIDATION", "概要は500文字以内で入力してください。", "description"));
  assert.equal(result.field, "description");
  assert.equal(result.error, "概要は500文字以内で入力してください。");
});

test("duplicate URL points at the URL field without exposing database detail", () => {
  const result = publicFailure(databaseError({ code: "23505", message: "duplicate key in internal_table" }));
  assert.equal(result.code, "CONFLICT");
  assert.equal(result.field, "slug");
  assert.ok(!result.error.includes("internal_table"));
});

test("revision conflicts are not treated as retryable connection failures", () => {
  const result = publicFailure(databaseError({ code: "40001", message: "CMS_REVISION_CONFLICT" }));
  assert.equal(result.code, "CONFLICT");
  assert.match(result.error, /文章を控えて/);
});
