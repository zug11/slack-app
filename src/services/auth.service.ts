import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { AppError } from "@/lib/errors";

interface RegisterInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const supabase = createClient(await cookies());

  // Check if username already taken in our users (profile) table
  const { data: existingUsername } = await supabase
    .from("users")
    .select("id")
    .eq("username", input.username)
    .maybeSingle();

  if (existingUsername) {
    throw new AppError("Username already taken", 409, "USERNAME_EXISTS");
  }

  // Sign up via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
    }
    throw new AppError(authError.message, 400, "AUTH_ERROR");
  }

  if (!authData.user) {
    throw new AppError("Registration failed", 500, "AUTH_ERROR");
  }

  // Insert profile row into users table with the auth user's ID
  const { data: user, error: profileError } = await supabase
    .from("users")
    .insert({
      id: authData.user.id,
      email: input.email,
      username: input.username,
      display_name: input.displayName,
    })
    .select()
    .single();

  if (profileError) {
    throw new AppError(profileError.message, 500, "PROFILE_ERROR");
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
  };
}

export async function loginUser(input: LoginInput) {
  const supabase = createClient(await cookies());

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

  if (authError) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (!authData.user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  // Update last_login_at on the profile
  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", authData.user.id);

  // Fetch profile
  const { data: user } = await supabase
    .from("users")
    .select("id, email, username, display_name, avatar_url")
    .eq("id", authData.user.id)
    .single();

  if (!user) {
    throw new AppError("User profile not found", 404, "PROFILE_NOT_FOUND");
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
  };
}
