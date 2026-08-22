import { NextResponse } from "next/server";
import fs from "node:fs/promises";

import { getAttachmentMimeType } from "@/lib/content/attachment-paths";
import { resolveAttachmentFsPath } from "@/lib/content/attachments";

type AttachmentRouteProps = {
  params: Promise<{ path: string[] }>;
};

export async function GET(
  _request: Request,
  { params }: AttachmentRouteProps,
): Promise<NextResponse> {
  const { path: pathSegments } = await params;
  const absolutePath = resolveAttachmentFsPath(pathSegments);

  if (!absolutePath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const mimeType = getAttachmentMimeType(absolutePath);
  if (!mimeType) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const file = await fs.readFile(absolutePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return new NextResponse("Not Found", { status: 404 });
    }
    throw error;
  }
}
