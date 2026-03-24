import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
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

  const supabase = createClient(await cookies());

  const { data: attachment, error } = await supabase
    .from("message_attachments")
    .insert({
      message_id: messageId,
      user_id: userId,
      workspace_id: workspaceId,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type || "application/octet-stream",
      storage_url: `/api/files/${storedName}`,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return attachment;
}

export async function getAttachments(messageId: string) {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("message_attachments")
    .select("*")
    .eq("message_id", messageId);

  if (error) throw new Error(error.message);

  return data || [];
}
