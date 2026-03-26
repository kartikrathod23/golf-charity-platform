import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { getEnv } from "@/lib/env";

export const AUTH_COOKIE_NAME = "golf_auth_token";

export type AuthPayload = {
  sub: string; // user id
  role: string;
  email?: string;
};

export async function signAuthToken(input: {
  userId: string;
  role: string;
  email?: string;
}): Promise<string> {
  const secret = getEnv("JWT_SECRET");

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .setAudience("golf-charity")
    .setJti(`auth_${input.userId}_${Date.now()}`)
    .sign(new TextEncoder().encode(secret));
}

export async function verifyAuthToken(token: string): Promise<AuthPayload> {
  const secret = getEnv("JWT_SECRET");

  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    audience: "golf-charity",
  });

  return coercePayload(payload);
}

function coercePayload(payload: JWTPayload): AuthPayload {
  const sub = payload.sub;
  if (!sub) throw new Error("Invalid auth token: missing subject");

  const role = payload.role;
  if (!role || typeof role !== "string") {
    throw new Error("Invalid auth token: missing role");
  }

  const email = payload.email;
  return {
    sub,
    role,
    email: typeof email === "string" ? email : undefined,
  };
}

