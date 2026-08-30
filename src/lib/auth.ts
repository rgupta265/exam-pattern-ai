import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { authConfig } from "@/config/auth.config";
import { JWTPayloadData, SessionUser } from "@/types/auth.types";
import { UserRole } from "./constants";

const SECRET_KEY = new TextEncoder().encode(authConfig.jwtSecret);

export async function signToken(data: JWTPayloadData): Promise<string> {
  return new SignJWT({
    email: data.email,
    fullName: data.fullName,
    roles: data.roles,
    permissions: data.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(data.sub)
    .setIssuedAt()
    .setExpirationTime(authConfig.jwtExpiresIn)
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<JWTPayloadData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      roles: (payload.roles as UserRole[]) || [],
      permissions: (payload.permissions as string[]) || [],
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(authConfig.cookieName)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  } catch {
    return null;
  }
}
