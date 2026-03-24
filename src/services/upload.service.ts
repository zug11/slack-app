import { db } from "@/db";
import { messageAttachments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function uploadFile(
  file: File,
  userId: string,
  workspaceId: string,
  messageId: string
) {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.split(".").pop() || "bin";
  const storedName = `${nanoid()}.${ext}`;
  const filePath = join(UPLOAD_DIR, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const [attachment] = await db
    .insert(messageAttachments)
    .values({
      messageId,
      userId,
      workspaceId,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
      storageUrl: `/api/files/${storedName}`,
    })
    .returning();

  return attachment;
}

export async function getAttachments(messageId: string) {
  return db
    .select()
    .from(messageAttachments)
    .where(eq(messageAttachments.messageId, messageId));
}
