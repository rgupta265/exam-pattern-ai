import { SessionUser } from "@/types/auth.types";
import { UserRole, PermissionCode, USER_ROLES } from "@/lib/constants";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export class RbacService {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(user: SessionUser | null | undefined, permission: PermissionCode): boolean {
    if (!user) return false;
    // SUPER_ADMIN has implicit full permissions
    if (user.roles.includes(USER_ROLES.SUPER_ADMIN)) return true;
    return user.permissions.includes(permission);
  }

  /**
   * Check if a user has ALL required permissions
   */
  static hasAllPermissions(user: SessionUser | null | undefined, permissions: PermissionCode[]): boolean {
    if (!user) return false;
    if (user.roles.includes(USER_ROLES.SUPER_ADMIN)) return true;
    return permissions.every((perm) => user.permissions.includes(perm));
  }

  /**
   * Check if a user has ANY of the specified permissions
   */
  static hasAnyPermission(user: SessionUser | null | undefined, permissions: PermissionCode[]): boolean {
    if (!user) return false;
    if (user.roles.includes(USER_ROLES.SUPER_ADMIN)) return true;
    return permissions.some((perm) => user.permissions.includes(perm));
  }

  /**
   * Check if a user has a specific role
   */
  static hasRole(user: SessionUser | null | undefined, role: UserRole): boolean {
    if (!user) return false;
    return user.roles.includes(role);
  }

  /**
   * Check if a user has ANY of the specified roles
   */
  static hasAnyRole(user: SessionUser | null | undefined, roles: UserRole[]): boolean {
    if (!user) return false;
    return roles.some((role) => user.roles.includes(role));
  }

  /**
   * Strict server-side permission guard that throws ForbiddenError / UnauthorizedError
   */
  static requirePermission(user: SessionUser | null | undefined, permission: PermissionCode): void {
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }
    if (!this.hasPermission(user, permission)) {
      throw new ForbiddenError(`Missing required permission: ${permission}`);
    }
  }

  /**
   * Strict server-side role guard that throws ForbiddenError / UnauthorizedError
   */
  static requireRole(user: SessionUser | null | undefined, roles: UserRole | UserRole[]): void {
    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (!this.hasAnyRole(user, roleList)) {
      throw new ForbiddenError(`Access denied. Requires one of roles: ${roleList.join(", ")}`);
    }
  }
}
