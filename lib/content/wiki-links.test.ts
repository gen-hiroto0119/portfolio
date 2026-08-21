import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildNoteIndex,
  resolveWikiLink,
  rewriteWikiLinks,
} from "./wiki-links.ts";

const index = buildNoteIndex(
  ["nextjs-app-router-patterns", "shared-slug"],
  ["command-palette-shortcuts", "shared-slug"],
);

describe("resolveWikiLink", () => {
  it("resolves a unique blog slug", () => {
    assert.equal(
      resolveWikiLink("nextjs-app-router-patterns", index),
      "/blog/nextjs-app-router-patterns",
    );
  });

  it("resolves a unique idea slug", () => {
    assert.equal(
      resolveWikiLink("command-palette-shortcuts", index),
      "/idea/command-palette-shortcuts",
    );
  });

  it("resolves collection-prefixed targets", () => {
    assert.equal(
      resolveWikiLink("blog/nextjs-app-router-patterns", index),
      "/blog/nextjs-app-router-patterns",
    );
    assert.equal(
      resolveWikiLink("idea/command-palette-shortcuts.mdx", index),
      "/idea/command-palette-shortcuts",
    );
  });

  it("uses a prefix to disambiguate shared slugs", () => {
    assert.equal(resolveWikiLink("shared-slug", index), null);
    assert.equal(
      resolveWikiLink("blog/shared-slug", index),
      "/blog/shared-slug",
    );
    assert.equal(
      resolveWikiLink("idea/shared-slug", index),
      "/idea/shared-slug",
    );
  });

  it("returns null for unknown notes", () => {
    assert.equal(resolveWikiLink("missing-note", index), null);
    assert.equal(resolveWikiLink("blog/missing-note", index), null);
  });

  it("rejects path traversal", () => {
    assert.equal(resolveWikiLink("../secret", index), null);
  });
});

describe("rewriteWikiLinks", () => {
  it("rewrites [[note]] and [[note|label]]", () => {
    const source =
      "See [[command-palette-shortcuts]] and [[nextjs-app-router-patterns|App Router]].";
    assert.equal(
      rewriteWikiLinks(source, index),
      "See [command-palette-shortcuts](/idea/command-palette-shortcuts) and [App Router](/blog/nextjs-app-router-patterns).",
    );
  });

  it("leaves unknown notes as raw wiki syntax", () => {
    const source = "Draft: [[static-preview-draft-flow]]";
    assert.equal(rewriteWikiLinks(source, index), source);
  });

  it("does not treat image embeds as wiki links", () => {
    const source = "![[boundary.svg|キャプション]] and [[command-palette-shortcuts]]";
    assert.equal(
      rewriteWikiLinks(source, index),
      "![[boundary.svg|キャプション]] and [command-palette-shortcuts](/idea/command-palette-shortcuts)",
    );
  });

  it("strips heading fragments and still links the note", () => {
    const source = "[[command-palette-shortcuts#keys]]";
    assert.equal(
      rewriteWikiLinks(source, index),
      "[command-palette-shortcuts](/idea/command-palette-shortcuts)",
    );
  });
});
