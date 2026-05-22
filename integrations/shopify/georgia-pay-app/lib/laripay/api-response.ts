import { NextResponse } from 'next/server';

export function laripayJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function laripayError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      error: {
        message,
        type: 'api_error',
        code: code || 'invalid_request',
      },
    },
    { status },
  );
}

/** @deprecated */
export const paykaJson = laripayJson;
/** @deprecated */
export const paykaError = laripayError;
