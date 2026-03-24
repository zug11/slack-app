import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { handleApiError } from "@/lib/errors";

const registerSchema = z.object({
  email: z.email(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(255),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);
    const supabase = createClient(await cookies());

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }

    // Insert profile into users table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: input.email,
        username: input.username,
        display_name: input.displayName,
        password_hash: "managed-by-supabase-auth",
      })
      .select("id, email, username, display_name, avatar_url")
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return handleApiError(error);
  }
}
