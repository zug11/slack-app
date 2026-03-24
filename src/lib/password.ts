// Password hashing is now handled by Supabase Auth.
// These functions are kept as no-ops for backward compatibility.

export async function hashPassword(_password: string): Promise<string> {
  throw new Error(
    "Password hashing is managed by Supabase Auth. Do not call this directly."
  );
}

export async function verifyPassword(
  _password: string,
  _hash: string
): Promise<boolean> {
  throw new Error(
    "Password verification is managed by Supabase Auth. Do not call this directly."
  );
}
