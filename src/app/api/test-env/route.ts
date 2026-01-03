import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    authSecretLength: process.env.AUTH_SECRET?.length || 0,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    authUrl: process.env.AUTH_URL,
    trustHost: process.env.AUTH_TRUST_HOST,
    message: "Si los largos son 0, el servidor NO está leyendo tu archivo .env",
  });
}
