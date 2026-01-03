// src/lib/api-response.ts
import { NextResponse } from "next/server";

type ApiResponseOptions<T> = {
  data?: T;
  status?: number;
  error?: string;
  meta?: Record<string, any>;
};

export function apiResponse<T>({
  data,
  status = 200,
  error,
  meta,
}: ApiResponseOptions<T>) {
  return NextResponse.json(
    {
      data: data || null,
      error: error || null,
      meta: meta || null,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
