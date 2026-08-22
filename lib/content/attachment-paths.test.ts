import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveAttachmentRef,
  resolveAttachmentRelativePath,
  resolveCoverRef,
  rewriteContentImages,
  stripAttachmentsPrefix,
  type AttachmentIndex,
} from "./attachment-paths.ts";

function makeIndex(
  relativePaths: string[],
): AttachmentIndex {
  const byBasename = new Map<string, string>();
  const byRelativePath = new Set<string>();

  for (const relativePath of relativePaths) {
    byRelativePath.add(relativePath);
    const basename = relativePath.split("/").at(-1);
    if (basename) {
      byBasename.set(basename, relativePath);
    }
  }

  return { byBasename, byRelativePath };
}

describe("stripAttachmentsPrefix", () => {
  it("strips ../attachments and attachments prefixes", () => {
    assert.equal(
      stripAttachmentsPrefix("../attachments/blog/hero.png"),
      "blog/hero.png",
    );
    assert.equal(
      stripAttachmentsPrefix("attachments/hero.png"),
      "hero.png",
    );
  });
});

describe("resolveAttachmentRef", () => {
  const index = makeIndex([
    "blog/nextjs-app-router-patterns/boundary.svg",
    "shared/mark.svg",
  ]);

  it("resolves basename via index", () => {
    assert.equal(
      resolveAttachmentRef("boundary.svg", index),
      "/attachments/blog/nextjs-app-router-patterns/boundary.svg",
    );
  });

  it("resolves relative path under attachments", () => {
    assert.equal(
      resolveAttachmentRef(
        "../attachments/blog/nextjs-app-router-patterns/boundary.svg",
        index,
      ),
      "/attachments/blog/nextjs-app-router-patterns/boundary.svg",
    );
  });

  it("rejects path traversal", () => {
    assert.equal(resolveAttachmentRef("../secret.png", index), null);
  });

  it("passes through absolute https URLs", () => {
    assert.equal(
      resolveAttachmentRef("https://cdn.example.com/a.png", index),
      "https://cdn.example.com/a.png",
    );
  });
});

describe("resolveAttachmentRelativePath", () => {
  it("joins safe segments", () => {
    assert.equal(
      resolveAttachmentRelativePath(["blog", "hero.png"]),
      "blog/hero.png",
    );
  });

  it("rejects traversal segments", () => {
    assert.equal(resolveAttachmentRelativePath(["..", "hero.png"]), null);
    assert.equal(resolveAttachmentRelativePath(["blog", "..", "x.png"]), null);
  });

  it("rejects non-image extensions", () => {
    assert.equal(resolveAttachmentRelativePath(["notes.md"]), null);
  });
});

describe("rewriteContentImages", () => {
  const index = makeIndex([
    "blog/nextjs-app-router-patterns/boundary.svg",
  ]);

  it("rewrites Obsidian wiki image embeds", () => {
    const source =
      "Before\n\n![[boundary.svg|Server / Client 境界]]\n\nAfter";
    const rewritten = rewriteContentImages(source, index);
    assert.match(
      rewritten,
      /!\[Server \/ Client 境界\]\(\/attachments\/blog\/nextjs-app-router-patterns\/boundary\.svg\)/,
    );
  });

  it("rewrites relative markdown image paths", () => {
    const source =
      "![alt](../attachments/blog/nextjs-app-router-patterns/boundary.svg)";
    const rewritten = rewriteContentImages(source, index);
    assert.equal(
      rewritten,
      "![alt](/attachments/blog/nextjs-app-router-patterns/boundary.svg)",
    );
  });

  it("leaves unknown embeds untouched", () => {
    const source = "![[missing.png]]";
    assert.equal(rewriteContentImages(source, index), source);
  });
});

describe("resolveCoverRef", () => {
  const index = makeIndex(["shared/mark.svg"]);

  it("resolves attachment refs", () => {
    assert.equal(
      resolveCoverRef("mark.svg", index),
      "/attachments/shared/mark.svg",
    );
  });

  it("keeps remote covers", () => {
    assert.equal(
      resolveCoverRef("https://example.com/cover.jpg", index),
      "https://example.com/cover.jpg",
    );
  });
});
