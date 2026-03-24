import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Create uploads directory
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const storedName = `${nanoid()}.${ext}`;
    const filePath = join(UPLOAD_DIR, storedName);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({
      file: {
        fileName: file.name,
        storedName,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        url: `/api/files/${storedName}`,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
