import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  // Encriptar contraseña "123456"
  const hashedPassword = await bcrypt.hash("123456", 10);

  try {
    const admin = await prisma.worker.upsert({
      where: { email: "admin@prevapp.cl" },
      update: { password: hashedPassword, role: "ADMINISTRADOR" },
      create: {
        name: "Admin Principal",
        email: "admin@prevapp.cl",
        password: hashedPassword,
        role: "ADMINISTRADOR",
        companyId: "system", // O null si lo hiciste opcional
      },
    });

    return NextResponse.json({
      success: true,
      msg: "Usuario Admin creado: admin@prevapp.cl / 123456",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
