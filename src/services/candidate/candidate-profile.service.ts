import { prisma } from "@/lib/prisma";
import { NotFoundError, BadRequestError } from "@/lib/errors";
import { Gender } from "@prisma/client";

export class CandidateProfileService {
  /**
   * Retrieves the full candidate profile with address, educations, and experiences
   */
  public static async getProfile(userId: string) {
    let profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            preferredLocale: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        },
        address: true,
        educations: { orderBy: { completionYear: "desc" } },
        experiences: { orderBy: { startDate: "desc" } },
      },
    });

    if (!profile) {
      // Auto-initialize profile for user
      profile = await prisma.candidateProfile.create({
        data: {
          userId,
          completionPercentage: 10,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phoneNumber: true,
              avatarUrl: true,
              preferredLocale: true,
              emailVerifiedAt: true,
              createdAt: true,
            },
          },
          address: true,
          educations: true,
          experiences: true,
        },
      });
    }

    const completion = this.computeCompletionPercentage(profile);
    if (completion !== profile.completionPercentage) {
      await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: { completionPercentage: completion },
      });
      profile.completionPercentage = completion;
    }

    return profile;
  }

  /**
   * Updates personal profile information
   */
  public static async updatePersonalDetails(
    userId: string,
    data: {
      fullName?: string;
      phoneNumber?: string | null;
      dateOfBirth?: string | null;
      gender?: Gender;
      alternativePhone?: string | null;
      bio?: string | null;
    }
  ) {
    await prisma.candidateProfile.upsert({
      where: { userId },
      update: {
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        alternativePhone: data.alternativePhone !== undefined ? data.alternativePhone : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
      },
      create: {
        userId,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || Gender.PREFER_NOT_TO_SAY,
        alternativePhone: data.alternativePhone || null,
        bio: data.bio || null,
      },
    });

    if (data.fullName || data.phoneNumber !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: data.fullName ? data.fullName.trim() : undefined,
          phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : undefined,
        },
      });
    }

    return this.getProfile(userId);
  }

  /**
   * Updates or creates candidate address details
   */
  public static async updateAddress(
    userId: string,
    data: {
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      district?: string | null;
      state: string;
      postalCode: string;
      country?: string;
    }
  ) {
    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await prisma.candidateAddress.upsert({
      where: { profileId: profile.id },
      update: {
        addressLine1: data.addressLine1.trim(),
        addressLine2: data.addressLine2 ? data.addressLine2.trim() : null,
        city: data.city.trim(),
        district: data.district ? data.district.trim() : null,
        state: data.state.trim(),
        postalCode: data.postalCode.trim(),
        country: data.country ? data.country.trim() : "India",
      },
      create: {
        profileId: profile.id,
        addressLine1: data.addressLine1.trim(),
        addressLine2: data.addressLine2 ? data.addressLine2.trim() : null,
        city: data.city.trim(),
        district: data.district ? data.district.trim() : null,
        state: data.state.trim(),
        postalCode: data.postalCode.trim(),
        country: data.country ? data.country.trim() : "India",
      },
    });

    return this.getProfile(userId);
  }

  /**
   * Adds an education record
   */
  public static async addEducation(
    userId: string,
    data: {
      qualification: string;
      institution: string;
      specialization?: string | null;
      startYear: number;
      completionYear: number;
      gradeOrPercentage?: string | null;
    }
  ) {
    if (data.startYear > data.completionYear) {
      throw new BadRequestError("Start year cannot be after completion year");
    }

    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await prisma.candidateEducation.create({
      data: {
        profileId: profile.id,
        qualification: data.qualification.trim(),
        institution: data.institution.trim(),
        specialization: data.specialization ? data.specialization.trim() : null,
        startYear: data.startYear,
        completionYear: data.completionYear,
        gradeOrPercentage: data.gradeOrPercentage ? data.gradeOrPercentage.trim() : null,
      },
    });

    return this.getProfile(userId);
  }

  /**
   * Deletes an education record with strict profile ownership check
   */
  public static async deleteEducation(userId: string, educationId: string) {
    const education = await prisma.candidateEducation.findUnique({
      where: { id: educationId },
      include: { profile: true },
    });

    if (!education || education.profile.userId !== userId) {
      throw new NotFoundError("Education record not found");
    }

    await prisma.candidateEducation.delete({
      where: { id: educationId },
    });

    return this.getProfile(userId);
  }

  /**
   * Adds an experience record
   */
  public static async addExperience(
    userId: string,
    data: {
      organization: string;
      jobTitle: string;
      employmentType?: string;
      startDate: string;
      endDate?: string | null;
      isCurrent?: boolean;
      description?: string | null;
    }
  ) {
    const start = new Date(data.startDate);
    const end = data.endDate && !data.isCurrent ? new Date(data.endDate) : null;

    if (end && start > end) {
      throw new BadRequestError("Start date cannot be after end date");
    }

    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await prisma.candidateExperience.create({
      data: {
        profileId: profile.id,
        organization: data.organization.trim(),
        jobTitle: data.jobTitle.trim(),
        employmentType: data.employmentType || "Full-time",
        startDate: start,
        endDate: end,
        isCurrent: Boolean(data.isCurrent),
        description: data.description ? data.description.trim() : null,
      },
    });

    return this.getProfile(userId);
  }

  /**
   * Deletes an experience record with strict profile ownership check
   */
  public static async deleteExperience(userId: string, experienceId: string) {
    const experience = await prisma.candidateExperience.findUnique({
      where: { id: experienceId },
      include: { profile: true },
    });

    if (!experience || experience.profile.userId !== userId) {
      throw new NotFoundError("Experience record not found");
    }

    await prisma.candidateExperience.delete({
      where: { id: experienceId },
    });

    return this.getProfile(userId);
  }

  /**
   * Marks profile as finalized and submitted
   */
  public static async submitProfile(userId: string) {
    const profile = await this.getProfile(userId);
    const completion = this.computeCompletionPercentage(profile);

    const updated = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        isSubmitted: true,
        completionPercentage: completion,
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        address: true,
        educations: true,
        experiences: true,
      },
    });

    return updated;
  }

  /**
   * Computes dynamic profile completion percentage (0 - 100%)
   */
  public static computeCompletionPercentage(profile: {
    user?: { fullName?: string; phoneNumber?: string | null } | null;
    dateOfBirth?: Date | null;
    gender?: Gender | null;
    address?: unknown | null;
    educations?: unknown[] | null;
    experiences?: unknown[] | null;
  }): number {
    let score = 20; // Base registered user score

    if (profile.user?.fullName && profile.user.fullName.length > 2) score += 10;
    if (profile.user?.phoneNumber && profile.user.phoneNumber.length >= 8) score += 10;
    if (profile.dateOfBirth) score += 10;
    if (profile.gender && profile.gender !== Gender.PREFER_NOT_TO_SAY) score += 10;
    if (profile.address) score += 20;
    if (profile.educations && profile.educations.length > 0) score += 10;
    if (profile.experiences && profile.experiences.length > 0) score += 10;

    return Math.min(100, score);
  }
}
