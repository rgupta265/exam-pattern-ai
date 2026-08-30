import { UserRole } from "@/lib/constants";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  permissions: string[];
}

export interface JWTPayloadData {
  sub: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  permissions: string[];
  iat?: number;
  exp?: number;
}
