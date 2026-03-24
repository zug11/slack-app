import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { registerUser } from "@/services/auth.service";
import { createSession, setSessionCookie } from "@/lib/auth";
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

    const user = await registerUser(input);
    const { token, expiresAt } = await createSession(user.id, request);
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
