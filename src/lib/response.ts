import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, status = 200) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
  };
  return NextResponse.json(payload, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    const payload: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
    return NextResponse.json(payload, { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    const issues = error.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join(", ");
    const payload: ApiResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: `Validation failed: ${issues}`,
        details: error.issues,
      },
    };
    return NextResponse.json(payload, { status: 400 });
  }

  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  const payload: ApiResponse = {
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
    },
  };
  return NextResponse.json(payload, { status: 500 });
}
