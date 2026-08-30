import { prisma } from "@/lib/prisma";
import { comparePassword, hashPassword, signToken } from "@/lib/auth";
import { ConflictError, UnauthorizedError } from "@/lib/errors";
import { LoginInput, RegisterInput } from "@/modules/auth/schemas/auth.schema";
import { UserRole } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { AuditService } from "@/services/audit/audit.service";
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "@/services/rbac/permissions";
import { UserRoleType } from "@prisma/client";

export class AuthService {
  /**
   * Register a new Candidate
   */
  static async register(input: RegisterInput, ip?: string, userAgent?: string): Promise<{ user: SessionUser; token: string }> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);

    // Get CANDIDATE role
    let candidateRole = await prisma.role.findUnique({
      where: { code: UserRoleType.CANDIDATE },
    });

    if (!candidateRole) {
      // Auto-initialize roles if not present
      await this.seedRolesAndPermissions();
      candidateRole = await prisma.role.findUnique({
        where: { code: UserRoleType.CANDIDATE },
      });
    }

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        fullName: input.fullName.trim(),
        passwordHash,
        phoneNumber: input.phoneNumber || null,
        userRoles: candidateRole
          ? {
              create: {
                roleId: candidateRole.id,
              },
            }
          : undefined,
      },
    });

    // Fetch user with roles and permissions
    const sessionUser = await this.getUserSessionData(user.id);
    if (!sessionUser) {
      throw new Error("Failed to initialize session for registered user");
    }

    const token = await signToken({
      sub: sessionUser.id,
      email: sessionUser.email,
      fullName: sessionUser.fullName,
      roles: sessionUser.roles,
      permissions: sessionUser.permissions,
    });

    await AuditService.log({
      userId: user.id,
      action: "USER_REGISTER",
      resourceType: "User",
      resourceId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return { user: sessionUser, token };
  }

  /**
   * Log in user with email & password
   */
  static async login(input: LoginInput, ip?: string, userAgent?: string): Promise<{ user: SessionUser; token: string }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status !== "ACTIVE" || user.deletedAt) {
      throw new UnauthorizedError("Account is inactive or suspended. Please contact support.");
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const sessionUser = await this.getUserSessionData(user.id);
    if (!sessionUser) {
      throw new UnauthorizedError("Failed to retrieve user permissions");
    }

    const token = await signToken({
      sub: sessionUser.id,
      email: sessionUser.email,
      fullName: sessionUser.fullName,
      roles: sessionUser.roles,
      permissions: sessionUser.permissions,
    });

    await AuditService.log({
      userId: user.id,
      action: "USER_LOGIN",
      resourceType: "User",
      resourceId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return { user: sessionUser, token };
  }

  /**
   * Retrieve full session payload for a given user ID
   */
  static async getUserSessionData(userId: string): Promise<SessionUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE" || user.deletedAt) {
      return null;
    }

    const roles: UserRole[] = user.userRoles.map((ur) => ur.role.code as UserRole);
    const permissionSet = new Set<string>();

    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions: Array.from(permissionSet),
    };
  }

  /**
   * Seed roles and permissions into database if not present
   */
  static async seedRolesAndPermissions(): Promise<void> {
    // 1. Seed Permissions
    for (const perm of ALL_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { code: perm.code },
        update: {
          name: perm.name,
          module: perm.module,
          description: perm.description,
        },
        create: {
          code: perm.code,
          name: perm.name,
          module: perm.module,
          description: perm.description,
        },
      });
    }

    // 2. Seed Roles
    const roleDefinitions: { code: UserRoleType; name: string; description: string }[] = [
      { code: UserRoleType.SUPER_ADMIN, name: "Super Administrator", description: "Full system control" },
      { code: UserRoleType.ADMIN, name: "Administrator", description: "Exam and mock test management" },
      { code: UserRoleType.QUESTION_REVIEWER, name: "Question Reviewer", description: "Reviews and validates questions" },
      { code: UserRoleType.CANDIDATE, name: "Candidate", description: "Attends mock tests and views reports" },
    ];

    for (const r of roleDefinitions) {
      const role = await prisma.role.upsert({
        where: { code: r.code },
        update: { name: r.name, description: r.description },
        create: {
          code: r.code,
          name: r.name,
          description: r.description,
          isSystem: true,
        },
      });

      // Attach default permissions
      const defaultPermCodes = DEFAULT_ROLE_PERMISSIONS[r.code as UserRole] || [];
      for (const permCode of defaultPermCodes) {
        const permRecord = await prisma.permission.findUnique({ where: { code: permCode } });
        if (permRecord) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permRecord.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permRecord.id,
            },
          });
        }
      }
    }
  }
}
