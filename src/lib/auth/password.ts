import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  // bcrypt rounds: tradeoff between security and speed.
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

