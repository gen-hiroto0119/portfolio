import assert from "node:assert/strict";
import test from "node:test";
import { fitOgTitle } from "./title.ts";

test("keeps short Japanese and mixed titles intact", () => {
  assert.deepEqual(fitOgTitle("RustとGPUIでつくるアプリ"), { text: "RustとGPUIでつくるアプリ", fontSize: 56 });
  assert.equal(fitOgTitle("  余白と\n文字  ").text, "余白と 文字");
});

test("bounds long titles without splitting grapheme clusters", () => {
  const title = fitOgTitle("👩‍💻".repeat(100));
  assert.equal(title.fontSize, 48);
  assert.equal(title.text, "👩‍💻".repeat(59) + "…");
  assert.equal(fitOgTitle("あ".repeat(180)).text, "あ".repeat(59) + "…");
});

test("uses the available width for Latin text", () => {
  const title = "Building small interfaces with Rust and GPUI: notes on typography";
  assert.equal(fitOgTitle(title).text, title);
  assert.equal(fitOgTitle("W".repeat(180)).text.length, 60);
});
