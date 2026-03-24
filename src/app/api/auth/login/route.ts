import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { loginUser } from "@/services/auth.service";
import { createSession, setSessionCookie } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);

    const user = await loginUser(input);
    const { token, expiresAt } = await createSession(user.id, request);
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({ user });
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
