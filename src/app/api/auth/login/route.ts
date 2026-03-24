import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { handleApiError } from "@/lib/errors";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);
    const supabase = createClient(await cookies());

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, email, username, display_name, avatar_url")
      .eq("id", data.user.id)
      .single();

    return NextResponse.json({
      user: profile
        ? {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
          }
        : { id: data.user.id, email: data.user.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    return handleApiError(error);
  }
}
