import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export async function getSession(): Promise<SessionUser | null> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile from users table
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
