import { describe, it, expect } from "vitest";
import { RbacService } from "@/services/rbac/rbac.service";
import { PERMISSIONS, USER_ROLES } from "@/lib/constants";
import { SessionUser } from "@/types/auth.types";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

describe("RbacService", () => {
  const superAdminUser: SessionUser = {
    id: "admin-1",
    email: "superadmin@exampattern.ai",
    fullName: "Super Admin",
    roles: [USER_ROLES.SUPER_ADMIN],
    permissions: [],
  };

  const candidateUser: SessionUser = {
    id: "cand-1",
    email: "candidate@exampattern.ai",
    fullName: "Candidate One",
    roles: [USER_ROLES.CANDIDATE],
    permissions: [PERMISSIONS.CANDIDATE_SELF_ATTEMPT, PERMISSIONS.CANDIDATE_SELF_VIEW],
  };

  const reviewerUser: SessionUser = {
    id: "rev-1",
    email: "reviewer@exampattern.ai",
    fullName: "Reviewer One",
    roles: [USER_ROLES.QUESTION_REVIEWER],
    permissions: [PERMISSIONS.QUESTION_VIEW, PERMISSIONS.QUESTION_REVIEW],
  };

  it("should grant SUPER_ADMIN implicit full permissions", () => {
    expect(RbacService.hasPermission(superAdminUser, PERMISSIONS.EXAM_CREATE)).toBe(true);
    expect(RbacService.hasPermission(superAdminUser, PERMISSIONS.BLUEPRINT_LOCK)).toBe(true);
    expect(RbacService.hasPermission(superAdminUser, PERMISSIONS.AUDIT_LOG_VIEW)).toBe(true);
  });

  it("should enforce granular permissions for CANDIDATE", () => {
    expect(RbacService.hasPermission(candidateUser, PERMISSIONS.CANDIDATE_SELF_ATTEMPT)).toBe(true);
    expect(RbacService.hasPermission(candidateUser, PERMISSIONS.EXAM_CREATE)).toBe(false);
    expect(RbacService.hasPermission(candidateUser, PERMISSIONS.BLUEPRINT_LOCK)).toBe(false);
  });

  it("should enforce granular permissions for QUESTION_REVIEWER", () => {
    expect(RbacService.hasPermission(reviewerUser, PERMISSIONS.QUESTION_REVIEW)).toBe(true);
    expect(RbacService.hasPermission(reviewerUser, PERMISSIONS.QUESTION_APPROVE)).toBe(false);
    expect(RbacService.hasPermission(reviewerUser, PERMISSIONS.EXAM_DELETE)).toBe(false);
  });

  it("should correctly check hasRole and hasAnyRole", () => {
    expect(RbacService.hasRole(candidateUser, USER_ROLES.CANDIDATE)).toBe(true);
    expect(RbacService.hasRole(candidateUser, USER_ROLES.ADMIN)).toBe(false);

    expect(
      RbacService.hasAnyRole(reviewerUser, [USER_ROLES.ADMIN, USER_ROLES.QUESTION_REVIEWER])
    ).toBe(true);
    expect(
      RbacService.hasAnyRole(candidateUser, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
    ).toBe(false);
  });

  it("should throw ForbiddenError when required permission is missing", () => {
    expect(() => {
      RbacService.requirePermission(candidateUser, PERMISSIONS.EXAM_CREATE);
    }).toThrow(ForbiddenError);
  });

  it("should throw UnauthorizedError when user is null", () => {
    expect(() => {
      RbacService.requirePermission(null, PERMISSIONS.EXAM_VIEW);
    }).toThrow(UnauthorizedError);
  });
});
