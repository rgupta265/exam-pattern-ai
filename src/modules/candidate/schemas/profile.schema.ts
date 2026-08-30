import { z } from "zod";
import { Gender } from "@prisma/client";

export const updatePersonalSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).optional(),
  phoneNumber: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.nativeEnum(Gender).optional(),
  alternativePhone: z.string().max(20).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
});

export const updateAddressSchema = z.object({
  addressLine1: z.string().min(3, "Address line 1 is required").max(255),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().min(2, "City is required").max(100),
  district: z.string().max(100).optional().nullable(),
  state: z.string().min(2, "State is required").max(100),
  postalCode: z.string().min(4, "Postal code is required").max(20),
  country: z.string().max(100).optional().default("India"),
});

export const addEducationSchema = z.object({
  qualification: z.string().min(2, "Qualification is required").max(150),
  institution: z.string().min(2, "Institution is required").max(255),
  specialization: z.string().max(150).optional().nullable(),
  startYear: z.number().int().min(1950).max(new Date().getFullYear() + 5),
  completionYear: z.number().int().min(1950).max(new Date().getFullYear() + 5),
  gradeOrPercentage: z.string().max(50).optional().nullable(),
});

export const addExperienceSchema = z.object({
  organization: z.string().min(2, "Organization name is required").max(255),
  jobTitle: z.string().min(2, "Job title is required").max(150),
  employmentType: z.string().max(50).optional().default("Full-time"),
  startDate: z.string().min(4, "Start date is required"),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional().default(false),
  description: z.string().max(2000).optional().nullable(),
});
